import { useEffect, useMemo, useState } from 'react'
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'
import { fetchBuildingDetailByIdCached } from '../infrastructure/sedes-and-menu-cache'

export interface EdificioOption {
  value: string
  label: string
  floorNumber?: number
}

export function useEdificioFloors(
  edificioId: string,
  edificios: ReadonlyArray<EdificioOption>,
  piso: string
) {
  const [fetchedFloors, setFetchedFloors] = useState<
    Record<string, number | null>
  >({})

  const selectedEdificio = useMemo(
    () => edificios.find((item) => item.value === edificioId),
    [edificios, edificioId]
  )

  const knownFloorNumber =
    selectedEdificio?.floorNumber != null && selectedEdificio.floorNumber > 0
      ? selectedEdificio.floorNumber
      : undefined

  const cachedFetchedFloor = edificioId ? fetchedFloors[edificioId] : undefined

  const loadingFloors = Boolean(
    edificioId && knownFloorNumber == null && cachedFetchedFloor === undefined
  )

  useEffect(() => {
    if (!edificioId || knownFloorNumber != null) return
    if (cachedFetchedFloor !== undefined) return

    let active = true

    async function loadBuildingFloors() {
      try {
        const detail = await fetchBuildingDetailByIdCached(edificioId)
        if (!active) return
        const parsed =
          typeof detail?.floor_number === 'number' && detail.floor_number > 0
            ? detail.floor_number
            : null
        setFetchedFloors((prev) => ({
          ...prev,
          [edificioId]: parsed ?? 5,
        }))
      } catch {
        if (!active) return
        setFetchedFloors((prev) => ({ ...prev, [edificioId]: 5 }))
      }
    }

    void loadBuildingFloors()
    return () => {
      active = false
    }
  }, [edificioId, knownFloorNumber, cachedFetchedFloor])

  const totalPisos = knownFloorNumber ?? cachedFetchedFloor ?? 0

  const effectivePiso = useMemo(() => {
    if (!edificioId || !piso) return ''
    if (totalPisos > 0) {
      const numericFloor = Number(piso)
      if (
        Number.isNaN(numericFloor) ||
        numericFloor < 1 ||
        numericFloor > totalPisos
      ) {
        return ''
      }
    }
    return piso
  }, [edificioId, piso, totalPisos])

  const pisoOptions = useMemo<DropdownOption[]>(() => {
    if (!edificioId || totalPisos <= 0) return []
    return Array.from({ length: totalPisos }, (_, idx) => {
      const floorNumber = idx + 1
      return {
        value: String(floorNumber),
        label: `Piso ${floorNumber}`,
      }
    })
  }, [edificioId, totalPisos])

  return {
    selectedEdificio,
    loadingFloors,
    totalPisos,
    effectivePiso,
    pisoOptions,
    fetchedFloors,
  }
}
