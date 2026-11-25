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
  formatStayDateAndTime,
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
  room_id?: string
  reservation_id?: string
  person_id?: string
  person_ids?: string[]
  persons?: Array<string | { id?: string; person_id?: string }>
  check_in_date?: string
  check_out_date?: string
  payment_method?: string
  created_at?: string
  total_price?: number
  total?: number
  price?: number
  security_deposit?: number
  status?: string
  state?: string
}

interface RoomBasicDto {
  id?: string
  number?: string
  floor?: number
  room_types_id?: string
  building_id?: string
  price_override?: number | null
  price?: number | null
  status?: string
  has_reception?: boolean
}

interface GuestLinkMeta {
  hasReception: boolean
  hasReservation: boolean
  receptionCount: number
  receptionsTotal: number
  reservesTotal: number
  countedRecordKeys: Set<string>
  checkInDates: string[]
  checkOutDates: string[]
  roomId?: string
  stayId?: string
  reserveId?: string
  securityDeposit?: number
  depositPaymentMethod?: string
  stayStatus?: string
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

function resolveRecordChargeAmount(
  record: StayOrReserveLinkDto,
  roomMap?: ReadonlyMap<string, RoomBasicDto>,
): number {
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
  if (record.room_id && roomMap) {
    const room = roomMap.get(record.room_id.trim())
    const unitRate = Number(room?.price_override ?? room?.price ?? 0)
    if (unitRate > 0) {
      const checkIn = record.check_in_date ? new Date(record.check_in_date) : null
      const checkOut = record.check_out_date ? new Date(record.check_out_date) : null
      if (
        checkIn &&
        checkOut &&
        !Number.isNaN(checkIn.getTime()) &&
        !Number.isNaN(checkOut.getTime())
      ) {
        const nights = Math.max(
          1,
          Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000),
        )
        return nights * unitRate
      }
      return unitRate
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
  recordKey?: string,
  extra?: {
    checkInDate?: string
    roomId?: string
    stayId?: string
    reserveId?: string
    securityDeposit?: number | string
    paymentMethod?: string
    stayStatus?: string
  },
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
    checkInDates: [],
    checkOutDates: [],
  }

  if (source === 'recepcion') current.hasReception = true
  if (source === 'reserva') current.hasReservation = true
  if (extra?.checkInDate) current.checkInDates.push(extra.checkInDate)
  if (checkOutDate) current.checkOutDates.push(checkOutDate)
  if (extra?.roomId && (!current.roomId || source === 'recepcion')) {
    current.roomId = extra.roomId
  }
  if (extra?.stayId && source === 'recepcion') {
    current.stayId = extra.stayId
  }
  if (extra?.reserveId && (!current.reserveId || source === 'reserva')) {
    current.reserveId = extra.reserveId
  }
  const dep = Number(extra?.securityDeposit ?? 0)
  if (Number.isFinite(dep) && dep > 0 && !current.securityDeposit) {
    current.securityDeposit = dep
  }
  if (extra?.paymentMethod?.trim() && (!current.depositPaymentMethod || source === 'recepcion')) {
    current.depositPaymentMethod = extra.paymentMethod.trim()
  }
  if (extra?.stayStatus && (!current.stayStatus || source === 'recepcion')) {
    current.stayStatus = extra.stayStatus
  }

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
  linkMeta?: GuestLinkMeta,
  roomMap?: ReadonlyMap<string, RoomBasicDto>,
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

  const candidateCheckOuts = [...(linkMeta?.checkOutDates ?? [])]
  const inlineCheckOut = dto.check_out_date ?? dto.checkout_date
  if (inlineCheckOut) candidateCheckOuts.push(inlineCheckOut)

  const { checkOutDateRaw, departureWindow } =
    pickBestCheckOutDate(candidateCheckOuts)

  const checkInDateRaw =
    linkMeta?.checkInDates && linkMeta.checkInDates.length > 0
      ? linkMeta.checkInDates[linkMeta.checkInDates.length - 1]
      : null

  const checkInFmt = formatStayDateAndTime(
    checkInDateRaw,
    linkMeta?.hasReception ? '02:00 p. m.' : '—',
  )
  const checkOutFmt = formatStayDateAndTime(
    checkOutDateRaw,
    checkOutDateRaw ? '01:00 p. m.' : '—',
  )

  const roomInfo =
    linkMeta?.roomId && roomMap ? roomMap.get(linkMeta.roomId.trim()) : undefined

  const checkInWindow = classifyDepartureWindow(checkInDateRaw)
  const isTodayActivity =
    departureWindow === 'hoy' ||
    checkInWindow === 'hoy' ||
    Boolean(linkMeta?.hasReception && roomInfo?.status === 'occupied')

  const personId = resolvePersonId(dto)

  return {
    internalKey:
      personId || `${dto.document_number ?? 'guest'}-${index}`,
    personId,
    name,
    phoneNumber: dto.phone_number?.trim() || '',
    email: dto.email?.trim() || '',
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
    deliveredServiceOrdersCount: 0,
    deliveredServiceRequestsTotal: 0,
    serviceRequestProducts: [],
    serviceRequestOrders: [],
    checkInDateRaw,
    checkInDateFormatted: checkInFmt.dateText,
    checkInTimeFormatted: checkInFmt.timeText,
    checkOutDateRaw,
    checkOutDateFormatted: checkOutFmt.dateText,
    checkOutTimeFormatted: checkOutFmt.timeText,
    departureWindow,
    departureLabel: formatDepartureLabel(checkOutDateRaw, departureWindow),
    roomId: linkMeta?.roomId || '',
    primaryRoomId: linkMeta?.roomId || undefined,
    roomNumber: roomInfo?.number ? `Hab. ${roomInfo.number}` : '',
    roomFloor:
      typeof roomInfo?.floor === 'number' ? `Piso ${roomInfo.floor}` : '',
    roomStatus: roomInfo?.status || '',
    stayId: linkMeta?.stayId || '',
    primaryStayId: linkMeta?.stayId || undefined,
    primaryReserveId: linkMeta?.reserveId || undefined,
    securityDeposit: linkMeta?.securityDeposit ?? 0,
    depositPaymentMethod: linkMeta?.depositPaymentMethod || undefined,
    stayStatus: linkMeta?.stayStatus || '',
    isTodayActivity,
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

      const [personsRes, staysRes, reservesRes, roomsRes] =
        await Promise.allSettled([
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
          executeBalancedRequest(
            () =>
              api.get<unknown>('/room', {
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

      const roomMap = new Map<string, RoomBasicDto>()
      if (
        roomsRes.status === 'fulfilled' &&
        validateStatusCode(roomsRes.value.status).isValid
      ) {
        const rooms = extractArray<RoomBasicDto>(roomsRes.value.data, [
          'rooms',
          'data',
          'items',
        ])
        for (const room of rooms) {
          if (room.id?.trim()) {
            roomMap.set(room.id.trim(), room)
          }
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
          const reserveAmount = resolveRecordChargeAmount(reserve, roomMap)
          for (const pid of ids) {
            registerGuestLink(
              linkMap,
              pid,
              'reserva',
              reserve.check_out_date,
              reserveAmount,
              reserveKey,
              {
                checkInDate: reserve.check_in_date || reserve.created_at,
                roomId: reserve.room_id,
                reserveId: reserve.id,
                securityDeposit: reserve.security_deposit,
                paymentMethod: reserve.payment_method,
                stayStatus: reserve.status,
              },
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
          const stayAmount = resolveRecordChargeAmount(stay, roomMap)
          for (const pid of ids) {
            registerGuestLink(
              linkMap,
              pid,
              'recepcion',
              stay.check_out_date,
              stayAmount,
              stayKey,
              {
                checkInDate: stay.check_in_date || stay.created_at,
                roomId: stay.room_id,
                stayId: stay.id,
                reserveId: stay.reservation_id,
                securityDeposit: stay.security_deposit,
                paymentMethod: stay.payment_method,
                stayStatus: stay.status,
              },
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

    // Retornamos todas las personas registradas enriquecidas con su habitación, recepción y reserva,
    // ordenando primero los huéspedes con recepción activa / actividad hoy
    const guests: SalidaHuespedItem[] = rawPersons
      .map((person, idx) => {
        const pid = resolvePersonId(person)
        return mapPersonToSalidaItem(
          person,
          idx,
          pid ? linkMap.get(pid) : undefined,
          roomMap,
        )
      })
      .sort((a, b) => {
        const scoreA =
          (a.roomNumber ? 4 : 0) +
          (a.sourceKind !== 'registrado' ? 2 : 0) +
          (a.departureWindow === 'hoy' ? 1 : 0)
        const scoreB =
          (b.roomNumber ? 4 : 0) +
          (b.sourceKind !== 'registrado' ? 2 : 0) +
          (b.departureWindow === 'hoy' ? 1 : 0)
        return scoreB - scoreA
      })

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

/**
 * Ejecuta el Check-out de la habitación asociada al huésped:
 * pasa la habitación a estado 'cleaning' y libera `has_reception`.
 */
export async function performGuestCheckout(
  guest: SalidaHuespedItem,
): Promise<{ ok: boolean; message: string }> {
  if (!guest.roomId) {
    return {
      ok: true,
      message: `Cuenta liquidada y salida registrada para ${guest.name}.`,
    }
  }

  try {
    const roomRes = await api.get<RoomBasicDto>(
      `/room/${encodeURIComponent(guest.roomId)}`,
      { validateStatus: () => true },
    )
    if (roomRes.status >= 200 && roomRes.status < 300 && roomRes.data) {
      const r = roomRes.data
      await api.put(
        `/room/${encodeURIComponent(guest.roomId)}`,
        {
          number: r.number ?? '',
          floor: Number(r.floor ?? 1),
          room_types_id: r.room_types_id ?? '',
          building_id: r.building_id ?? '',
          price_override: r.price_override ?? null,
          status: 'cleaning',
          has_reception: false,
        },
        { validateStatus: () => true },
      )
    }
    return {
      ok: true,
      message: `Check-out completado para ${guest.name}. ${guest.roomNumber || 'La habitación'} pasó a limpieza.`,
    }
  } catch {
    return {
      ok: false,
      message: 'No se pudo actualizar el estado de la habitación durante el Check-out.',
    }
  }
}
