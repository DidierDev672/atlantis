import { isAxiosError } from 'axios'
import { api } from '../../../lib/api'
import { catalogApi } from '../../../shared/catalog'
import { BoundedTtlCache } from '../../../shared/lib/bounded-ttl-cache'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import { detectarRecursosDispositivoRecepciones } from './recepciones-resource-detector'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  calcularNoches,
  ESTADO_OPTIONS,
  formatHabitacionDropdownOption,
  formatMetodoPago,
  type CamaInfo,
  type EdificioInfo,
  type HabitacionInfo,
  type HuespedInfo,
  type Recepcion,
  type RecepcionPayload,
  type ReservaInfo,
  type SedeInfo,
  type SubSedeInfo,
  type TipoCamaInfo,
} from '../domain/recepcion'
import {
  EdificioNotFoundException,
  RecepcionApiError,
  RecepcionConflictError,
  RecepcionNetworkError,
  RecepcionNotFoundError,
  SedeNotFoundException,
  SubSedeNotFoundException,
} from '../domain/recepcion-error'
import type { RecepcionRepository } from '../domain/recepcion-repository'

interface RawStay {
  id?: string | number
  room_id?: string
  reservation_id?: string
  person_id?: string
  check_in_date?: string
  check_out_date?: string
  payment_method?: string
  security_deposit?: number | string
  remarks?: string
  status?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

interface RawRoom {
  id?: string | number
  number?: string | number
  name?: string
  floor?: string | number
  building_id?: string
  room_types_id?: string
  price?: number
  status?: string
  capacity?: number
}

interface RawBuilding {
  id?: string | number
  name?: string
  floor_number?: number
  headquarters_id?: string
  sub_headquarters_id?: string | null
  status?: string
}

interface RawSede {
  id?: string | number
  name?: string
  address?: string
  city?: string
  phone?: string
  status?: string
}

interface RawSubSede {
  id?: string | number
  headquarter_id?: string
  name?: string
  address?: string
  phone?: string
  status?: string
}

interface RawBed {
  id?: string | number
  room_id?: string
  types_bed_id?: string[]
  etiquette?: string
  status?: string
}

interface RawTipoCama {
  id?: string | number
  name?: string
  capacity_people?: number
  description?: string
}

interface RawReserva {
  id?: string | number
  room_id?: string
  person_ids?: string[]
  person_id?: string
  check_in_date?: string
  check_out_date?: string
  number_of_guests?: number
  state?: string
  total_price?: number
  created_by?: string
  created_at?: string
  updated_at?: string
}

interface RawPerson {
  id?: string | number
  name?: string
  document_type?: string
  document_number?: string
  phone_number?: string
  email?: string
}

const LOCAL_STORAGE_KEY = 'nexora_recepciones_list'
const COLLECTION_CACHE_TTL_MS = 2 * 60 * 1000

const sharedCollectionCache = new BoundedTtlCache<string, unknown>(
  20,
  COLLECTION_CACHE_TTL_MS
)
const sharedCollectionInFlight = new Map<string, Promise<unknown>>()

export class ApiRecepcionRepository implements RecepcionRepository {
  private personCache = new BoundedTtlCache<string, HuespedInfo | null>(
    200,
    5 * 60 * 1000
  )
  private personInFlight = new Map<string, Promise<HuespedInfo | null>>()
  private roomCache = new BoundedTtlCache<string, HabitacionInfo | null>(
    200,
    5 * 60 * 1000
  )
  private roomInFlight = new Map<string, Promise<HabitacionInfo | null>>()
  private buildingCache = new Map<string, Promise<EdificioInfo>>()
  private headquarterCache = new Map<string, Promise<SedeInfo>>()
  private subHeadquarterCache = new Map<string, Promise<SubSedeInfo[]>>()

  /**
   * Obtiene la lista de recepciones/estadías activas e históricas (GET /stay).
   * Se enriquece con la jerarquía física (Sede -> Edificio -> Habitación -> Cama).
   * Utiliza balanceo de carga (executeBalancedRequest) y validación de status code (validateStatusCode).
   */
  async getRecepciones(): Promise<Recepcion[]> {
    try {
      const response = await executeBalancedRequest(() =>
        api.get<unknown>('/stay', {
          validateStatus: () => true,
        }),
      )

      const validation = validateStatusCode(response.status)
      if (!validation.isValid) {
        console.warn(`[getRecepciones] Estado ${response.status} en GET /stay:`, validation.message)
      } else {
        const rawStays: RawStay[] = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as { data?: RawStay[] })?.data)
            ? ((response.data as { data: RawStay[] }).data ?? [])
            : []

        if (rawStays.length > 0) {
          const enriched = await this.enrichRawStays(rawStays)
          this.syncLocalStorage(enriched)
          return enriched
        }
      }
    } catch (error) {
      console.warn('Fallo al obtener recepciones desde GET /stay. Activando modo resiliente:', error)
    }

    // Fallback a almacenamiento local y datos de demostración
    const local = this.loadFromLocalStorage()
    if (local.length > 0) {
      return local
    }

