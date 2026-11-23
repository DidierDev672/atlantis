import axios from 'axios'
import { api } from '../../../lib/api'
import { catalogApi } from '../../../shared/catalog'
import { BoundedTtlCache } from '../../../shared/lib/bounded-ttl-cache'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import { detectarRecursosDispositivoRecepciones } from './recepciones-resource-detector'
import type { StayItem } from '../domain/stay'
import {
  buildReceptionCountMap,
  classifyDepartureWindow,
  findReceptionsByPersonId,
  formatDepartureLabel,
  formatSalidaBirthDate,
  formatSalidaDocumentType,
  formatSalidaGender,
  formatSourceLabel,
  getUniquePersonIdsFromRecord,
  isCanceledStayOrReserve,
  resolvePersonId,
  type DepartureWindow,
  type GuestSourceKind,
  type PersonApiDto,
  type ReceptionRecordRef,
  type SalidaHuespedItem,
} from '../domain/salida-huesped'

const stayPersonsCache = new BoundedTtlCache<string, string[]>(200, 2 * 60 * 1000)
const inFlightStayPersons = new Map<string, Promise<string[]>>()
const salidasSummaryCache = new BoundedTtlCache<string, FetchSalidasHuespedesResult>(
  2,
  90 * 1000
)
let inFlightSalidasRequest: Promise<FetchSalidasHuespedesResult> | null = null

export interface FetchSalidasOptions {
  prefetchedStays?: StayItem[]
  forceRefresh?: boolean
}

interface StayOrReserveLinkDto extends ReceptionRecordRef {
  id?: string
  reservation_id?: string
  person_id?: string
  person_ids?: string[]
  persons?: Array<string | { id?: string; person_id?: string }>
  check_out_date?: string
  total_price?: number
  total?: number
  price?: number
  security_deposit?: number
  status?: string
  state?: string
}

interface GuestLinkMeta {
  hasReception: boolean
  hasReservation: boolean
  receptionCount: number
  receptionsTotal: number
  reservesTotal: number
  countedRecordKeys: Set<string>
  checkOutDates: string[]
}

export interface FetchSalidasHuespedesResult {
  guests: SalidaHuespedItem[]
  validation: StatusCodeValidationResult
  hasLinkData: boolean
}

function extractArray<T extends object>(
  payload: unknown,
  keys: string[]
): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const key of keys) {
      if (Array.isArray(obj[key])) {
        return obj[key] as T[]
      }
    }
    if ('document_number' in obj || 'name' in obj || 'id' in obj) {
      return [obj as T]
    }
  }
  return []
}

function resolveRecordChargeAmount(record: StayOrReserveLinkDto): number {
  const candidates = [
    record.total_price,
    record.total,
    record.price,
    record.security_deposit,
  ]
  for (const val of candidates) {
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
      return val
    }
  }
  return 0
}

function registerGuestLink(
  map: Map<string, GuestLinkMeta>,
  personId: string,
  source: 'recepcion' | 'reserva',
  checkOutDate?: string,
  amount = 0,
  recordKey?: string
): void {
  const cleanId = personId.trim()
  if (!cleanId) return

  const current = map.get(cleanId) ?? {
    hasReception: false,
    hasReservation: false,
    receptionCount: 0,
    receptionsTotal: 0,
    reservesTotal: 0,
    countedRecordKeys: new Set<string>(),
    checkOutDates: [],
  }

  if (source === 'recepcion') current.hasReception = true
  if (source === 'reserva') current.hasReservation = true
  if (checkOutDate) current.checkOutDates.push(checkOutDate)

  if (amount > 0 && recordKey) {
    const scopedKey = `${source}:${recordKey}`
    if (!current.countedRecordKeys.has(scopedKey)) {
      current.countedRecordKeys.add(scopedKey)
      if (source === 'recepcion') current.receptionsTotal += amount
      if (source === 'reserva') current.reservesTotal += amount
    }
  }

  map.set(cleanId, current)
}

function pickBestCheckOutDate(dates: string[]): {
  checkOutDateRaw: string | null
  departureWindow: DepartureWindow
} {
  if (dates.length === 0) {
    return { checkOutDateRaw: null, departureWindow: 'sin_fecha' }
  }

  const withWindow = dates.map((d) => ({
    raw: d,
    window: classifyDepartureWindow(d),
  }))

  const todayMatch = withWindow.find((item) => item.window === 'hoy')
  if (todayMatch) {
    return { checkOutDateRaw: todayMatch.raw, departureWindow: 'hoy' }
  }

  const tomorrowMatch = withWindow.find((item) => item.window === 'manana')
  if (tomorrowMatch) {
    return { checkOutDateRaw: tomorrowMatch.raw, departureWindow: 'manana' }
  }

  return {
    checkOutDateRaw: withWindow[0].raw,
    departureWindow: withWindow[0].window,
  }
}

