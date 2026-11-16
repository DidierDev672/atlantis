import { isAxiosError } from 'axios'
import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import {
  type PersonDetailApi,
  type RawStayApi,
  type RecepcionSeleccionada,
  type ReserveDetailApi,
  type RoomDetailApi,
  STAYS_FALLBACK,
  RESERVES_FALLBACK,
  construirFallbackRecepciones,
  crearPersonFallback,
  crearRoomFallback,
  formatBuilding,
  formatearFechaHora,
} from '../domain/estadias-recepcion'

interface BuildingSummaryApi {
  id?: string
  _id?: string
  name?: string
}

const MAX_CONCURRENT_DETAIL_REQUESTS = 4

// Cachés compartidas en memoria para deduplicar entidades entre aperturas y vistas
const roomCache = new Map<string, RoomDetailApi>()
const reserveCache = new Map<string, ReserveDetailApi | null>()
const personCache = new Map<string, PersonDetailApi>()
const buildingCache = new Map<string, string>()

const roomInFlight = new Map<string, Promise<RoomDetailApi>>()
const reserveInFlight = new Map<string, Promise<ReserveDetailApi | null>>()
const personInFlight = new Map<string, Promise<PersonDetailApi>>()
const buildingInFlight = new Map<string, Promise<string>>()

function extraerLista<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const key of ['data', 'items', 'results']) {
      if (Array.isArray(obj[key])) return obj[key] as T[]
    }
  }
  return []
}

function extraerEntidad<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null
  if ('data' in raw && (raw as { data?: unknown }).data) {
    const inner = (raw as { data?: unknown }).data
    return inner && typeof inner === 'object' ? (inner as T) : null
  }
  return raw as T
}

function recolectarIdsFaltantes(
  valores: Array<string | null | undefined>,
  cache: Map<string, unknown>
): string[] {
  const unicos = new Set<string>()
  for (const val of valores) {
    if (typeof val === 'string' && val.length > 0 && !cache.has(val)) {
      unicos.add(val)
    }
  }
  return Array.from(unicos)
}

/**
 * Pool de concurrencia acotada para evitar ráfagas N+1 contra el servidor
 * cuando faltan entidades puntuales fuera de los catálogos globales.
 */
async function ejecutarConConcurrenciaLimitada<T>(
  items: string[],
  maxConcurrent: number,
  worker: (id: string) => Promise<T>
): Promise<void> {
  if (items.length === 0) return

  let cursor = 0
  const workersCount = Math.min(maxConcurrent, items.length)

  await Promise.all(
    Array.from({ length: workersCount }, async () => {
      while (cursor < items.length) {
        const index = cursor++
        const targetId = items[index]
        if (targetId) {
          await worker(targetId)
        }
      }
    })
  )
}

async function fetchCatalogoOpcional<T>(endpoint: string): Promise<T[]> {
  try {
    const response = await executeBalancedRequest(() =>
      api.get<T[] | { data?: T[] }>(endpoint, {
        validateStatus: () => true,
      })
    )
    const validation = validateStatusCode(response.status)
    if (validation.isValid && response.status >= 200 && response.status < 300) {
      return extraerLista<T>(response.data)
    }
  } catch {
    // Fallback controlado por ID puntual en cola acotada
  }
  return []
}

function obtenerRoomPorIdDedup(roomId: string): Promise<RoomDetailApi> {
  const cached = roomCache.get(roomId)
  if (cached) return Promise.resolve(cached)

  const inFlight = roomInFlight.get(roomId)
  if (inFlight) return inFlight

  const req = executeBalancedRequest(() =>
    api.get<RoomDetailApi | { data?: RoomDetailApi }>(
      `/room/${encodeURIComponent(roomId)}`,
      { validateStatus: () => true }
    )
  )
    .then((response) => {
      const validation = validateStatusCode(response.status)
      const entity = validation.isValid ? extraerEntidad<RoomDetailApi>(response.data) : null
      const resolved = entity ?? crearRoomFallback(roomId)
      if (entity) {
        roomCache.set(roomId, entity)
      }
      return resolved
    })
    .catch(() => crearRoomFallback(roomId))
    .finally(() => {
      roomInFlight.delete(roomId)
    })

  roomInFlight.set(roomId, req)
  return req
}

