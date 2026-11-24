import { api } from '../../../lib/api'
import {
  getActiveHeadquarterId,
  readAuthUser,
} from '../../../shared/auth-storage'
import { catalogApi } from '../../../shared/catalog'
import { BoundedTtlCache } from '../../../shared/lib/bounded-ttl-cache'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  formatHabitacionDropdownOption,
  type HabitacionInfo,
  type SedeInfo,
  type SubSedeInfo,
} from '../domain/recepcion'
import { detectarRecursosDispositivoRecepciones } from './recepciones-resource-detector'

interface RawHeadquarterDto {
  id?: string | number
  name?: string
  address?: string
  city?: string
  phone?: string
  status?: string
}

interface RawSubHeadquarterDto {
  id?: string | number
  headquarter_id?: string
  name?: string
  address?: string
  phone?: string
  status?: string
}

interface RawRoomByHqDto {
  id?: string | number
  number?: string | number
  floor?: number | string
  room_types_id?: string
  building_id?: string
  price_override?: number | null
  price?: number | null
  status?: string
  has_reception?: boolean
}

export interface ReceptionistLocationResolution {
  headquartersId: string | null
  headquarter: SedeInfo | null
  subHeadquarters: SubSedeInfo[]
  rooms: HabitacionInfo[]
  suggestedBuildingId: string | null
  validationError: StatusCodeValidationResult | null
}

const LOCATION_CACHE_TTL_MS = 3 * 60 * 1000
const locationResolutionCache = new BoundedTtlCache<
  string,
  ReceptionistLocationResolution
>(10, LOCATION_CACHE_TTL_MS)
const inFlightLocationQueries = new Map<
  string,
  Promise<ReceptionistLocationResolution>
>()

function extractPayloadRecord<T>(data: unknown): T | null {
  if (!data) return null
  if (Array.isArray(data)) {
    return (data[0] as T) ?? null
  }
  if (typeof data === 'object') {
    const obj = data as { data?: T | T[] }
    if (obj.data !== undefined) {
      if (Array.isArray(obj.data)) return (obj.data[0] as T) ?? null
      return obj.data
    }
    return data as T
  }
  return null
}

function extractPayloadList<T>(data: unknown): T[] {
  if (!data) return []
  if (Array.isArray(data)) {
    return data as T[]
  }
  if (typeof data === 'object') {
    const obj = data as { data?: T[] | T }
    if (Array.isArray(obj.data)) return obj.data
    if (obj.data && typeof obj.data === 'object') return [obj.data]
    return [data as T]
  }
  return []
}

/**
 * Extrae `headquarters_id` directamente desde `auth_user` en `localStorage`
 * (con respaldo en `getActiveHeadquarterId()`).
 */
export function readReceptionistHeadquarterIdFromStorage(): string | null {
  try {
    const user = readAuthUser()
    if (user) {
      if (
        typeof user.headquarters_id === 'string' &&
        user.headquarters_id.trim()
      ) {
        return user.headquarters_id.trim()
      }
      if (
        typeof user.headquarter_id === 'string' &&
        user.headquarter_id.trim()
      ) {
        return user.headquarter_id.trim()
      }
      if (
        Array.isArray(user.allowed_headquarters) &&
        user.allowed_headquarters.length > 0
      ) {
        const first = user.allowed_headquarters[0] as Record<string, unknown>
        if (typeof first?.id === 'string' && first.id.trim()) {
          return first.id.trim()
        }
      }
    }
    return getActiveHeadquarterId()
  } catch {
    return null
  }
}

function createEmptyLocationResolution(
  headquartersId: string | null,
  validationError: StatusCodeValidationResult | null = null
): ReceptionistLocationResolution {
  return {
    headquartersId,
    headquarter: null,
    subHeadquarters: [],
    rooms: [],
    suggestedBuildingId: null,
    validationError,
  }
}

async function fetchValidatedBalanced(
  url: string,
  maxRetries: number,
  params?: Record<string, string>
) {
  const response = await executeBalancedRequest(
    () =>
      api.get<unknown>(url, {
        ...(params ? { params } : {}),
        validateStatus: () => true,
      }),
    { maxRetries }
  )
  return {
    response,
    validation: validateStatusCode(response.status),
  }
}

/**
 * Resuelve automáticamente la ubicación del recepcionista consumiendo en cadena balanceada:
 * 1) `GET /headquarters/{id}`
 * 2) `GET /sub-headquarters/by-headquarter/{id_headquarters}` y `GET /room?headquarters_id={id_headquarters}`
 * Valida cada respuesta con `validateStatusCode` y balancea con `executeBalancedRequest`.
 */
