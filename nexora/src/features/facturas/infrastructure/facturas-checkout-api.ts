import axios from 'axios'
import { api } from '../../../lib/api'
import { catalogApi } from '../../../shared/catalog'
import { BoundedTtlCache } from '../../../shared/lib/bounded-ttl-cache'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  formatRoomFloorLabel,
  mapCheckoutDtoToItem,
  type CheckoutInvoiceDto,
  type CheckoutInvoiceItem,
} from '../domain/factura-checkout'

export interface FetchCheckoutInvoicesResult {
  invoices: CheckoutInvoiceItem[]
  validation: StatusCodeValidationResult
}

interface StayDateSummary {
  id: string
  checkInDate: string
  checkOutDate: string
}

const checkoutListCache = new BoundedTtlCache<string, CheckoutInvoiceDto[]>(
  2,
  60 * 1000
)
const stayDatesCache = new BoundedTtlCache<string, Map<string, StayDateSummary>>(
  2,
  60 * 1000
)
let inFlightCheckoutRequest: Promise<{
  dtos: CheckoutInvoiceDto[]
  validation: StatusCodeValidationResult
}> | null = null

function extractCheckoutArray(payload: unknown): CheckoutInvoiceDto[] {
  if (Array.isArray(payload)) {
    return payload as CheckoutInvoiceDto[]
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const key of ['data', 'checkouts', 'items', 'stays', 'results']) {
      if (Array.isArray(obj[key])) {
        return obj[key] as CheckoutInvoiceDto[]
      }
    }
    if ('id_stay' in obj || 'payment_deposits' in obj || 'amount' in obj) {
      return [obj as unknown as CheckoutInvoiceDto]
    }
  }
  return []
}

function extractStayDatesMap(payload: unknown): Map<string, StayDateSummary> {
  const map = new Map<string, StayDateSummary>()
  const rawList = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).data ??
        (payload as Record<string, unknown>).stays ??
        (payload as Record<string, unknown>).items ??
        [])
      : []

  if (!Array.isArray(rawList)) return map

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const id = typeof rec.id === 'string' ? rec.id.trim() : ''
    if (!id) continue
    const checkInDate =
      typeof rec.check_in_date === 'string'
        ? rec.check_in_date
        : typeof rec.created_at === 'string'
          ? rec.created_at
          : ''
    const checkOutDate =
      typeof rec.check_out_date === 'string' ? rec.check_out_date : ''
    map.set(id, { id, checkInDate, checkOutDate })
  }
  return map
}

async function resolveContextData(params: {
  dtos: CheckoutInvoiceDto[]
  maxConcurrentRequests: number
  skipRemoteEnrichment: boolean
  forceRefresh: boolean
}): Promise<{
  roomInfoById: Map<
    string,
    { numberDisplay: string; label: string; floor: string }
  >
  personNameById: Map<string, string>
  stayDatesById: Map<string, StayDateSummary>
}> {
  const { dtos, maxConcurrentRequests, skipRemoteEnrichment, forceRefresh } =
    params
  const roomInfoById = new Map<
    string,
    { numberDisplay: string; label: string; floor: string }
  >()
  const personNameById = new Map<string, string>()

  const uniqueRoomIds = Array.from(
    new Set(dtos.map((d) => (d.id_room ?? '').trim()).filter(Boolean))
  )
  const uniquePersonIds = Array.from(
    new Set(
      dtos.flatMap((d) =>
        Array.isArray(d.id_person)
          ? d.id_person.map((p) => String(p ?? '').trim()).filter(Boolean)
          : []
      )
    )
  )

  const missingRoomIds: string[] = []
  for (const roomId of uniqueRoomIds) {
    const cached = catalogApi.getCachedRoom(roomId)
    if (cached) {
      roomInfoById.set(roomId, {
        numberDisplay: cached.number ? String(cached.number) : '—',
        label: cached.number ? `Hab. ${cached.number}` : 'Habitación asignada',
        floor: formatRoomFloorLabel(cached.floor),
      })
    } else {
      missingRoomIds.push(roomId)
    }
  }

  const missingPersonIds: string[] = []
  for (const personId of uniquePersonIds) {
    const cached = catalogApi.getCachedPerson(personId)
    if (cached?.name) {
      personNameById.set(personId, cached.name)
    } else {
      missingPersonIds.push(personId)
    }
  }

  let stayDatesById =
    (!forceRefresh ? stayDatesCache.get('stays:dates') : undefined) ??
    new Map<string, StayDateSummary>()

  if (skipRemoteEnrichment) {
    return { roomInfoById, personNameById, stayDatesById }
  }

  const needsStayDates =
    stayDatesById.size === 0 &&
    dtos.some((d) => Boolean((d.id_stay ?? '').trim()))

  if (needsStayDates) {
    try {
      const staysRes = await executeBalancedRequest(
        () => api.get<unknown>('/stays', { validateStatus: () => true }),
        { maxRetries: 1 }
      )
      if (validateStatusCode(staysRes.status).isValid) {
        stayDatesById = extractStayDatesMap(staysRes.data)
        stayDatesCache.set('stays:dates', stayDatesById)
      }
    } catch {
      // Mantiene fecha de salida desde created_at si /stays falla
    }
  }

  const batchSize = Math.max(1, maxConcurrentRequests)

  for (let i = 0; i < missingRoomIds.length; i += batchSize) {
    const chunk = missingRoomIds.slice(i, i + batchSize)
    const settled = await Promise.allSettled(
      chunk.map(async (id) => {
        const res = await catalogApi.getRoom(id)
        return { id, room: res.data }
      })
    )
    for (const entry of settled) {
      if (entry.status === 'fulfilled' && entry.value.room) {
        const { id, room } = entry.value
        roomInfoById.set(id, {
          numberDisplay: room.number ? String(room.number) : '—',
          label: room.number ? `Hab. ${room.number}` : 'Habitación asignada',
          floor: formatRoomFloorLabel(room.floor),
        })
      }
    }
  }

  for (let i = 0; i < missingPersonIds.length; i += batchSize) {
    const chunk = missingPersonIds.slice(i, i + batchSize)
    const settled = await Promise.allSettled(
      chunk.map(async (id) => {
        const res = await catalogApi.getPerson(id)
        return { id, name: res.data?.name?.trim() || '' }
      })
    )
    for (const entry of settled) {
      if (entry.status === 'fulfilled' && entry.value.name) {
        personNameById.set(entry.value.id, entry.value.name)
      }
    }
  }

  return { roomInfoById, personNameById, stayDatesById }
}