function obtenerReservePorIdDedup(reserveId: string): Promise<ReserveDetailApi | null> {
  if (reserveCache.has(reserveId)) {
    return Promise.resolve(reserveCache.get(reserveId) ?? null)
  }

  const inFlight = reserveInFlight.get(reserveId)
  if (inFlight) return inFlight

  const req = executeBalancedRequest(() =>
    api.get<ReserveDetailApi | { data?: ReserveDetailApi }>(
      `/reserve/${encodeURIComponent(reserveId)}`,
      { validateStatus: () => true }
    )
  )
    .then((response) => {
      const validation = validateStatusCode(response.status)
      const entity = validation.isValid
        ? extraerEntidad<ReserveDetailApi>(response.data)
        : null
      if (entity) {
        reserveCache.set(reserveId, entity)
        return entity
      }
      return RESERVES_FALLBACK[reserveId] ?? null
    })
    .catch(() => RESERVES_FALLBACK[reserveId] ?? null)
    .finally(() => {
      reserveInFlight.delete(reserveId)
    })

  reserveInFlight.set(reserveId, req)
  return req
}

function obtenerPersonPorIdDedup(personId: string): Promise<PersonDetailApi> {
  const cached = personCache.get(personId)
  if (cached) return Promise.resolve(cached)

  const inFlight = personInFlight.get(personId)
  if (inFlight) return inFlight

  const req = executeBalancedRequest(() =>
    api.get<PersonDetailApi | { data?: PersonDetailApi }>(
      `/persons/${encodeURIComponent(personId)}`,
      { validateStatus: () => true }
    )
  )
    .then((response) => {
      const validation = validateStatusCode(response.status)
      const entity = validation.isValid
        ? extraerEntidad<PersonDetailApi>(response.data)
        : null
      const resolved = entity ?? crearPersonFallback(personId)
      if (entity) {
        personCache.set(personId, entity)
      }
      return resolved
    })
    .catch(() => crearPersonFallback(personId))
    .finally(() => {
      personInFlight.delete(personId)
    })

  personInFlight.set(personId, req)
  return req
}

function obtenerBuildingNombreDedup(buildingId: string): Promise<string> {
  const cached = buildingCache.get(buildingId)
  if (cached) return Promise.resolve(cached)

  const inFlight = buildingInFlight.get(buildingId)
  if (inFlight) return inFlight

  const req = executeBalancedRequest(() =>
    api.get<BuildingSummaryApi | { data?: BuildingSummaryApi }>(
      `/building/${encodeURIComponent(buildingId)}`,
      { validateStatus: () => true }
    )
  )
    .then((response) => {
      const validation = validateStatusCode(response.status)
      const entity = validation.isValid
        ? extraerEntidad<BuildingSummaryApi>(response.data)
        : null
      const nombre = entity?.name || formatBuilding(buildingId)
      if (entity?.name) {
        buildingCache.set(buildingId, entity.name)
      }
      return nombre
    })
    .catch(() => formatBuilding(buildingId))
    .finally(() => {
      buildingInFlight.delete(buildingId)
    })

  buildingInFlight.set(buildingId, req)
  return req
}

export interface FetchRecepcionesResult {
  recepciones: RecepcionSeleccionada[]
  feedback: StatusCodeValidationResult | null
}

/**
 * Elimina el patrón N+1 al cargar recepciones:
 * 1. Consulta en paralelo y con balanceo de carga los catálogos maestros (`/stays`, `/room`, `/reserve`, `/persons`).
 * 2. Deduplica IDs únicos faltantes y los resuelve con concurrencia acotada (`MAX_CONCURRENT_DETAIL_REQUESTS`).
 * 3. Valida cada código de respuesta con `validateStatusCode`.
 */
