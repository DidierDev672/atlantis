import type {
  FloorGroup,
  HabitacionesListFilters,
  RoomRow,
} from './habitacion-lista'
import type { BuildingCacheEntry } from '../infrastructure/api-habitacion-lista-repository'

/**
 * Indica si existe algún filtro de búsqueda, estado, edificio o tipo activo.
 */
export function hasActiveListFilters(filters: HabitacionesListFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    filters.status !== 'all' ||
    (filters.statuses?.length ?? 0) > 0 ||
    filters.buildingId !== 'all' ||
    (filters.roomTypeIds?.length ?? 0) > 0
  )
}

/**
 * Extrae las referencias mínimas `{ id }` de habitaciones pertenecientes a pisos expandidos.
 */
export function getExpandedRoomRefs(
  floorGroups: ReadonlyArray<FloorGroup>,
  expandedFloors: ReadonlySet<string>
): Array<{ id: string }> {
  const refs: Array<{ id: string }> = []
  for (const group of floorGroups) {
    if (!expandedFloors.has(group.floorKey)) continue
    for (const room of group.rooms) refs.push({ id: room.id })
  }
  return refs
}

/**
 * Aplica en bloque los edificios precargados sobre las filas actuales.
 */
export function applyPreloadedBuildingsToRows(
  prev: RoomRow[],
  byId: ReadonlyMap<string, BuildingCacheEntry & { id: string }>
): RoomRow[] {
  return prev.map((row) => {
    const match = row.buildingId ? byId.get(row.buildingId) : undefined
    return match
      ? { ...row, building: { ...match, loading: false, error: false } }
      : row
  })
}

/**
 * Alterna la expansión de un piso manteniendo inmutable el `Set` de estado.
 */
export function toggleExpandedFloorSet(
  prev: ReadonlySet<string>,
  floorKey: string
): Set<string> {
  const next = new Set(prev)
  if (next.has(floorKey)) next.delete(floorKey)
  else next.add(floorKey)
  return next
}

/**
 * Actualiza localmente el estado de una habitación (`status` y `updatedAt`).
 */
export function updateRoomStatusInRows(
  prev: RoomRow[],
  roomId: string,
  newStatus: string
): RoomRow[] {
  const timestamp = new Date().toISOString()
  return prev.map((row) =>
    row.id === roomId ? { ...row, status: newStatus, updatedAt: timestamp } : row
  )
}