function resolvePersonName(dto: PersonApiDto): string {
  const direct = dto.name?.trim()
  if (direct) return direct
  const full = `${dto.first_name ?? ''} ${dto.last_name ?? ''}`.trim()
  return full || 'Huésped sin nombre registrado'
}

function mapPersonToSalidaItem(
  dto: PersonApiDto,
  index: number,
  linkMeta?: GuestLinkMeta
): SalidaHuespedItem {
  const name = resolvePersonName(dto)
  const docTypeRaw = dto.document_type ?? ''
  const genderRaw = dto.gender ?? ''
  const dobRaw = dto.date_of_birth ?? ''

  const genderInfo = formatSalidaGender(genderRaw)
  const birthInfo = formatSalidaBirthDate(dobRaw)

  let sourceKind: GuestSourceKind = 'registrado'
  if (linkMeta) {
    if (linkMeta.hasReception && linkMeta.hasReservation) {
      sourceKind = 'ambos'
    } else if (linkMeta.hasReception) {
      sourceKind = 'recepcion'
    } else if (linkMeta.hasReservation) {
      sourceKind = 'reserva'
    }
  }

  const candidateDates = [...(linkMeta?.checkOutDates ?? [])]
  const inlineCheckOut = dto.check_out_date ?? dto.checkout_date
  if (inlineCheckOut) candidateDates.push(inlineCheckOut)

  const { checkOutDateRaw, departureWindow } =
    pickBestCheckOutDate(candidateDates)

  const personId = resolvePersonId(dto)

  return {
    internalKey:
      personId || `${dto.document_number ?? 'guest'}-${index}`,
    personId,
    name,
    phoneNumber: dto.phone_number?.trim() || '',
    documentTypeRaw: docTypeRaw,
    documentTypeLabel: formatSalidaDocumentType(docTypeRaw),
    documentNumber: dto.document_number?.trim() || 'No registrado',
    dateOfBirthRaw: dobRaw,
    dateOfBirthFormatted: birthInfo.formatted,
    ageText: birthInfo.ageText,
    genderRaw,
    genderLabel: genderInfo.label,
    genderTone: genderInfo.tone,
    sourceKind,
    sourceLabel: formatSourceLabel(sourceKind),
    receptionCount: linkMeta?.receptionCount ?? 0,
    serviceRequestCount: 0,
    receptionsTotal: linkMeta?.receptionsTotal ?? 0,
    reservesTotal: linkMeta?.reservesTotal ?? 0,
    serviceRequestsTotal: 0,
    serviceRequestProducts: [],
    checkOutDateRaw,
    departureWindow,
    departureLabel: formatDepartureLabel(checkOutDateRaw, departureWindow),
  }
}

async function fetchStayPersonsByStayIds(
  stayIds: string[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  const uniqueIds = Array.from(
    new Set(stayIds.map((id) => id.trim()).filter(Boolean))
  )
  if (uniqueIds.length === 0) return result

  const missingIds: string[] = []
  for (const stayId of uniqueIds) {
    const cached = stayPersonsCache.get(stayId)
    if (cached !== undefined) {
      if (cached.length > 0) {
        result.set(stayId, cached)
      }
      continue
    }
    missingIds.push(stayId)
  }

  if (missingIds.length === 0) return result

  const fetchSingleStayPersons = (stayId: string): Promise<string[]> => {
    const existing = inFlightStayPersons.get(stayId)
    if (existing) return existing

    const req = (async () => {
      try {
        const res = await executeBalancedRequest(
          () =>
            api.get<unknown>(
              `/stays_person/${encodeURIComponent(stayId)}`,
              { validateStatus: () => true }
            ),
          { maxRetries: 0 }
        )
        if (validateStatusCode(res.status).isValid) {
          const persons = extractArray<PersonApiDto>(res.data, [
            'persons',
            'data',
            'items',
          ])
          const ids = persons.map((p) => resolvePersonId(p)).filter(Boolean)
          stayPersonsCache.set(stayId, ids)
          return ids
        }
        if (res.status === 404) {
          stayPersonsCache.set(stayId, [])
        }
        return []
      } catch {
        return []
      } finally {
        inFlightStayPersons.delete(stayId)
      }
    })()

    inFlightStayPersons.set(stayId, req)
    return req
  }

  const concurrency = Math.max(
    1,
    detectarRecursosDispositivoRecepciones().policy.stayPersonsConcurrency
  )
  let cursor = 0

  async function worker() {
    while (cursor < missingIds.length) {
      const idx = cursor++
      const stayId = missingIds[idx]
      const ids = await fetchSingleStayPersons(stayId)
      if (ids.length > 0) {
        result.set(stayId, ids)
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, missingIds.length) }, () =>
      worker()
    )
  )
  return result
}