export async function resolveReceptionistLocation(
  options: { forceRefresh?: boolean } = {}
): Promise<ReceptionistLocationResolution> {
  const hqId = readReceptionistHeadquarterIdFromStorage()
  if (!hqId) return createEmptyLocationResolution(null)

  if (!options.forceRefresh) {
    const cached = locationResolutionCache.get(hqId)
    if (cached) return cached

    const inFlight = inFlightLocationQueries.get(hqId)
    if (inFlight) return inFlight
  }

  const runPromise = (async (): Promise<ReceptionistLocationResolution> => {
    try {
      const { maxRetries } = detectarRecursosDispositivoRecepciones().policy
      const safeRetries = Math.min(1, maxRetries)

      // 1. Consultar sede asignada: GET /headquarters/{id}
      const { response: hqResponse, validation: hqValidation } =
        await fetchValidatedBalanced(
          `/headquarters/${encodeURIComponent(hqId)}`,
          safeRetries
        )
      if (!hqValidation.isValid) {
        return createEmptyLocationResolution(hqId, hqValidation)
      }

      const rawHq = extractPayloadRecord<RawHeadquarterDto>(hqResponse.data)
      if (!rawHq || !rawHq.name) {
        return createEmptyLocationResolution(hqId, validateStatusCode(404))
      }

      const resolvedHqId = String(rawHq.id ?? hqId)
      const headquarter: SedeInfo = {
        id: resolvedHqId,
        name: rawHq.name,
        address: rawHq.address || 'Dirección no especificada',
        city: rawHq.city || 'Ciudad',
        phone: rawHq.phone || '',
        status: rawHq.status || 'active',
      }

      // 2. En paralelo y balanceado: subsedes + habitaciones filtradas por sede
      const [subHqCall, roomsCall] = await Promise.all([
        fetchValidatedBalanced(
          `/sub-headquarters/by-headquarter/${encodeURIComponent(resolvedHqId)}`,
          safeRetries
        ),
        fetchValidatedBalanced('/room', safeRetries, {
          headquarters_id: resolvedHqId,
        }),
      ])

      const rawSubHqs = subHqCall.validation.isValid
        ? extractPayloadList<RawSubHeadquarterDto>(subHqCall.response.data)
        : []

      const subHeadquarters: SubSedeInfo[] = rawSubHqs
        .filter((s) => Boolean(s && (s.name || s.id)))
        .map((s) => ({
          id: s.id ? String(s.id) : undefined,
          headquarter_id: String(s.headquarter_id || resolvedHqId),
          name: s.name || 'Subsede',
          address: s.address || '',
          phone: s.phone || '',
          status: s.status || 'active',
        }))

      const primarySubName = subHeadquarters[0]?.name || 'Sin subsede'
      const rawRooms = roomsCall.validation.isValid
        ? extractPayloadList<RawRoomByHqDto>(roomsCall.response.data)
        : []

      const rooms: HabitacionInfo[] = rawRooms
        .filter((r) => Boolean(r && r.id))
        .map((r) => {
          const id = String(r.id)
          const num = r.number ? String(r.number) : id.slice(0, 4)
          const floor =
            typeof r.floor === 'number' ? r.floor : Number(r.floor) || 1
          const price =
            typeof r.price_override === 'number'
              ? r.price_override
              : typeof r.price === 'number'
                ? r.price
                : undefined
          const buildingId = r.building_id ? String(r.building_id) : undefined

          catalogApi.primeRoom({
            id,
            number: num,
            floor,
            room_types_id: r.room_types_id ? String(r.room_types_id) : '',
            building_id: buildingId || '',
            price_override:
              typeof r.price_override === 'number' ? r.price_override : null,
            status: r.status || 'available',
            has_reception: Boolean(r.has_reception),
          })

          return {
            id,
            name: `Habitación ${num}`,
            number: num,
            floor,
            price,
            building_id: buildingId,
            headquarters_id: resolvedHqId,
            headquarters_name: headquarter.name,
            sub_headquarters_id: subHeadquarters[0]?.id ?? null,
            sub_headquarters_name: primarySubName,
            room_types_id: r.room_types_id
              ? String(r.room_types_id)
              : undefined,
            status: r.status || 'available',
            label: formatHabitacionDropdownOption({
              roomNumber: num,
              floor,
              sedeName: headquarter.name,
              subSedeName: primarySubName,
            }),
          }
        })

      const firstValidationError = !subHqCall.validation.isValid
        ? subHqCall.validation
        : !roomsCall.validation.isValid
          ? roomsCall.validation
          : null

      const suggestedBuildingId =
        rooms.find((r) => Boolean(r.building_id))?.building_id ?? null

      const result: ReceptionistLocationResolution = {
        headquartersId: resolvedHqId,
        headquarter,
        subHeadquarters,
        rooms,
        suggestedBuildingId,
        validationError: firstValidationError,
      }

      if (!firstValidationError) {
        locationResolutionCache.set(hqId, result)
      }

      return result
    } catch (err) {
      console.error(
        '[resolveReceptionistLocation] Error inesperado al detectar ubicación:',
        err
      )
      return createEmptyLocationResolution(hqId, validateStatusCode(500))
    } finally {
      inFlightLocationQueries.delete(hqId)
    }
  })()

  inFlightLocationQueries.set(hqId, runPromise)
  return runPromise
}