/**
 * Consulta `GET /stay/all/checkout` aplicando balanceo de carga (`api-load-balancer.ts`)
 * y validación de códigos HTTP (`status-code-validator.ts`).
 */
export async function fetchCheckoutInvoices(options: {
  forceRefresh?: boolean
  maxConcurrentRequests?: number
  skipRemoteEnrichment?: boolean
} = {}): Promise<FetchCheckoutInvoicesResult> {
  const {
    forceRefresh = false,
    maxConcurrentRequests = 4,
    skipRemoteEnrichment = false,
  } = options
  const cacheKey = 'checkout:all'

  try {
    let rawResult: {
      dtos: CheckoutInvoiceDto[]
      validation: StatusCodeValidationResult
    }

    const cachedDtos = !forceRefresh ? checkoutListCache.get(cacheKey) : undefined
    if (cachedDtos) {
      rawResult = {
        dtos: cachedDtos,
        validation: validateStatusCode(200),
      }
    } else if (!forceRefresh && inFlightCheckoutRequest) {
      rawResult = await inFlightCheckoutRequest
    } else {
      const requestPromise = (async () => {
        try {
          const response = await executeBalancedRequest(
            () =>
              api.get<unknown>('/stay/all/checkout', {
                validateStatus: () => true,
              }),
            { maxRetries: 2 }
          )

          const validation = validateStatusCode(response.status)
          if (!validation.isValid) {
            return { dtos: [], validation }
          }

          const dtos = extractCheckoutArray(response.data)
          checkoutListCache.set(cacheKey, dtos)
          return { dtos, validation }
        } catch (err) {
          const status = axios.isAxiosError(err)
            ? (err.response?.status ?? 500)
            : 500
          return {
            dtos: [],
            validation: validateStatusCode(status),
          }
        } finally {
          inFlightCheckoutRequest = null
        }
      })()

      inFlightCheckoutRequest = requestPromise
      rawResult = await requestPromise
    }

    if (!rawResult.validation.isValid) {
      return {
        invoices: [],
        validation: rawResult.validation,
      }
    }

    const { roomInfoById, personNameById, stayDatesById } =
      await resolveContextData({
        dtos: rawResult.dtos,
        maxConcurrentRequests,
        skipRemoteEnrichment,
        forceRefresh,
      })

    const invoices = rawResult.dtos
      .map((dto) => {
        const roomMeta = dto.id_room
          ? roomInfoById.get(dto.id_room.trim())
          : undefined
        const stayMeta = dto.id_stay
          ? stayDatesById.get(dto.id_stay.trim())
          : undefined
        const guestNames = Array.isArray(dto.id_person)
          ? dto.id_person
              .map((pid) => personNameById.get(String(pid ?? '').trim()))
              .filter((name): name is string => Boolean(name))
          : []

        return mapCheckoutDtoToItem(dto, {
          roomNumberDisplay: roomMeta?.numberDisplay,
          roomLabel: roomMeta?.label,
          roomFloor: roomMeta?.floor,
          guestNames,
          checkInDate: stayMeta?.checkInDate,
          checkOutDate: stayMeta?.checkOutDate,
        })
      })
      .sort((a, b) => {
        const ta = new Date(a.createdAtRaw).getTime() || 0
        const tb = new Date(b.createdAtRaw).getTime() || 0
        return tb - ta
      })

    return {
      invoices,
      validation: rawResult.validation,
    }
  } catch (error) {
    console.error(
      '[fetchCheckoutInvoices] Error al consultar /stay/all/checkout:',
      error
    )
    const status = axios.isAxiosError(error)
      ? (error.response?.status ?? 500)
      : 500
    return {
      invoices: [],
      validation: validateStatusCode(status),
    }
  }
}