export async function fetchRecepcionesEnriquecidas(options?: {
  forceRefresh?: boolean
}): Promise<FetchRecepcionesResult> {
  if (options?.forceRefresh) {
    roomCache.clear()
    reserveCache.clear()
    personCache.clear()
    buildingCache.clear()
  }

  try {
    // Fase 1: 4 peticiones paralelas balanceadas (O(1) en lugar de 1 + 3N)
    const [staysResponse, roomsCatalog, reservesCatalog, personsCatalog] =
      await Promise.all([
        executeBalancedRequest(() =>
          api.get<RawStayApi[] | { data?: RawStayApi[] }>('/stays', {
            validateStatus: () => true,
          })
        ),
        fetchCatalogoOpcional<RoomDetailApi>('/room'),
        fetchCatalogoOpcional<ReserveDetailApi>('/reserve'),
        fetchCatalogoOpcional<PersonDetailApi>('/persons'),
      ])

    for (const room of roomsCatalog) {
      if (room?.id) roomCache.set(room.id, room)
    }
    for (const reserve of reservesCatalog) {
      if (reserve?.id) reserveCache.set(reserve.id, reserve)
    }
    for (const person of personsCatalog) {
      if (person?.id) personCache.set(person.id, person)
    }

    const staysValidation = validateStatusCode(staysResponse.status)
    let staysList: RawStayApi[] = STAYS_FALLBACK
    let feedback: StatusCodeValidationResult | null = null

    if (staysValidation.isValid && staysResponse.status >= 200 && staysResponse.status < 300) {
      const lista = extraerLista<RawStayApi>(staysResponse.data)
      if (lista.length > 0) {
        staysList = lista
      }
    } else {
      feedback = staysValidation
    }

    // Fase 2: Solo consultar IDs únicos faltantes en caché con concurrencia acotada
    const missingRoomIds = recolectarIdsFaltantes(
      staysList.map((s) => s.room_id),
      roomCache
    )

    const missingReserveIds = recolectarIdsFaltantes(
      staysList.map((s) => s.reservation_id),
      reserveCache
    )

    await Promise.all([
      ejecutarConConcurrenciaLimitada(
        missingRoomIds,
        MAX_CONCURRENT_DETAIL_REQUESTS,
        obtenerRoomPorIdDedup
      ),
      ejecutarConConcurrenciaLimitada(
        missingReserveIds,
        MAX_CONCURRENT_DETAIL_REQUESTS,
        obtenerReservePorIdDedup
      ),
    ])

    // Resolver IDs de huésped únicos faltantes (incluyendo person_id de reservas ya resueltas)
    const missingPersonIds = recolectarIdsFaltantes(
      staysList.map((stay) => {
        const reserveData = stay.reservation_id
          ? reserveCache.get(stay.reservation_id) ?? RESERVES_FALLBACK[stay.reservation_id] ?? null
          : null
        return (
          reserveData?.person_id ||
          (stay.person_ids && stay.person_ids.length > 0 ? stay.person_ids[0] : 'person-1')
        )
      }),
      personCache
    )

    await ejecutarConConcurrenciaLimitada(
      missingPersonIds,
      MAX_CONCURRENT_DETAIL_REQUESTS,
      obtenerPersonPorIdDedup
    )

    // Fase 3: Ensamblaje O(N) puro en memoria
    const recepciones: RecepcionSeleccionada[] = staysList.map((stay) => {
      const roomData = roomCache.get(stay.room_id) ?? crearRoomFallback(stay.room_id)
      const reserveData = stay.reservation_id
        ? reserveCache.get(stay.reservation_id) ?? RESERVES_FALLBACK[stay.reservation_id] ?? null
        : null
      const personIdTarget =
        reserveData?.person_id ||
        (stay.person_ids && stay.person_ids.length > 0 ? stay.person_ids[0] : 'person-1')
      const personData = personCache.get(personIdTarget) ?? crearPersonFallback(personIdTarget)

      const checkIn = reserveData?.check_in_date || stay.check_in_date
      const checkOut = reserveData?.check_out_date || stay.check_out_date
      const numGuests =
        reserveData?.number_of_guests ||
        (stay.person_ids && stay.person_ids.length > 0 ? stay.person_ids.length : 1)

      return {
        id: stay.id,
        label: `Habitación ${roomData.number} · ${personData.name}`,
        huespedNombre: personData.name,
        habitacionNumero: roomData.number,
        habitacionNombre: `Habitación ${roomData.number}`,
        tieneReserva: Boolean(stay.reservation_id || reserveData),
        cantidadHuespedes: numGuests,
        checkInFormateado: formatearFechaHora(checkIn),
        checkOutFormateado: formatearFechaHora(checkOut),
        roomId: stay.room_id,
        reservationId: stay.reservation_id ?? null,
        personIds: stay.person_ids,
        sedeNombre: formatBuilding(roomData.building_id),
        room: roomData,
        reserve: reserveData,
        person: personData,
      }
    })

    return { recepciones, feedback }
  } catch (error: unknown) {
    const status = isAxiosError(error) && error.response ? error.response.status : 0
    return {
      recepciones: construirFallbackRecepciones(),
      feedback: validateStatusCode(status),
    }
  }
}

