export type HabitacionEstadoKey =
  | 'available'
  | 'occupied'
  | 'busy'
  | 'maintenance'
  | 'cleaning'
  | 'inactive'
  | string

/**
 * Determina si una habitación se encuentra actualmente ocupada
 * considerando los estados canónicos y del backend ('busy', 'occupied', 'ocupada').
 */
export function isHabitacionOcupada(status?: string | null): boolean {
  if (!status) return false
  const s = status.toLowerCase().trim()
  return (
    s === 'busy' ||
    s === 'occupied' ||
    s === 'ocupada' ||
    s === 'ocupado' ||
    s.includes('busy') ||
    s.includes('ocup')
  )
}

export interface BedDetail {
  id?: string
  name: string
  capacityPeople?: number
  loading: boolean
  error: boolean
}

export interface BuildingDetail {
  id?: string
  name: string
  floorNumber?: number
  headquartersId?: string
  subHeadquartersId?: string
  loading: boolean
  error: boolean
}

export interface RoomRow {
  id: string
  number: string
  floor: number | string
  status: HabitacionEstadoKey
  priceOverride: number | null
  updatedAt?: string
  createdAt?: string
  roomTypesId?: string
  buildingId?: string
  bed: BedDetail
  building: BuildingDetail
}

export interface RawRoomData {
  id: string | number
  number?: string | number
  floor?: string | number
  status?: string
  price_override?: number | string | null
  price?: number | string | null
  room_types_id?: string
  room_type_id?: string
  building_id?: string
  updated_at?: string
  created_at?: string
}

export interface RawBuildingData {
  id: string
  name?: string
  floor_number?: number
  headquarters_id?: string
  sub_headquarters_id?: string
}

export interface RawBedTypeData {
  id: string
  name?: string
  capacity_people?: number
  capacity?: number
  description?: string
}

export interface HabitacionesListFilters {
  search: string
  status: string
  statuses?: string[]
  buildingId: string
  roomTypeIds?: string[]
}

export interface RawRoomTypeCatalogItem {
  id: string | number
  name?: string
  capacity?: number | string
  base_price?: number | string
}

/**
 * Compara dos números de habitación para ordenarlas de mayor a menor (descendente).
 * Prioriza la magnitud numérica real y aplica orden alfanumérico natural en caso de sufijos.
 */
export function compareRoomNumbersDesc(
  aNumRaw?: string | number | null,
  bNumRaw?: string | number | null
): number {
  const aStr = String(aNumRaw ?? '').trim()
  const bStr = String(bNumRaw ?? '').trim()

  const aMatch = aStr.match(/\d+/)
  const bMatch = bStr.match(/\d+/)

  if (aMatch && bMatch) {
    const aVal = parseInt(aMatch[0], 10)
    const bVal = parseInt(bMatch[0], 10)
    if (aVal !== bVal) {
      return bVal - aVal // Descendente (de mayor a menor)
    }
  }

  // Fallback con orden alfanumérico descendente natural
  return bStr.localeCompare(aStr, undefined, { numeric: true, sensitivity: 'base' })
}

export interface FloorGroup {
  floorKey: string
  floorLabel: string
  rooms: RoomRow[]
  totalCount: number
  availableCount: number
  occupiedCount: number
}

/**
 * Determina si una habitación admite asignación de huésped desde la UI.
 */
export function puedeAsignarHuesped(status?: string | null): boolean {
  return !isHabitacionOcupada(status)
}

/**
 * Normaliza el estado de una habitación frente al filtro seleccionado.
 */
export function matchesHabitacionStatus(
  rawStatus: string,
  filterStatus: string
): boolean {
  if (filterStatus === 'all') return true
  const rowStatus = rawStatus.toLowerCase().trim()
  const target = filterStatus.toLowerCase().trim()

  if (rowStatus === target) return true
  if (target === 'occupied') {
    return rowStatus === 'busy' || rowStatus === 'ocupada' || rowStatus === 'ocupado'
  }
  if (target === 'available') {
    return rowStatus === 'disponible' || rowStatus === 'free' || rowStatus === 'libre'
  }
  if (target === 'maintenance') return rowStatus === 'mantenimiento'
  if (target === 'cleaning') {
    return rowStatus === 'limpieza' || rowStatus === 'dirty' || rowStatus === 'sucia'
  }
  if (target === 'inactive') {
    return rowStatus === 'inactiva' || rowStatus === 'inactivo' || rowStatus === 'disabled'
  }
  return false
}

export function normalizeFloorKey(floor?: string | number | null): string {
  const raw = String(floor ?? '').trim()
  return raw.length > 0 ? raw : '1'
}