export interface FetchReceptionsByPersonIdResult {
  stays: StayOrReserveLinkDto[]
  count: number
  validation: StatusCodeValidationResult
}

/**
 * Consulta las recepciones de un huésped en `GET /stays` usando su `id`
 * (`person_id`) como parámetro de búsqueda.
 */
export async function fetchReceptionsByPersonId(
  personId: string
): Promise<FetchReceptionsByPersonIdResult> {
  const targetId = personId.trim()
  if (!targetId) {
    return {
      stays: [],
      count: 0,
      validation: validateStatusCode(400),
    }
  }

  try {
    const response = await executeBalancedRequest(
      () =>
        api.get<unknown>('/stays', {
          params: { person_id: targetId },
          validateStatus: () => true,
        }),
      { maxRetries: 2 }
    )
    const validation = validateStatusCode(response.status)
    if (!validation.isValid) {
      return { stays: [], count: 0, validation }
    }

    const stays = extractArray<StayOrReserveLinkDto>(response.data, [
      'stays',
      'data',
      'items',
    ])
    const matched = findReceptionsByPersonId(targetId, stays)
    return {
      stays: matched,
      count: matched.length,
      validation,
    }
  } catch (error) {
    const status = axios.isAxiosError(error)
      ? (error.response?.status ?? 500)
      : 500
    return {
      stays: [],
      count: 0,
      validation: validateStatusCode(status),
    }
  }
}