/**
 * Resuelve etiquetas amigables de habitación y edificio por `stay_id` / `room_id`
 * sin consultas N+1 (batch-first `/stays` + `/room` + `/building` y pool acotado para faltantes).
 */
export async function obtenerMapaHabitacionesEstadias(): Promise<Map<string, string> | null> {
  try {
    const [staysResponse, roomsCatalog, buildingsCatalog] = await Promise.all([
      executeBalancedRequest(() =>
        api.get<RawStayApi[] | { data?: RawStayApi[] }>('/stays', {
          validateStatus: () => true,
        })
      ),
      fetchCatalogoOpcional<RoomDetailApi>('/room'),
      fetchCatalogoOpcional<BuildingSummaryApi>('/building'),
    ])

    const staysValidation = validateStatusCode(staysResponse.status)
    if (!staysValidation.isValid || staysResponse.status < 200 || staysResponse.status >= 300) {
      return null
    }

    for (const room of roomsCatalog) {
      if (room?.id) roomCache.set(room.id, room)
    }
    for (const building of buildingsCatalog) {
      const bId = building.id ?? building._id
      if (bId && building.name) {
        buildingCache.set(bId, building.name)
      }
    }

    const staysList = extraerLista<RawStayApi>(staysResponse.data)
    if (staysList.length === 0) return null

    const missingRoomIds = recolectarIdsFaltantes(
      staysList.map((s) => s.room_id),
      roomCache
    )

    await ejecutarConConcurrenciaLimitada(
      missingRoomIds,
      MAX_CONCURRENT_DETAIL_REQUESTS,
      obtenerRoomPorIdDedup
    )

    const missingBuildingIds = recolectarIdsFaltantes(
      staysList.map((s) => roomCache.get(s.room_id)?.building_id),
      buildingCache
    )

    await ejecutarConConcurrenciaLimitada(
      missingBuildingIds,
      MAX_CONCURRENT_DETAIL_REQUESTS,
      obtenerBuildingNombreDedup
    )

    const mapa = new Map<string, string>()
    for (const stay of staysList) {
      const room = roomCache.get(stay.room_id)
      if (!room) continue

      const edificio =
        (room.building_id && buildingCache.get(room.building_id)) ||
        formatBuilding(room.building_id)

      mapa.set(
        stay.room_id,
        `Habitación ${room.number || '101'} · Piso ${room.floor ?? 1} (${edificio})`
      )
      mapa.set(stay.id, `Habitación ${room.number || '101'} (${edificio})`)
    }

    return mapa.size > 0 ? mapa : null
  } catch {
    return null
  }
}