export function formatFloorLabel(floorKey: string): string {
  const clean = floorKey.trim()
  if (!clean) return 'Piso 1'
  return /^\d+$/.test(clean) ? `Piso ${clean}` : clean
}

/**
 * Ordena pisos de menor a mayor (Piso 1, Piso 2, ...), dejando pisos no numéricos al final.
 */
export function compareFloorsAsc(
  aRaw?: string | number | null,
  bRaw?: string | number | null
): number {
  const aStr = normalizeFloorKey(aRaw)
  const bStr = normalizeFloorKey(bRaw)

  const aIsNum = /^-?\d+$/.test(aStr)
  const bIsNum = /^-?\d+$/.test(bStr)

  if (aIsNum && bIsNum) {
    return parseInt(aStr, 10) - parseInt(bStr, 10)
  }
  if (aIsNum) return -1
  if (bIsNum) return 1

  return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Agrupa habitaciones por piso, ordenando los pisos ascendentemente y
 * las habitaciones dentro de cada piso de mayor a menor número.
 */
export function groupRoomsByFloor(rooms: RoomRow[]): FloorGroup[] {
  const map = new Map<string, RoomRow[]>()

  for (const room of rooms) {
    const key = normalizeFloorKey(room.floor)
    const bucket = map.get(key)
    if (bucket) {
      bucket.push(room)
    } else {
      map.set(key, [room])
    }
  }

  return Array.from(map.entries())
    .sort(([keyA], [keyB]) => compareFloorsAsc(keyA, keyB))
    .map(([floorKey, floorRooms]) => {
      const sortedRooms = [...floorRooms].sort((a, b) =>
        compareRoomNumbersDesc(a.number, b.number)
      )
      const occupiedCount = sortedRooms.filter((r) => isHabitacionOcupada(r.status)).length
      const availableCount = sortedRooms.filter((r) =>
        matchesHabitacionStatus(r.status, 'available')
      ).length

      return {
        floorKey,
        floorLabel: formatFloorLabel(floorKey),
        rooms: sortedRooms,
        totalCount: sortedRooms.length,
        availableCount,
        occupiedCount,
      }
    })
}

export function mapRawToRoomRow(raw: RawRoomData): RoomRow {
  const id = String(raw.id)
  const num = raw.number ? String(raw.number).trim() : id.slice(-4)
  const floor = raw.floor != null ? raw.floor : 1
  const status = raw.status ? String(raw.status).toLowerCase().trim() : 'available'

  let priceOverride: number | null = null
  if (raw.price_override != null && raw.price_override !== '') {
    const parsed = Number(String(raw.price_override).replace(',', '.'))
    if (!Number.isNaN(parsed) && parsed > 0) {
      priceOverride = parsed
    }
  }

  const buildingId = raw.building_id ? String(raw.building_id).trim() : undefined
  const rawTypeId = raw.room_types_id || raw.room_type_id
  const roomTypesId = rawTypeId ? String(rawTypeId).trim() : undefined

  return {
    id,
    number: num,
    floor,
    status,
    priceOverride,
    updatedAt: raw.updated_at,
    createdAt: raw.created_at,
    roomTypesId,
    buildingId,
    bed: {
      id: roomTypesId,
      name: roomTypesId ? 'Cargando cama…' : 'No asignada',
      loading: Boolean(roomTypesId),
      error: false,
    },
    building: {
      id: buildingId,
      name: buildingId ? 'Cargando edificio…' : 'Sin edificio',
      loading: Boolean(buildingId),
      error: false,
    },
  }
}

export function filterHabitacionesRows(
  rows: RoomRow[],
  filters: HabitacionesListFilters
): RoomRow[] {
  try {
    const query = filters.search.trim().toLowerCase()
    const selectedStatuses =
      filters.statuses && filters.statuses.length > 0
        ? filters.statuses
        : filters.status !== 'all'
          ? [filters.status]
          : []
    const selectedRoomTypes = filters.roomTypeIds ?? []

    return rows.filter((row) => {
      if (query) {
        const matches =
          row.number.toLowerCase().includes(query) ||
          String(row.floor).toLowerCase().includes(query) ||
          row.building.name.toLowerCase().includes(query) ||
          row.bed.name.toLowerCase().includes(query)
        if (!matches) return false
      }

      if (
        selectedStatuses.length > 0 &&
        !selectedStatuses.some((s) => matchesHabitacionStatus(row.status, s))
      ) {
        return false
      }

      if (filters.buildingId !== 'all' && row.buildingId !== filters.buildingId) {
        return false
      }

      if (selectedRoomTypes.length > 0) {
        const roomTypeId = row.roomTypesId ?? row.bed.id ?? ''
        if (!selectedRoomTypes.includes(roomTypeId)) {
          return false
        }
      }

      return true
    })
  } catch {
    return rows
  }
}

