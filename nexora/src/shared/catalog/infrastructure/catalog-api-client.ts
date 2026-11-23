import { api } from '../../../lib/api'
import { BoundedTtlCache } from '../../lib/bounded-ttl-cache'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../lib/status-code-validator'
import type {
  PersonCatalogItem,
  RoomCatalogItem,
  RoomTypeCatalogItem,
  BedTypeCatalogItem,
  BuildingCatalogItem,
  HeadquarterCatalogItem,
  SubHeadquarterCatalogItem,
  RoleCatalogItem,
} from '../domain/catalog-types'
import {
  FALLBACK_PERSONS,
  FALLBACK_ROOMS,
  FALLBACK_ROOM_TYPES,
  FALLBACK_BED_TYPES,
  FALLBACK_BUILDINGS,
  FALLBACK_HEADQUARTERS,
  FALLBACK_SUB_HEADQUARTERS,
  FALLBACK_ROLES,
} from './catalog-fallbacks'

export interface CatalogQueryResult<T> {
  data: T | null
  validation: StatusCodeValidationResult
  fromCache?: boolean
}

// Caché en memoria acotada (LRU + TTL) para evitar crecimiento ilimitado de RAM
const memoryDataCache = new BoundedTtlCache<string, unknown>(150, 5 * 60 * 1000)
// Deduplicación de peticiones en vuelo (evita llamadas paralelas simultáneas al mismo ID)
const inFlightRequests: Record<string, Promise<unknown> | undefined> = {}

/**
 * Función genérica de consulta con validación de código de estado,
 * deduplicación en vuelo y fallback resiliente.
 */
async function fetchCatalogResource<T>(
  endpoint: string,
  id: string,
  fallbackMap: Record<string, T>
): Promise<CatalogQueryResult<T>> {
  const cleanId = id.trim()
  const cacheKey = `${endpoint}:${cleanId}`

  const cached = memoryDataCache.get(cacheKey)
  if (cached !== undefined) {
    return {
      data: cached as T,
      validation: validateStatusCode(200),
      fromCache: true,
    }
  }

  const existingRequest = inFlightRequests[cacheKey]
  if (existingRequest !== undefined) {
    const data = (await existingRequest) as T | null
    return {
      data: data ?? fallbackMap[cleanId] ?? null,
      validation: validateStatusCode(200),
      fromCache: true,
    }
  }

  const queryPromise = (async (): Promise<T | null> => {
    try {
      const response = await api.get(`${endpoint}/${encodeURIComponent(cleanId)}`, {
        validateStatus: () => true,
      })

      const validation = validateStatusCode(response.status)

      if (validation.isValid && response.data) {
        const raw = response.data
        const payload: T | null = Array.isArray(raw)
          ? ((raw[0] as T) ?? null)
          : ((raw as { data?: T }).data ?? (raw as T))

        if (payload) {
          memoryDataCache.set(cacheKey, payload)
          return payload
        }
      }

      const fallback = fallbackMap[cleanId]
      if (fallback) {
        memoryDataCache.set(cacheKey, fallback)
        return fallback
      }

      return null
    } catch {
      const fallback = fallbackMap[cleanId]
      if (fallback) {
        memoryDataCache.set(cacheKey, fallback)
        return fallback
      }
      return null
    } finally {
      delete inFlightRequests[cacheKey]
    }
  })()

  inFlightRequests[cacheKey] = queryPromise
  const resultData = await queryPromise

  return {
    data: resultData ?? fallbackMap[cleanId] ?? null,
    validation: validateStatusCode(resultData ? 200 : 500),
    fromCache: false,
  }
}

/**
 * Cliente centralizado para el consumo de entidades maestras del Catálogo.
 * Implementa validateStatusCode, caché de memoria y fallbacks transparentes.
 */