    const demo = await this.getDemoRecepciones()
    this.syncLocalStorage(demo)
    return demo
  }

  /**
   * Registra y persiste una nueva recepción/estadía en el backend (POST /stay).
   * Integra balanceo de carga preventivo (executeBalancedRequest) y validación de status code con status-code-validator.ts.
   */
  async createRecepcion(payload: RecepcionPayload): Promise<Recepcion> {
    try {
      const response = await executeBalancedRequest(() =>
        api.post<Record<string, unknown>>('/stay', payload, {
          validateStatus: () => true, // Permite validar cada status sin rechazo inmediato
        }),
      )

      // 1. Validar status code con status-code-validator.ts
      const validation = validateStatusCode(response.status)

      if (validation.isValid) {
        const idGenerado =
          response.data && typeof response.data.id === 'string'
            ? response.data.id
            : `stay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

        const nuevaRecepcion = await this.buildEnrichedRecepcion(payload, idGenerado)
        sharedCollectionCache.delete('rooms')
        sharedCollectionCache.delete('reservas')
        this.saveLocally(nuevaRecepcion)
        return nuevaRecepcion
      }

      // Extracción del mensaje entregado por el backend
      const data = response.data
      const serverMsg =
        typeof data === 'object' && data !== null
          ? 'message' in data && typeof data.message === 'string'
            ? data.message
            : 'error' in data && typeof data.error === 'string'
              ? data.error
              : undefined
          : undefined

      // Mensaje empático fundamentado en status-code-validator
      const finalMsg = serverMsg || validation.message || `No fue posible registrar la estadía (${response.status})`

      switch (response.status) {
        case 400:
          throw new RecepcionApiError(400, finalMsg)
        case 401:
          throw new RecepcionApiError(401, finalMsg)
        case 404:
          throw new RecepcionNotFoundError('habitación o reserva previa', payload.room_id)
        case 409:
          throw new RecepcionConflictError(finalMsg)
        case 500:
        default:
          throw new RecepcionApiError(response.status, finalMsg)
      }
    } catch (error: unknown) {
      if (error instanceof RecepcionApiError) {
        throw error
      }
      if (isAxiosError(error)) {
        if (!error.response) {
          const netValidation = validateStatusCode(0)
          throw new RecepcionNetworkError(
            netValidation.message || 'No se pudo establecer conexión con el servidor de estadías. Verifica tu conexión.',
          )
        }
        const statusCode = error.response.status
        const validation = validateStatusCode(statusCode)
        const msg = error.response.data?.message || error.response.data?.error || validation.message || error.message
        throw new RecepcionApiError(statusCode, msg)
      }
      throw new RecepcionApiError(
        0,
        error instanceof Error ? error.message : 'Error inesperado al registrar la recepción.',
      )
    }
  }

  private balancedGet(
    url: string,
    validateStatus: (status: number) => boolean = () => true
  ) {
    const { maxRetries } = detectarRecursosDispositivoRecepciones().policy
    return executeBalancedRequest(
      () => api.get<unknown>(url, { validateStatus }),
      { maxRetries: Math.min(1, maxRetries) }
    )
  }

  private async fetchCachedCollection<T>(
    cacheKey: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = sharedCollectionCache.get(cacheKey)
    if (cached !== undefined) {
      return cached as T
    }

    const existing = sharedCollectionInFlight.get(cacheKey)
    if (existing) {
      return existing as Promise<T>
    }

    const promise = (async () => {
      try {
        const result = await fetcher()
        sharedCollectionCache.set(cacheKey, result)
        return result
      } finally {
        sharedCollectionInFlight.delete(cacheKey)
      }
    })()

    sharedCollectionInFlight.set(cacheKey, promise)
    return promise
  }

  async getSedes(): Promise<SedeInfo[]> {
    return this.fetchCachedCollection('headquarters', async () => {
      try {
        const response = await this.balancedGet('/headquarters')

        const validation = validateStatusCode(response.status)
        if (!validation.isValid) {
          console.warn(
            `[getSedes] Status ${response.status} no válido en /headquarters:`,
            validation.message,
          )
        } else {
          const raw: RawSede[] = Array.isArray(response.data)
            ? response.data
            : (response.data as { data?: RawSede[] })?.data ?? []

          if (raw.length > 0) {
            return raw.map((s) => ({
              id: String(s.id),
              name: s.name || `Sede ${String(s.id).slice(0, 5)}`,
              address: s.address || 'Dirección no especificada',
              city: s.city || 'Medellín',
              phone: s.phone || '+57 4 444 0000',
              status: s.status || 'active',
            }))
          }
        }
      } catch (err) {
        console.warn('[getSedes] Error de conexión en GET /headquarters:', err)
      }

      return [
        {
          id: 'sede-01',
          name: 'Sede Principal El Poblado',
          address: 'Calle 10 # 43E-20',
          city: 'Medellín',
          phone: '+57 4 444 0000',
          status: 'active',
        },
        {
          id: 'sede-02',
          name: 'Sede Laureles Parque',
          address: 'Circular 4 # 73-10',
          city: 'Medellín',
          phone: '+57 4 444 1111',
          status: 'active',
        },
        {
          id: 'sede-03',
          name: 'Sede Centro Histórico',
          address: 'Carrera 46 # 52-25',
          city: 'Medellín',
          phone: '+57 4 444 2222',
          status: 'active',
        },
      ]
    })
  }

  /**
   * Obtiene una sede puntual por ID (GET /headquarters/{id}).
   * Valida rigurosamente el status code mediante validateStatusCode.
   * Utiliza el campo "name" de la sede.
   * Lanza SedeNotFoundException en caso de fallo o ausencia de datos.
   */
  async getHeadquarterById(id: string): Promise<SedeInfo> {
    if (!id) {
      throw new SedeNotFoundException(id, 'Identificador de sede no proporcionado.')
    }
    const cached = this.headquarterCache.get(id)
    if (cached) return cached

    const fetchPromise = (async () => {
      try {
        const response = await this.balancedGet(`/headquarters/${id}`)

        const validation = validateStatusCode(response.status)
        if (!validation.isValid) {
          throw new SedeNotFoundException(
            id,
            validation.message || `No se pudo obtener la sede con ID "${id}" (HTTP ${response.status}).`,
          )
        }

        const rawData = response.data
        let raw: RawSede | null = null
        if (Array.isArray(rawData)) {
          raw = rawData[0] ?? null
        } else if (rawData && typeof rawData === 'object') {
          const wrapper = rawData as { data?: RawSede | RawSede[] }
          if (Array.isArray(wrapper.data)) {
            raw = wrapper.data[0] ?? null
          } else if (wrapper.data && typeof wrapper.data === 'object') {
            raw = wrapper.data
          } else {
            raw = rawData as RawSede
          }
        }

        if (!raw || !raw.name) {
          throw new SedeNotFoundException(id, 'La sede no cuenta con información de nombre válida.')
        }

        return {
          id: String(raw.id || id),
          name: raw.name,
          address: raw.address || 'Dirección de sede',
          city: raw.city || 'Medellín',
          phone: raw.phone || '3001234567',
          status: raw.status || 'active',
        }
      } catch (error) {
        if (error instanceof SedeNotFoundException) {
          throw error
        }
        if (isAxiosError(error) && error.response) {
          const val = validateStatusCode(error.response.status)
          throw new SedeNotFoundException(id, val.message || error.message)
        }
        throw new SedeNotFoundException(
          id,
          error instanceof Error ? error.message : 'Error inesperado al consultar la sede.',
        )
      }
    })()

    this.headquarterCache.set(id, fetchPromise)
    return fetchPromise
  }

  async getEdificios(sedeId?: string): Promise<EdificioInfo[]> {
    const all = await this.fetchCachedCollection('buildings', async () => {
      try {
        const response = await this.balancedGet('/building')

        const validation = validateStatusCode(response.status)
        if (!validation.isValid) {
          console.warn(`[getEdificios] Status ${response.status} en /building:`, validation.message)
        } else {
          const raw: RawBuilding[] = Array.isArray(response.data)
            ? response.data
            : (response.data as { data?: RawBuilding[] })?.data ?? []

          if (raw.length > 0) {
            return raw.map((b) => ({
              id: String(b.id),
              name: b.name || `Torre ${String(b.id).slice(0, 5)}`,
              floor_number: typeof b.floor_number === 'number' ? b.floor_number : 5,
              headquarters_id: String(b.headquarters_id || 'sede-01'),
              sub_headquarters_id: b.sub_headquarters_id ? String(b.sub_headquarters_id) : null,
              status: b.status || 'active',
            }))
          }
        }
      } catch (err) {
        console.warn('[getEdificios] Error en GET /building:', err)
      }

      const demoEdificios: EdificioInfo[] = [
        {
          id: 'bld-01',
          name: 'Torre Panorámica A',
          floor_number: 6,
          headquarters_id: 'sede-01',
          status: 'active',
        },
        {
          id: 'bld-02',
          name: 'Torre Ejecutiva B',
          floor_number: 4,
          headquarters_id: 'sede-01',
          status: 'active',
        },
        {
          id: 'bld-03',
          name: 'Bloque Jardines Laureles',
          floor_number: 3,
          headquarters_id: 'sede-02',
          status: 'active',
        },
        {
          id: 'bld-04',
          name: 'Edificio Colonial Centro',
          floor_number: 5,
          headquarters_id: 'sede-03',
          status: 'active',
        },
      ]

      return demoEdificios
    })

    return sedeId ? all.filter((b) => b.headquarters_id === sedeId) : all
  }

  /**
   * Obtiene un edificio puntual por ID (GET /building/{id}).
   * Valida rigurosamente el status code mediante validateStatusCode.
   * Utiliza el campo "name" del edificio.
   * Lanza EdificioNotFoundException en caso de fallo o ausencia de datos.
   */
  async getBuildingById(id: string): Promise<EdificioInfo> {
    if (!id) {
      throw new EdificioNotFoundException(id, 'Identificador de edificio no proporcionado.')
    }
    const cached = this.buildingCache.get(id)
    if (cached) return cached

    const fetchPromise = (async () => {
      try {
        const response = await this.balancedGet(`/building/${id}`)

        const validation = validateStatusCode(response.status)
        if (!validation.isValid) {
          throw new EdificioNotFoundException(
            id,
            validation.message || `No se pudo obtener el edificio con ID "${id}" (HTTP ${response.status}).`,
          )
        }

        const rawData = response.data
        let raw: RawBuilding | null = null
        if (Array.isArray(rawData)) {
          raw = rawData[0] ?? null
        } else if (rawData && typeof rawData === 'object') {
          const wrapper = rawData as { data?: RawBuilding | RawBuilding[] }
          if (Array.isArray(wrapper.data)) {
            raw = wrapper.data[0] ?? null
          } else if (wrapper.data && typeof wrapper.data === 'object') {
            raw = wrapper.data
          } else {
            raw = rawData as RawBuilding
          }
        }

        if (!raw || !raw.name) {
          throw new EdificioNotFoundException(id, 'El edificio retornado no contiene datos válidos de nombre.')
        }

        return {
          id: String(raw.id || id),
          name: raw.name,
          floor_number: typeof raw.floor_number === 'number' ? raw.floor_number : 5,
          headquarters_id: String(raw.headquarters_id || ''),
          sub_headquarters_id: raw.sub_headquarters_id ? String(raw.sub_headquarters_id) : null,
          status: raw.status || 'available',
        }
      } catch (error) {
        if (error instanceof EdificioNotFoundException) {
          throw error
        }
        if (isAxiosError(error) && error.response) {
          const val = validateStatusCode(error.response.status)
          throw new EdificioNotFoundException(id, val.message || error.message)
        }
        throw new EdificioNotFoundException(
          id,
          error instanceof Error ? error.message : 'Error inesperado al consultar el edificio.',
        )
      }
    })()

    this.buildingCache.set(id, fetchPromise)
    return fetchPromise
  }

  async getSubSedes(sedeId: string): Promise<SubSedeInfo[]> {
    return this.getSubHeadquartersByHeadquarter(sedeId)
  }

  /**
   * Obtiene las subsedes asociadas a una sede específica (GET /sub-headquarters/by-headquarter/{id_headquarters}).
   * Valida rigurosamente el status code mediante validateStatusCode.
   * Utiliza el campo "name" de cada subsede.
   * Lanza SubSedeNotFoundException si no se encuentran subsedes.
   */
  async getSubHeadquartersByHeadquarter(headquartersId: string): Promise<SubSedeInfo[]> {
    if (!headquartersId) return []
    const cached = this.subHeadquarterCache.get(headquartersId)
    if (cached) return cached

    const fetchPromise = (async () => {
      try {
        const response = await this.balancedGet(
          `/sub-headquarters/by-headquarter/${headquartersId}`
        )

        const validation = validateStatusCode(response.status)
        if (!validation.isValid) {
          throw new SubSedeNotFoundException(
            headquartersId,
            validation.message || `No se pudieron obtener subsedes para la sede "${headquartersId}" (HTTP ${response.status}).`,
          )
        }

        const rawData = response.data
        const raw: RawSubSede[] = Array.isArray(rawData)
          ? rawData
          : rawData && typeof rawData === 'object'
            ? Array.isArray((rawData as { data?: RawSubSede[] }).data)
              ? ((rawData as { data: RawSubSede[] }).data ?? [])
              : [rawData as RawSubSede]
            : []

        if (raw.length === 0) {
          throw new SubSedeNotFoundException(headquartersId)
        }

        return raw.map((s) => ({
          id: String(s.id || ''),
          headquarter_id: String(s.headquarter_id || headquartersId),
          name: s.name || 'Subsede',
          address: s.address || 'Dirección de sub-sede',
          phone: s.phone || '+57 4 300 0000',
          status: s.status || 'active',
        }))
      } catch (error) {
        if (error instanceof SubSedeNotFoundException) {
          throw error
        }
        if (isAxiosError(error) && error.response) {
          const val = validateStatusCode(error.response.status)
          throw new SubSedeNotFoundException(headquartersId, val.message || error.message)
        }
        // Fallback para sedes demo
        if (headquartersId === 'sede-01' || headquartersId === '4b1a2c3d0e9f8a7b') {
          return [
            {
              id: 'sub-01',
              headquarter_id: headquartersId,
              name: 'Subsede Poblado',
              address: 'Carrera 43A # 1-50',
              phone: '3109876543',
              status: 'active',
            },
          ]
        }
        return []
      }
    })()

    this.subHeadquarterCache.set(headquartersId, fetchPromise)
    return fetchPromise
  }

  private async getAllSubSedes(): Promise<SubSedeInfo[]> {
    return this.fetchCachedCollection('sub-headquarters', async () => {
      try {
        const response = await this.balancedGet('/sub-headquarters')
        if (validateStatusCode(response.status).isValid) {
          const rawData = response.data
          const raw: RawSubSede[] = Array.isArray(rawData)
            ? rawData
            : rawData && typeof rawData === 'object'
              ? Array.isArray((rawData as { data?: RawSubSede[] }).data)
                ? ((rawData as { data: RawSubSede[] }).data ?? [])
                : []
              : []
          return raw.map((s) => ({
            id: String(s.id || ''),
            headquarter_id: String(s.headquarter_id || ''),
            name: s.name || 'Subsede',
            address: s.address || 'Dirección de sub-sede',
            phone: s.phone || '+57 4 300 0000',
            status: s.status || 'active',
          }))
        }
      } catch (err) {
        console.warn('[getAllSubSedes] Error en GET /sub-headquarters:', err)
      }
      return []
    })
  }

  /**
   * Enriquece una habitación usando mapas en memoria (Sedes, Edificios y Subsedes)
   * ya precargados en bloque, eliminando la cascada N x 3 peticiones por habitación.
   */
  private enrichHabitacionFromMaps(
    r: RawRoom,
    edificiosMap: Map<string, EdificioInfo>,
    sedesMap: Map<string, SedeInfo>,
    subSedesByIdMap: Map<string, SubSedeInfo>,
    subSedesByHqMap: Map<string, SubSedeInfo[]>
  ): HabitacionInfo {
    const id = String(r.id)
    const num = r.number ? String(r.number) : id.slice(0, 4)
    const name = r.name || `Habitación ${num}`
    const floor = typeof r.floor === 'number' ? r.floor : Number(r.floor) || 1
    const cap = typeof r.capacity === 'number' ? r.capacity : 2
    const price = typeof r.price === 'number' ? r.price : 150000
    const bId = r.building_id ? String(r.building_id) : ''

    const building = bId ? edificiosMap.get(bId) : undefined
    const buildingName = building?.name || (bId ? 'Edificio principal' : 'Torre Principal')
    const buildingHeadquartersId = building?.headquarters_id || ''
    const buildingSubHeadquartersId = building?.sub_headquarters_id ?? null

    const sede = buildingHeadquartersId
      ? sedesMap.get(buildingHeadquartersId)
      : undefined
    const sedeName =
      sede?.name || (buildingHeadquartersId ? 'Sede principal' : 'Sede Principal Medellín')

    let subSedeName = 'Sin subsede'
    if (buildingSubHeadquartersId) {
      subSedeName = subSedesByIdMap.get(buildingSubHeadquartersId)?.name || 'Sin subsede'
    } else if (buildingHeadquartersId) {
      const subsForHq = subSedesByHqMap.get(buildingHeadquartersId)
      if (subsForHq && subsForHq.length > 0) {
        subSedeName = subsForHq[0].name
      }
    }

    const label = formatHabitacionDropdownOption({
      roomNumber: num,
      floor,
      buildingName,
      sedeName,
      subSedeName,
    })

    catalogApi.primeRoom({
      id,
      number: num,
      floor,
      room_types_id: r.room_types_id ? String(r.room_types_id) : '',
      building_id: bId || 'bld-01',
      price_override: typeof r.price === 'number' ? r.price : null,
      status: r.status || 'active',
      has_reception: false,
    })

    return {
      id,
      name,
      number: num,
      floor,
      capacity: cap,
      price,
      building_id: bId || 'bld-01',
      building_name: buildingName,
      headquarters_id: buildingHeadquartersId || undefined,
      headquarters_name: sedeName,
      sub_headquarters_id: buildingSubHeadquartersId,
      sub_headquarters_name: subSedeName,
      room_types_id: r.room_types_id ? String(r.room_types_id) : undefined,
      status: r.status || 'active',
      label,
    }
  }

  async getHabitaciones(edificioId?: string): Promise<HabitacionInfo[]> {
    const allRooms = await this.fetchCachedCollection('rooms', async () => {
      try {
        const [roomsResponse, edificios, sedes, subSedes] = await Promise.all([
          this.balancedGet('/room'),
          this.getEdificios(),
          this.getSedes(),
          this.getAllSubSedes(),
        ])

        const validation = validateStatusCode(roomsResponse.status)
        if (!validation.isValid) {
          console.warn(
            `[getHabitaciones] Status ${roomsResponse.status} en /room:`,
            validation.message,
          )
        } else {
          const raw: RawRoom[] = Array.isArray(roomsResponse.data)
            ? roomsResponse.data
            : (roomsResponse.data as { data?: RawRoom[] })?.data ?? []

          if (raw.length > 0) {
            const edificiosMap = new Map(edificios.map((e) => [e.id, e]))
            const sedesMap = new Map(sedes.map((s) => [s.id, s]))
            const subSedesByIdMap = new Map<string, SubSedeInfo>()
            for (const sub of subSedes) {
              if (sub.id) {
                subSedesByIdMap.set(sub.id, sub)
              }
            }
            const subSedesByHqMap = new Map<string, SubSedeInfo[]>()
            for (const sub of subSedes) {
              if (!sub.headquarter_id) continue
              const bucket = subSedesByHqMap.get(sub.headquarter_id) ?? []
              bucket.push(sub)
              subSedesByHqMap.set(sub.headquarter_id, bucket)
            }

            return raw
              .filter((r) => Boolean(r.id))
              .map((r) =>
                this.enrichHabitacionFromMaps(
                  r,
                  edificiosMap,
                  sedesMap,
                  subSedesByIdMap,
                  subSedesByHqMap
                )
              )
          }
        }
      } catch (err) {
        console.warn('[getHabitaciones] Error en GET /room, usando demo enriquecido:', err)
      }

      // Demo rooms formateadas con la Regla de Oro 4 (sin IDs)
      const demoRooms: HabitacionInfo[] = [
        {
          id: 'hab-101',
          name: 'Suite Panorámica 101',
          number: '101',
          floor: 1,
          capacity: 2,
          price: 185000,
          building_id: 'bld-01',
          building_name: 'Torre Principal',
          headquarters_name: 'Sede Principal Medellín',
          sub_headquarters_name: 'Subsede Poblado',
          status: 'active',
          label: formatHabitacionDropdownOption({
            roomNumber: '101',
            floor: 1,
            buildingName: 'Torre Principal',
            sedeName: 'Sede Principal Medellín',
            subSedeName: 'Subsede Poblado',
          }),
        },
        {
          id: 'hab-102',
          name: 'Habitación Ejecutiva 102',
          number: '102',
          floor: 1,
          capacity: 2,
          price: 120000,
          building_id: 'bld-01',
          building_name: 'Torre Principal',
          headquarters_name: 'Sede Principal Medellín',
          sub_headquarters_name: 'Subsede Poblado',
          status: 'active',
          label: formatHabitacionDropdownOption({
            roomNumber: '102',
            floor: 1,
            buildingName: 'Torre Principal',
            sedeName: 'Sede Principal Medellín',
            subSedeName: 'Subsede Poblado',
          }),
        },
        {
          id: 'hab-201',
          name: 'Apart Familiar 201',
          number: '201',
          floor: 2,
          capacity: 4,
          price: 240000,
          building_id: 'bld-01',
          building_name: 'Torre Principal',
          headquarters_name: 'Sede Principal Medellín',
          sub_headquarters_name: 'Sin subsede',
          status: 'active',
          label: formatHabitacionDropdownOption({
            roomNumber: '201',
            floor: 2,
            buildingName: 'Torre Principal',
            sedeName: 'Sede Principal Medellín',
            subSedeName: 'Sin subsede',
          }),
        },
        {
          id: 'hab-204',
          name: 'Doble Superior 204',
          number: '204',
          floor: 2,
          capacity: 2,
          price: 95000,
          building_id: 'bld-02',
          building_name: 'Torre Ejecutiva B',
          headquarters_name: 'Sede Principal Medellín',
          sub_headquarters_name: 'Subsede Poblado',
          status: 'active',
          label: formatHabitacionDropdownOption({
            roomNumber: '204',
            floor: 2,
            buildingName: 'Torre Ejecutiva B',
            sedeName: 'Sede Principal Medellín',
            subSedeName: 'Subsede Poblado',
          }),
        },
        {
          id: 'hab-301',
          name: 'Master Suite Presidencial 301',
          number: '301',
          floor: 3,
          capacity: 3,
          price: 350000,
          building_id: 'bld-01',
          building_name: 'Torre Principal',
          headquarters_name: 'Sede Principal Medellín',
          sub_headquarters_name: 'Subsede Poblado',
          status: 'active',
          label: formatHabitacionDropdownOption({
            roomNumber: '301',
            floor: 3,
            buildingName: 'Torre Principal',
            sedeName: 'Sede Principal Medellín',
            subSedeName: 'Subsede Poblado',
          }),
        },
      ]

      return demoRooms
    })

    return edificioId ? allRooms.filter((r) => r.building_id === edificioId) : allRooms
  }

  async getHabitacionById(id: string): Promise<HabitacionInfo | null> {
    if (!id) return null
    const cached = this.roomCache.get(id)
    if (cached !== undefined) return cached

    const inFlight = this.roomInFlight.get(id)
    if (inFlight) return inFlight

    const fetchPromise = (async () => {
      try {
        const res = await catalogApi.getRoom(id)
        if (res.data) {
          const r = res.data
          const num = r.number ? String(r.number) : id.slice(0, 4)
          const name = `Habitación ${num}`
          const info: HabitacionInfo = {
            id,
            name,
            number: num,
            floor: typeof r.floor === 'number' ? r.floor : 1,
            capacity: 2,
            price: typeof r.price_override === 'number' ? r.price_override : 150000,
            building_id: r.building_id ? String(r.building_id) : 'bld-01',
            status: r.status || 'active',
            label: `${name} · Hab. ${num}`,
          }
          this.roomCache.set(id, info)
          return info
        }
      } catch {
        // Fallback al catálogo en memoria si existe
      } finally {
        this.roomInFlight.delete(id)
      }

      const cachedRooms = sharedCollectionCache.get('rooms') as
        | HabitacionInfo[]
        | undefined
      const match = cachedRooms?.find((r) => r.id === id) ?? null
      this.roomCache.set(id, match)
      return match
    })()

    this.roomInFlight.set(id, fetchPromise)
    return fetchPromise
  }

  async getCamas(roomId?: string): Promise<CamaInfo[]> {
    const allBeds = await this.fetchCachedCollection('beds', async () => {
      try {
        const response = await this.balancedGet(
          '/beds',
          (s) => s >= 200 && s < 300
        )

        const raw: RawBed[] = Array.isArray(response.data)
          ? response.data
          : (response.data as { data?: RawBed[] })?.data ?? []

        if (raw.length > 0) {
          return raw.map((b) => ({
            id: String(b.id),
            room_id: String(b.room_id || ''),
            types_bed_id: Array.isArray(b.types_bed_id)
              ? (b.types_bed_id as string[])
              : ['tipo-king-01'],
            etiquette: b.etiquette || 'Cama Principal',
            status: b.status || 'active',
          }))
        }
      } catch {
        // Fallback
      }

      const demoCamas: CamaInfo[] = [
        {
          id: 'cama-01',
          room_id: 'hab-101',
          types_bed_id: ['tb-01'],
          etiquette: 'Cama King Principal 01',
          status: 'active',
        },
        {
          id: 'cama-02',
          room_id: 'hab-102',
          types_bed_id: ['tb-02'],
          etiquette: 'Cama Queen Ejecutiva',
          status: 'active',
        },
        {
          id: 'cama-03',
          room_id: 'hab-201',
          types_bed_id: ['tb-01', 'tb-03'],
          etiquette: 'Cama King + Sofá Cama',
          status: 'active',
        },
        {
          id: 'cama-04',
          room_id: 'hab-204',
          types_bed_id: ['tb-04'],
          etiquette: 'Dos Camas Twin Individuales',
          status: 'active',
        },
        {
          id: 'cama-05',
          room_id: 'hab-301',
          types_bed_id: ['tb-01'],
          etiquette: 'Cama Presidencial Imperial',
          status: 'active',
        },
      ]

      return demoCamas
    })

    return roomId ? allBeds.filter((b) => b.room_id === roomId) : allBeds
  }

  async getTiposCama(): Promise<TipoCamaInfo[]> {
    try {
      const response = await this.balancedGet(
        '/types-bed',
        (s) => s === 200
      )

      const raw: RawTipoCama[] = Array.isArray(response.data)
        ? response.data
        : (response.data as { data?: RawTipoCama[] })?.data ?? []

      if (raw.length > 0) {
        return raw.map((t) => ({
          id: String(t.id),
          name: t.name || 'Cama estándar',
          capacity_people: typeof t.capacity_people === 'number' ? t.capacity_people : 2,
          description: t.description || 'Colchón ortopédico de alta densidad',
        }))
      }
    } catch {
      // Fallback
    }

    return [
      {
        id: 'tb-01',
        name: 'King Size Ortopédica',
        capacity_people: 2,
        description: 'Colchón viscoelástico de alta densidad con soporte ergonómico',
      },
      {
        id: 'tb-02',
        name: 'Queen Size Confort',
        capacity_people: 2,
        description: 'Colchón semi-firme con resortes ensacados individuales',
      },
      {
        id: 'tb-03',
        name: 'Sofá Cama Abatible',
        capacity_people: 1,
        description: 'Sistema abatible suave de lino antifluido con almohadón mullido',
      },
      {
        id: 'tb-04',
        name: 'Twin Individual',
        capacity_people: 1,
        description: 'Cama sencilla compacta con base tapizada y protección antialérgica',
      },
    ]
  }

  async getReservas(): Promise<ReservaInfo[]> {
    return this.fetchCachedCollection('reservas', async () => {
      try {
        const [reserveResponse, huespedes] = await Promise.all([
          executeBalancedRequest(() =>
            api.get<unknown>('/reserve', {
              validateStatus: () => true,
            }),
          ),
          this.getHuespedes(),
        ])

        const validation = validateStatusCode(reserveResponse.status)
        if (!validation.isValid) {
          console.warn(
            `[getReservas] Respuesta no válida en GET /reserve (${reserveResponse.status}):`,
            validation.message,
          )
          return []
        }

        const raw: RawReserva[] = Array.isArray(reserveResponse.data)
          ? reserveResponse.data
          : (reserveResponse.data as { data?: RawReserva[] })?.data ?? []

        if (raw.length === 0) {
          return []
        }

        const validReservas = raw.filter((r) => Boolean(r.id))
        const huespedesMap = new Map(huespedes.map((h) => [h.id, h]))

        // Resolver solo los IDs ausentes en GET /persons en lotes acotados (sin triple fallback)
        const missingPersonIds = Array.from(
          new Set(
            validReservas
              .map((res) => {
                const rawPersonIds = Array.isArray(res.person_ids)
                  ? res.person_ids.map(String)
                  : res.person_id
                    ? [String(res.person_id)]
                    : []
                return rawPersonIds[0] || String(res.person_id || '')
              })
              .filter((pid) => Boolean(pid) && !huespedesMap.has(pid))
          )
        )

        if (missingPersonIds.length > 0) {
          const batchSize =
            detectarRecursosDispositivoRecepciones().policy.batchConcurrency
          for (let i = 0; i < missingPersonIds.length; i += batchSize) {
            const chunk = missingPersonIds.slice(i, i + batchSize)
            const settled = await Promise.allSettled(
              chunk.map((pid) => catalogApi.getPerson(pid))
            )
            settled.forEach((entry, idx) => {
              if (entry.status === 'fulfilled' && entry.value.data) {
                const p = entry.value.data
                const pid = chunk[idx]
                huespedesMap.set(pid, {
                  id: pid,
                  name: p.name || 'Huésped',
                  document_type: p.document_type,
                  document_number: p.document_number,
                  phone_number: p.phone_number,
                  email: p.email,
                  label: `${p.name || 'Huésped'} - ${p.phone_number || ''}`,
                })
              }
            })
          }
        }

        return validReservas.map((res) => {
          const id = String(res.id)
          const roomId = String(res.room_id || '')
          const rawPersonIds = Array.isArray(res.person_ids)
            ? res.person_ids.map(String)
            : res.person_id
              ? [String(res.person_id)]
              : []
          const primaryPersonId = rawPersonIds[0] || String(res.person_id || '')
          const person = primaryPersonId ? huespedesMap.get(primaryPersonId) : undefined

          const guestCount = res.number_of_guests || rawPersonIds.length || 1
          const countSuffix = guestCount > 1 ? ` (${guestCount} huéspedes)` : ''
          const name =
            person?.name || `Huésped #${primaryPersonId.slice(0, 6) || id.slice(0, 6)}`
          const phone = person?.phone_number || 'Sin teléfono'

          return {
            id,
            roomId,
            roomName: roomId ? `Habitación #${roomId.slice(0, 6)}` : 'Sin habitación previa',
            personId: primaryPersonId,
            personIds: rawPersonIds,
            guestName: name,
            guestPhone: phone,
            checkInDate: res.check_in_date || '',
            checkOutDate: res.check_out_date || '',
            numberOfGuests: guestCount,
            state: res.state,
            totalPrice: res.total_price,
            label: `${name} - ${phone}${countSuffix}`,
          }
        })
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          const validation = validateStatusCode(error.response.status)
          console.error(
            `[getReservas] Error HTTP en GET /reserve (${error.response.status}):`,
            validation.message,
          )
        } else {
          const fallbackValidation = validateStatusCode(500)
          console.error(
            '[getReservas] Error de conexión o red en GET /reserve:',
            fallbackValidation.message,
          )
        }
        return []
      }
    })
  }

  async getHuespedes(): Promise<HuespedInfo[]> {
    return this.fetchCachedCollection('persons', async () => {
      try {
        const response = await this.balancedGet(
          '/persons',
          (s) => s >= 200 && s < 300
        )

        const raw: RawPerson[] = Array.isArray(response.data)
          ? response.data
          : (response.data as { data?: RawPerson[] })?.data ?? []

        if (raw.length > 0) {
          return raw
            .filter((p) => Boolean(p.id))
            .map((p) => {
              const id = String(p.id)
              const name = p.name || `Huésped ${id.slice(0, 6)}`
              const doc = p.document_number ? ` · CC ${p.document_number}` : ''
              const tel = p.phone_number ? ` · ${p.phone_number}` : ''

              catalogApi.primePerson({
                id,
                name,
                document_type: p.document_type,
                document_number: p.document_number,
                phone_number: p.phone_number,
                email: p.email,
              })

              return {
                id,
                name,
                document_type: p.document_type,
                document_number: p.document_number,
                phone_number: p.phone_number,
                email: p.email,
                label: `${name}${doc}${tel}`,
              }
            })
        }
      } catch {
        // Fallback
      }

      return [
        {
          id: 'pers-001',
          name: 'Carlos Mendoza',
          document_number: '1020456789',
          phone_number: '+57 310 456 7890',
          email: 'carlos.mendoza@correo.com',
          label: 'Carlos Mendoza · CC 1020456789 · +57 310 456 7890',
        },
        {
          id: 'pers-002',
          name: 'María Fernanda Gómez',
          document_number: '52890123',
          phone_number: '+57 300 987 6543',
          email: 'mf.gomez@empresa.com',
          label: 'María Fernanda Gómez · CC 52890123 · +57 300 987 6543',
        },
        {
          id: 'pers-003',
          name: 'Andrés Felipe Restrepo',
          document_number: '71345678',
          phone_number: '+57 315 222 3344',
          email: 'andres.restrepo@tech.co',
          label: 'Andrés Felipe Restrepo · CC 71345678 · +57 315 222 3344',
        },
      ]
    })
  }

  async getPersonById(id: string): Promise<HuespedInfo | null> {
    if (!id) return null
    const cached = this.personCache.get(id)
    if (cached !== undefined) return cached

    const inFlight = this.personInFlight.get(id)
    if (inFlight) return inFlight

    const fetchPromise = (async (): Promise<HuespedInfo | null> => {
      try {
        const res = await catalogApi.getPerson(id)
        if (res.data) {
          const p = res.data
          const info: HuespedInfo = {
            id,
            name: p.name || 'Huésped',
            document_type: p.document_type,
            document_number: p.document_number,
            phone_number: p.phone_number,
            email: p.email,
            label: `${p.name || 'Huésped'} - ${p.phone_number || ''}`,
          }
          this.personCache.set(id, info)
          return info
        }
      } catch {
        // Fallback desde lista en caché si existe (sin disparar /persons completo)
      } finally {
        this.personInFlight.delete(id)
      }

      const cachedPersons = sharedCollectionCache.get('persons') as
        | HuespedInfo[]
        | undefined
      const match = cachedPersons?.find((h) => h.id === id) ?? null
      this.personCache.set(id, match)
      return match
    })()

    this.personInFlight.set(id, fetchPromise)
    return fetchPromise
  }

  // --- Mapeos y Enriquecimientos Privados ---

  private async enrichRawStays(rawList: RawStay[]): Promise<Recepcion[]> {
    const [sedes, edificios, habitaciones, camas, huespedes] = await Promise.all([
      this.getSedes(),
      this.getEdificios(),
      this.getHabitaciones(),
      this.getCamas(),
      this.getHuespedes(),
    ])

    const sedesMap = new Map(sedes.map((s) => [s.id, s]))
    const edificiosMap = new Map(edificios.map((e) => [e.id, e]))
    const habitacionesMap = new Map(habitaciones.map((h) => [h.id, h]))
    const huespedesMap = new Map(huespedes.map((g) => [g.id, g]))

    return rawList
      .filter((s) => Boolean(s.id))
      .map((stay) => {
        const id = String(stay.id)
        const roomId = String(stay.room_id || '')
        const guestId = String(stay.person_id || '')
        const reservaId = stay.reservation_id ? String(stay.reservation_id) : undefined

        const room = habitacionesMap.get(roomId)
        const building = room?.building_id ? edificiosMap.get(room.building_id) : undefined
        const sede = building?.headquarters_id ? sedesMap.get(building.headquarters_id) : undefined
        const bed = camas.find((c) => c.room_id === roomId)
        const guest = huespedesMap.get(guestId)

        const paymentMethod = stay.payment_method || 'efectivo'
        const paymentLabel = formatMetodoPago(paymentMethod)

        const status = (stay.status || 'progreso').toLowerCase()
        const estadoOpt = ESTADO_OPTIONS.find((e) => e.value === status)
        const estadoLabel = estadoOpt ? estadoOpt.label : status

        const inDate = stay.check_in_date || new Date().toISOString()
        const outDate =
          stay.check_out_date || new Date(Date.now() + 86400000 * 2).toISOString()

        return {
          id,
          roomId,
          roomLabel: room ? `${room.name} · Hab. ${room.number}` : `Habitación #${roomId.slice(0, 5)}`,
          reservaId,
          reservaLabel: reservaId ? `Reserva #${reservaId.slice(0, 6)}` : undefined,
          guestId,
          guestLabel: guest ? guest.label : `Huésped #${guestId.slice(0, 6)}`,
          checkIn: inDate,
          checkOut: outDate,
          metodoPago: paymentMethod,
          metodoPagoLabel: paymentLabel,
          depositoGarantia: Number(stay.security_deposit) || 0,
          estado: status,
          estadoLabel,
          observaciones: stay.remarks,
          createdBy: stay.created_by || 'recepcion@nexora.com',
          createdAt: stay.created_at || new Date().toISOString(),
          sede: sede ? { id: sede.id, name: sede.name, city: sede.city, address: sede.address, phone: sede.phone, status: sede.status } : undefined,
          edificio: building ? { id: building.id, name: building.name, floor: building.floor_number, status: building.status } : undefined,
          habitacion: room ? { id: room.id, number: room.number, name: room.name, floor: room.floor, capacity: room.capacity, price: room.price, status: room.status } : undefined,
          cama: bed ? { id: bed.id, etiquette: bed.etiquette, types_bed_id: bed.types_bed_id, status: bed.status } : undefined,
          huesped: guest ? { id: guest.id, name: guest.name, documentNumber: guest.document_number, phoneNumber: guest.phone_number, email: guest.email } : undefined,
          noches: calcularNoches(inDate, outDate),
        }
      })
  }

  private async buildEnrichedRecepcion(
    payload: RecepcionPayload,
    id: string,
  ): Promise<Recepcion> {
    const primaryPersonId =
      (payload.person_ids && payload.person_ids.length > 0
        ? payload.person_ids[0]
        : '') || ''

    const [habitacion, guest, beds, edificios, sedes] = await Promise.all([
      this.getHabitacionById(payload.room_id),
      this.getPersonById(primaryPersonId),
      this.getCamas(payload.room_id),
      this.getEdificios(),
      this.getSedes(),
    ])

    const building = habitacion?.building_id
      ? edificios.find((e) => e.id === habitacion.building_id)
      : undefined
    const sede = building?.headquarters_id
      ? sedes.find((s) => s.id === building.headquarters_id)
      : undefined
    const bed = beds[0]

    const paymentLabel = formatMetodoPago(payload.payment_method)

    const estadoOpt = ESTADO_OPTIONS.find((e) => e.value === payload.status)
    const estadoLabel = estadoOpt ? estadoOpt.label : payload.status

    return {
      id,
      roomId: payload.room_id,
      roomLabel: habitacion ? `${habitacion.name} · Hab. ${habitacion.number}` : 'Habitación asignada',
      reservaId: payload.reservation_id || undefined,
      reservaLabel: payload.reservation_id ? `Reserva #${payload.reservation_id.slice(0, 6)}` : undefined,
      guestId: primaryPersonId,
      guestLabel: guest ? guest.label : 'Huésped registrado',
      person_ids: payload.person_ids || (primaryPersonId ? [primaryPersonId] : []),
      checkIn: payload.check_in_date,
      checkOut: payload.check_out_date,
      metodoPago: payload.payment_method,
      metodoPagoLabel: paymentLabel,
      depositoGarantia: payload.security_deposit,
      estado: payload.status,
      estadoLabel,
      observaciones: payload.remarks,
      createdBy: payload.created_by,
      createdAt: new Date().toISOString(),
      sede: sede ? { id: sede.id, name: sede.name, city: sede.city, address: sede.address, phone: sede.phone, status: sede.status } : undefined,
      edificio: building ? { id: building.id, name: building.name, floor: building.floor_number, status: building.status } : undefined,
      habitacion: habitacion ? { id: habitacion.id, number: habitacion.number, name: habitacion.name, floor: habitacion.floor, capacity: habitacion.capacity, price: habitacion.price, status: habitacion.status } : undefined,
      cama: bed ? { id: bed.id, etiquette: bed.etiquette, types_bed_id: bed.types_bed_id, status: bed.status } : undefined,
      huesped: guest ? { id: guest.id, name: guest.name, documentNumber: guest.document_number, phoneNumber: guest.phone_number, email: guest.email } : undefined,
      noches: calcularNoches(payload.check_in_date, payload.check_out_date),
    }
  }

  private syncLocalStorage(recepciones: Recepcion[]): void {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recepciones.slice(0, 50)))
    } catch {
      // Ignorar errores de quota en localStorage
    }
  }

  private saveLocally(nueva: Recepcion): void {
    try {
      const list = this.loadFromLocalStorage()
      list.unshift(nueva)
      this.syncLocalStorage(list)
    } catch {
      // Ignorar
    }
  }

  private loadFromLocalStorage(): Recepcion[] {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Recepcion[]
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // Ignorar
    }
    return []
  }

  private async getDemoRecepciones(): Promise<Recepcion[]> {
    const rawDemo: RawStay[] = [
      {
        id: 'stay-001',
        room_id: 'hab-101',
        reservation_id: 'res-101',
        person_id: 'pers-001',
        check_in_date: '2026-09-25T14:00:00Z',
        check_out_date: '2026-09-28T12:00:00Z',
        payment_method: 'tarjeta',
        security_deposit: 50000,
        remarks: 'Huésped VIP. Solicita almohadas hipoalergénicas.',
        status: 'progreso',
        created_by: 'recepcion@nexora.com',
      },
      {
        id: 'stay-002',
        room_id: 'hab-201',
        reservation_id: 'res-102',
        person_id: 'pers-002',
        check_in_date: '2026-09-25T15:30:00Z',
        check_out_date: '2026-09-30T11:00:00Z',
        payment_method: 'transferencia',
        security_deposit: 100000,
        remarks: 'Familia con dos niños pequeños. Cuna instalada.',
        status: 'progreso',
        created_by: 'recepcion@nexora.com',
      },
      {
        id: 'stay-003',
        room_id: 'hab-102',
        reservation_id: 'res-103',
        person_id: 'pers-003',
        check_in_date: '2026-09-26T10:00:00Z',
        check_out_date: '2026-09-29T10:00:00Z',
        payment_method: 'efectivo',
        security_deposit: 50000,
        remarks: 'Llegada temprana confirmada.',
        status: 'progreso',
        created_by: 'recepcion@nexora.com',
      },
      {
        id: 'stay-004',
        room_id: 'hab-204',
        person_id: 'pers-001',
        check_in_date: '2026-09-20T12:00:00Z',
        check_out_date: '2026-09-24T11:00:00Z',
        payment_method: 'tarjeta',
        security_deposit: 50000,
        remarks: 'Estadía anterior completada satisfactoriamente.',
        status: 'finalizada',
        created_by: 'recepcion@nexora.com',
      },
    ]

    return this.enrichRawStays(rawDemo)
  }
}
