import { api } from '../../../lib/api'
import { catalogApi } from '../../../shared/catalog'
import { BoundedTtlCache } from '../../../shared/lib/bounded-ttl-cache'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  resolvePersonId,
  type PersonApiDto,
  type SalidaHuespedItem,
} from '../domain/salida-huesped'

export interface StayGuestNameEntry {
  id: string
  name: string
}

const stayGuestsNameCache = new BoundedTtlCache<string, StayGuestNameEntry[]>(
  120,
  2 * 60 * 1000
)

function extractPersonsArray(payload: unknown): PersonApiDto[] {
  if (Array.isArray(payload)) {
    return payload as PersonApiDto[]
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const key of ['persons', 'data', 'items']) {
      if (Array.isArray(obj[key])) {
        return obj[key] as PersonApiDto[]
      }
    }
    if ('id' in obj || 'person_id' in obj || 'name' in obj) {
      return [obj as PersonApiDto]
    }
  }
  return []
}

function resolveDtoName(dto: PersonApiDto): string | null {
  const direct = dto.name?.trim()
  if (direct) return direct
  const full = `${dto.first_name ?? ''} ${dto.last_name ?? ''}`.trim()
  return full || null
}

function buildSeedIds(guest: SalidaHuespedItem): string[] {
  const ids = new Set<string>()
  const primaryId = guest.personId?.trim()
  if (primaryId) ids.add(primaryId)
  if (Array.isArray(guest.stayPersonIds)) {
    for (const rawId of guest.stayPersonIds) {
      const clean = rawId?.trim()
      if (clean) ids.add(clean)
    }
  }
  return Array.from(ids)
}

/**
 * Construye la lista inicial de huéspedes usando únicamente los datos ya
 * disponibles en memoria (prop `guest` y caché local de `catalogApi`).
 */
export function getInitialStayGuests(
  guest: SalidaHuespedItem
): StayGuestNameEntry[] {
  const primaryId = guest.personId?.trim() || guest.internalKey
  const entries: StayGuestNameEntry[] = []
  const seenIds = new Set<string>()

  const pushEntry = (id: string, name: string) => {
    const cleanId = id.trim()
    const cleanName = name.trim()
    if (!cleanId || !cleanName || seenIds.has(cleanId)) return
    seenIds.add(cleanId)
    entries.push({ id: cleanId, name: cleanName })
  }

  if (guest.name?.trim()) {
    pushEntry(primaryId, guest.name)
  }

  for (const id of buildSeedIds(guest)) {
    if (seenIds.has(id)) continue
    const cached = catalogApi.getCachedPerson(id)
    if (cached?.name?.trim()) {
      pushEntry(id, cached.name)
    }
  }

  return entries
}

/**
 * Resuelve bajo demanda (al expandir el acordeón) todos los nombres de los
 * huéspedes vinculados a la estancia mediante `GET /stays_person/{stay_id}`
 * y `catalogApi.getPerson(id)` respetando el límite de concurrencia.
 */
export async function fetchStayGuestsOnDemand(params: {
  guest: SalidaHuespedItem
  maxConcurrentRequests: number
  isOffline: boolean
}): Promise<StayGuestNameEntry[]> {
  const { guest, maxConcurrentRequests, isOffline } = params
  const baseline = getInitialStayGuests(guest)

  if (isOffline) {
    return baseline
  }

  const resolvedMap = new Map<string, string>()
  for (const item of baseline) {
    resolvedMap.set(item.id, item.name)
  }

  try {
    let stayId = (guest.primaryStayId || guest.stayId || '').trim()
    const roomId = (guest.primaryRoomId || guest.roomId || '').trim()

    if (!stayId && roomId && guest.sourceKind !== 'registrado') {
      const stayRes = await executeBalancedRequest(
        () =>
          api.get<{ id?: string; data?: { id?: string } }>(
            `/stay/reception/${encodeURIComponent(roomId)}`,
            { validateStatus: () => true }
          ),
        { maxRetries: 1 }
      )
      if (validateStatusCode(stayRes.status).isValid && stayRes.data) {
        stayId = (stayRes.data.id ?? stayRes.data.data?.id ?? '').trim()
      }
    }

    const cacheKey = stayId ? `stay:${stayId}` : ''
    if (cacheKey) {
      const cached = stayGuestsNameCache.get(cacheKey)
      if (cached && cached.length > 0) {
        for (const item of cached) {
          if (!resolvedMap.has(item.id)) {
            resolvedMap.set(item.id, item.name)
          }
        }
        return Array.from(resolvedMap.entries()).map(([id, name]) => ({
          id,
          name,
        }))
      }
    }

    const candidateIds = new Set<string>(buildSeedIds(guest))

    if (stayId) {
      const spRes = await executeBalancedRequest(
        () =>
          api.get<unknown>(`/stays_person/${encodeURIComponent(stayId)}`, {
            validateStatus: () => true,
          }),
        { maxRetries: 1 }
      )
      if (validateStatusCode(spRes.status).isValid) {
        const dtos = extractPersonsArray(spRes.data)
        for (const dto of dtos) {
          const pid = resolvePersonId(dto)
          if (!pid) continue
          candidateIds.add(pid)
          const resolvedName = resolveDtoName(dto)
          if (resolvedName) {
            resolvedMap.set(pid, resolvedName)
            catalogApi.primePerson({
              id: pid,
              name: resolvedName,
              document_type: dto.document_type,
              document_number: dto.document_number,
              phone_number: dto.phone_number,
              email: dto.email,
              date_of_birth: dto.date_of_birth,
              gender: dto.gender,
            })
          }
        }
      }
    }

    const missingIds = Array.from(candidateIds).filter(
      (id) => !resolvedMap.has(id)
    )

    if (missingIds.length > 0) {
      const batchSize = Math.max(1, maxConcurrentRequests)
      for (let i = 0; i < missingIds.length; i += batchSize) {
        const chunk = missingIds.slice(i, i + batchSize)
        const settled = await Promise.allSettled(
          chunk.map(async (id) => {
            const res = await catalogApi.getPerson(id)
            return { id, name: res.data?.name?.trim() || '' }
          })
        )
        for (const entry of settled) {
          if (entry.status === 'fulfilled' && entry.value.name) {
            resolvedMap.set(entry.value.id, entry.value.name)
          }
        }
      }
    }

    const finalEntries = Array.from(resolvedMap.entries()).map(
      ([id, name]) => ({ id, name })
    )

    if (cacheKey && finalEntries.length > 0) {
      stayGuestsNameCache.set(cacheKey, finalEntries)
    }

    return finalEntries
  } catch (err) {
    console.warn('[stay-guests-api] No se pudieron resolver huéspedes:', err)
    return baseline
  }
}
