import type { RoomRow } from './habitacion-lista'
import type {
  BedCacheEntry,
  BuildingCacheEntry,
} from '../infrastructure/api-habitacion-lista-repository'

export interface KnownBuildingItem {
  id: string
  name: string
}

/**
 * Fusiona edificios recién resueltos sin duplicar entradas existentes.
 */
export function mergeKnownBuildings(
  prev: KnownBuildingItem[],
  incoming: ReadonlyArray<KnownBuildingItem>
): KnownBuildingItem[] {
  if (incoming.length === 0) return prev
  const existingIds = new Set(prev.map((b) => b.id))
  const additions = incoming.filter((b) => {
    if (existingIds.has(b.id)) return false
    existingIds.add(b.id)
    return true
  })
  return additions.length > 0 ? [...prev, ...additions] : prev
}

export function markBuildingRetrying(
  prev: RoomRow[],
  buildingId: string
): RoomRow[] {
  return prev.map((row) =>
    row.buildingId === buildingId
      ? {
          ...row,
          building: {
            ...row.building,
            loading: true,
            error: false,
            name: 'Reintentando…',
          },
        }
      : row
  )
}

export function applySingleBuildingResult(
  prev: RoomRow[],
  buildingId: string,
  data: BuildingCacheEntry | null
): RoomRow[] {
  return prev.map((row) =>
    row.buildingId === buildingId
      ? {
          ...row,
          building: data
            ? {
                id: buildingId,
                name: data.name,
                floorNumber: data.floorNumber,
                headquartersId: data.headquartersId,
                subHeadquartersId: data.subHeadquartersId,
                loading: false,
                error: false,
              }
            : {
                ...row.building,
                id: buildingId,
                loading: false,
                error: true,
                name: 'No disponible',
              },
        }
      : row
  )
}

export function markBedRetrying(prev: RoomRow[], bedId: string): RoomRow[] {
  return prev.map((row) =>
    row.roomTypesId === bedId
      ? {
          ...row,
          bed: {
            ...row.bed,
            loading: true,
            error: false,
            name: 'Reintentando…',
          },
        }
      : row
  )
}

export function applySingleBedResult(
  prev: RoomRow[],
  bedId: string,
  data: BedCacheEntry | null
): RoomRow[] {
  return prev.map((row) =>
    row.roomTypesId === bedId
      ? {
          ...row,
          bed: data
            ? {
                id: bedId,
                name: data.name,
                capacityPeople: data.capacityPeople,
                loading: false,
                error: false,
              }
            : {
                ...row.bed,
                id: bedId,
                loading: false,
                error: true,
                name: 'No disponible',
              },
        }
      : row
  )
}