export const catalogApi = {
  // 1. Huéspedes (GET /person/{id})
  getPerson: (id: string) =>
    fetchCatalogResource<PersonCatalogItem>('/person', id, FALLBACK_PERSONS),

  // 2. Habitaciones (GET /room/{id})
  getRoom: (id: string) =>
    fetchCatalogResource<RoomCatalogItem>('/room', id, FALLBACK_ROOMS),

  // 3. Tipos de Habitación (GET /room-types/{id})
  getRoomType: (id: string) =>
    fetchCatalogResource<RoomTypeCatalogItem>('/room-types', id, FALLBACK_ROOM_TYPES),

  // 4. Tipos de Cama (GET /types-bed/{id})
  getBedType: (id: string) =>
    fetchCatalogResource<BedTypeCatalogItem>('/types-bed', id, FALLBACK_BED_TYPES),

  // 5. Edificios (GET /building/{id})
  getBuilding: (id: string) =>
    fetchCatalogResource<BuildingCatalogItem>('/building', id, FALLBACK_BUILDINGS),

  // 6. Sedes (GET /headquarters/{id})
  getHeadquarter: (id: string) =>
    fetchCatalogResource<HeadquarterCatalogItem>('/headquarters', id, FALLBACK_HEADQUARTERS),

  // 7. Subsedes (GET /sub-headquarters/{id})
  getSubHeadquarter: (id: string) =>
    fetchCatalogResource<SubHeadquarterCatalogItem>(
      '/sub-headquarters',
      id,
      FALLBACK_SUB_HEADQUARTERS
    ),

  // 8. Roles (GET /roles/{id})
  getRole: (id: string) =>
    fetchCatalogResource<RoleCatalogItem>('/roles', id, FALLBACK_ROLES),

  // 8. Lista de Subsedes por Sede (GET /sub-headquarters con filtro por headquarter_id, cacheada con TTL)
  getSubHeadquartersByHeadquarter: async (hqId: string): Promise<SubHeadquarterCatalogItem[]> => {
    const cleanHqId = hqId.trim()
    if (!cleanHqId) return []

    const cacheKey = `/sub-headquarters:by-hq:${cleanHqId}`
    const cached = memoryDataCache.get(cacheKey)
    if (cached !== undefined) {
      return cached as SubHeadquarterCatalogItem[]
    }

    const existingRequest = inFlightRequests[cacheKey]
    if (existingRequest !== undefined) {
      const data = (await existingRequest) as SubHeadquarterCatalogItem[] | null
      return data ?? []
    }

    const queryPromise = (async (): Promise<SubHeadquarterCatalogItem[]> => {
      try {
        const response = await api.get('/sub-headquarters', { validateStatus: () => true })
        if (response.status === 200 && Array.isArray(response.data)) {
          const filtered = (response.data as SubHeadquarterCatalogItem[]).filter(
            (sub) => sub.headquarter_id === cleanHqId
          )
          if (filtered.length > 0) {
            memoryDataCache.set(cacheKey, filtered)
            return filtered
          }
        }
      } catch {
        // Fallback transparente
      } finally {
        delete inFlightRequests[cacheKey]
      }
      const fallback = Object.values(FALLBACK_SUB_HEADQUARTERS).filter(
        (sub) => sub.headquarter_id === cleanHqId
      )
      memoryDataCache.set(cacheKey, fallback)
      return fallback
    })()

    inFlightRequests[cacheKey] = queryPromise
    return queryPromise
  },

  /** Pre-carga una persona resuelta desde otro endpoint (ej. GET /persons) para evitar GET /person/{id} duplicados */
  primePerson: (person: PersonCatalogItem) => {
    const cleanId = String(person.id ?? '').trim()
    if (cleanId) {
      memoryDataCache.set(`/person:${cleanId}`, person)
    }
  },

  /** Pre-carga una habitación resuelta desde otro endpoint para evitar GET /room/{id} duplicados */
  primeRoom: (room: RoomCatalogItem) => {
    const cleanId = String(room.id ?? '').trim()
    if (cleanId) {
      memoryDataCache.set(`/room:${cleanId}`, room)
    }
  },

  getCachedPerson: (id: string): PersonCatalogItem | undefined => {
    const cleanId = id.trim()
    if (!cleanId) return undefined
    return memoryDataCache.get(`/person:${cleanId}`) as PersonCatalogItem | undefined
  },

  getCachedRoom: (id: string): RoomCatalogItem | undefined => {
    const cleanId = id.trim()
    if (!cleanId) return undefined
    return memoryDataCache.get(`/room:${cleanId}`) as RoomCatalogItem | undefined
  },

  /** Invalidación granular por entidad para no destruir todo el caché en sesión */
  invalidateRoom: (id: string) => {
    const cleanId = id.trim()
    if (cleanId) {
      memoryDataCache.delete(`/room:${cleanId}`)
    }
  },

  invalidatePerson: (id: string) => {
    const cleanId = id.trim()
    if (cleanId) {
      memoryDataCache.delete(`/person:${cleanId}`)
    }
  },

  // Limpieza manual de caché si se requiere recarga fresca completa
  clearCache: () => {
    memoryDataCache.clear()
  },
}
