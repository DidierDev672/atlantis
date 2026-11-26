import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import type { RoomRow } from '../domain/habitacion-lista'
import {
  applySingleBedResult,
  applySingleBuildingResult,
  markBedRetrying,
  markBuildingRetrying,
} from '../domain/habitaciones-lista-updaters'
import { updateRoomStatusInRows } from '../domain/habitaciones-pisos-helpers'
import { getHabitacionListaRepository } from '../infrastructure/get-habitacion-lista-repository'

export interface UseHabitacionesPisosMutationsOptions {
  setRows: Dispatch<SetStateAction<RoomRow[]>>
  isMountedRef: MutableRefObject<boolean>
}

/**
 * Sub-hook SRP para mutaciones locales y reintentos puntuales sobre habitaciones y catálogos.
 */
export function useHabitacionesPisosMutations({
  setRows,
  isMountedRef,
}: UseHabitacionesPisosMutationsOptions) {
  const retryBuilding = useCallback(
    async (buildingId: string) => {
      if (!buildingId) return
      setRows((prev) => markBuildingRetrying(prev, buildingId))
      try {
        const repo = await getHabitacionListaRepository()
        repo.invalidateBuilding(buildingId)
        const data = await repo.getBuilding(buildingId)
        if (!isMountedRef.current) return
        setRows((prev) => applySingleBuildingResult(prev, buildingId, data))
      } catch (err) {
        console.error('Error al reintentar carga de edificio:', err)
        if (!isMountedRef.current) return
        setRows((prev) => applySingleBuildingResult(prev, buildingId, null))
      }
    },
    [isMountedRef, setRows]
  )

  const retryBed = useCallback(
    async (bedId: string) => {
      if (!bedId) return
      setRows((prev) => markBedRetrying(prev, bedId))
      try {
        const repo = await getHabitacionListaRepository()
        repo.invalidateBed(bedId)
        const data = await repo.getBedType(bedId)
        if (!isMountedRef.current) return
        setRows((prev) => applySingleBedResult(prev, bedId, data))
      } catch (err) {
        console.error('Error al reintentar tipo de cama:', err)
        if (!isMountedRef.current) return
        setRows((prev) => applySingleBedResult(prev, bedId, null))
      }
    },
    [isMountedRef, setRows]
  )

  const updateRoomStatus = useCallback(
    async (room: RoomRow, newStatus: string) => {
      try {
        const repo = await getHabitacionListaRepository()
        await repo.updateRoomStatus(room, newStatus)
      } catch (err) {
        console.error('Error al actualizar estado de habitación en API:', err)
      }
      if (!isMountedRef.current) return
      setRows((prev) => updateRoomStatusInRows(prev, room.id, newStatus))
    },
    [isMountedRef, setRows]
  )

  const markRoomOccupiedLocal = useCallback(
    (roomId: string) => {
      try {
        const cleanId = String(roomId).trim()
        if (!cleanId) return
        setRows((prev) => updateRoomStatusInRows(prev, cleanId, 'busy'))
      } catch (err) {
        console.error('Error al marcar habitación ocupada localmente:', err)
      }
    },
    [setRows]
  )

  return {
    retryBuilding,
    retryBed,
    updateRoomStatus,
    markRoomOccupiedLocal,
  }
}