export async function fetchSalidasHuespedes(
  options: FetchSalidasOptions = {}
): Promise<FetchSalidasHuespedesResult> {
  const cacheKey = 'salidas:latest'

  if (!options.forceRefresh) {
    const cached = salidasSummaryCache.get(cacheKey)
    if (cached) return cached
    if (inFlightSalidasRequest) return inFlightSalidasRequest
  }

  const executeFetch = async (): Promise<FetchSalidasHuespedesResult> => {
    try {
      const hasPrefetchedStays =
        Array.isArray(options.prefetchedStays) &&
        options.prefetchedStays.length > 0
      const { maxRetries } = detectarRecursosDispositivoRecepciones().policy

      const [personsRes, staysRes, reservesRes] = await Promise.allSettled([
        executeBalancedRequest(
          () =>
            api.get<unknown>('/persons', {
              validateStatus: () => true,
            }),
          { maxRetries }
        ),
        hasPrefetchedStays
          ? Promise.resolve({
              status: 200,
              data: options.prefetchedStays,
            })
          : executeBalancedRequest(
              () =>
                api.get<unknown>('/stays', {
                  validateStatus: () => true,
                }),
              { maxRetries }
            ),
        executeBalancedRequest(
          () =>
            api.get<unknown>('/reserve', {
              validateStatus: () => true,
            }),
          { maxRetries }
        ),
      ])

    if (personsRes.status === 'rejected') {
      const err = personsRes.reason
      const status = axios.isAxiosError(err) ? (err.response?.status ?? 500) : 500
      return {
        guests: [],
        validation: validateStatusCode(status),
        hasLinkData: false,
      }
    }

    const personsResponse = personsRes.value
    const validation = validateStatusCode(personsResponse.status)

    if (!validation.isValid) {
      return {
        guests: [],
        validation,
        hasLinkData: false,
      }
    }

    const rawPersons = extractArray<PersonApiDto>(personsResponse.data, [
      'persons',
      'data',
      'items',
    ])

    // Pre-cargar personas en el catálogo compartido para evitar GET /person/{id} posteriores
    for (const person of rawPersons) {
      const pid = resolvePersonId(person)
      if (pid) {
        catalogApi.primePerson({
          id: pid,
          name: resolvePersonName(person),
          document_type: person.document_type,
          document_number: person.document_number,
          phone_number: person.phone_number,
          email: person.email,
          date_of_birth: person.date_of_birth,
          gender: person.gender,
        })
      }
    }

    const linkMap = new Map<string, GuestLinkMeta>()
    const reservePersonIdsMap = new Map<string, string[]>()
    let staysAvailable = false
    let reservesAvailable = false

    if (reservesRes.status === 'fulfilled') {
      const reservesValidation = validateStatusCode(reservesRes.value.status)
      if (reservesValidation.isValid) {
        reservesAvailable = true
        const reserves = extractArray<StayOrReserveLinkDto>(
          reservesRes.value.data,
          ['reserves', 'stays', 'data', 'items']
        )
        reserves.forEach((reserve, reserveIndex) => {
          if (isCanceledStayOrReserve(reserve)) return
          const ids = getUniquePersonIdsFromRecord(reserve)
          if (reserve.id?.trim() && ids.length > 0) {
            reservePersonIdsMap.set(reserve.id.trim(), ids)
          }
          const reserveKey = reserve.id?.trim() || `reserve-${reserveIndex}`
          const reserveAmount = resolveRecordChargeAmount(reserve)
          for (const pid of ids) {
            registerGuestLink(
              linkMap,
              pid,
              'reserva',
              reserve.check_out_date,
              reserveAmount,
              reserveKey
            )
          }
        })
      }
    }

    if (staysRes.status === 'fulfilled') {
      const staysValidation = validateStatusCode(staysRes.value.status)
      if (staysValidation.isValid) {
        staysAvailable = true
        const stays = extractArray<StayOrReserveLinkDto>(
          staysRes.value.data,
          ['stays', 'data', 'items']
        )

        const staysMissingPersons = stays
          .filter((stay) => {
            if (isCanceledStayOrReserve(stay) || !stay.id?.trim()) return false
            return (
              getUniquePersonIdsFromRecord(stay, { reservePersonIdsMap })
                .length === 0
            )
          })
          .map((stay) => stay.id!.trim())

        const stayPersonIdsMap =
          await fetchStayPersonsByStayIds(staysMissingPersons)

        const lookupOptions = { reservePersonIdsMap, stayPersonIdsMap }
        const receptionCounts = buildReceptionCountMap(stays, lookupOptions)

        stays.forEach((stay, stayIndex) => {
          if (isCanceledStayOrReserve(stay)) return
          const ids = getUniquePersonIdsFromRecord(stay, lookupOptions)
          const stayKey = stay.id?.trim() || `stay-${stayIndex}`
          const stayAmount = resolveRecordChargeAmount(stay)
          for (const pid of ids) {
            registerGuestLink(
              linkMap,
              pid,
              'recepcion',
              stay.check_out_date,
              stayAmount,
              stayKey
            )
            if (stay.reservation_id) {
              registerGuestLink(
                linkMap,
                pid,
                'reserva',
                stay.check_out_date
              )
            }
          }
        })
        for (const [pid, count] of receptionCounts.entries()) {
          const meta = linkMap.get(pid)
          if (meta) {
            meta.receptionCount = count
          }
        }
      }
    }

    const hasLinkData = staysAvailable || reservesAvailable
    const hasAnyPersonIds = rawPersons.some((p) => Boolean(resolvePersonId(p)))

    const guests: SalidaHuespedItem[] =
      hasLinkData && hasAnyPersonIds
        ? rawPersons
            .filter((person) => {
              const pid = resolvePersonId(person)
              return Boolean(pid && linkMap.has(pid))
            })
            .map((person, idx) => {
              const pid = resolvePersonId(person)
              return mapPersonToSalidaItem(
                person,
                idx,
                pid ? linkMap.get(pid) : undefined
              )
            })
        : rawPersons.map((person, idx) => mapPersonToSalidaItem(person, idx))

      const finalResult: FetchSalidasHuespedesResult = {
        guests,
        validation,
        hasLinkData,
      }
      salidasSummaryCache.set(cacheKey, finalResult)
      return finalResult
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? (error.response?.status ?? 500)
        : 500
      return {
        guests: [],
        validation: validateStatusCode(status),
        hasLinkData: false,
      }
    } finally {
      inFlightSalidasRequest = null
    }
  }

  inFlightSalidasRequest = executeFetch()
  return inFlightSalidasRequest
}
