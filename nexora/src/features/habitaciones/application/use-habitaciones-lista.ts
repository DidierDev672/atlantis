import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  filterHabitacionesRows,
  mapRawToRoomRow,
  type HabitacionesListFilters,
  type RawRoomData,
  type RoomRow,
} from '../domain/habitacion-lista'
import {
  applySingleBedResult,
  applySingleBuildingResult,
  markBedRetrying,
  markBuildingRetrying,
  mergeKnownBuildings,
  type KnownBuildingItem,
} from '../domain/habitaciones-lista-updaters'
import { getHabitacionListaRepository } from '../infrastructure/get-habitacion-lista-repository'
import {
  applyFloorEnrichmentToRows,
  fetchFloorEnrichmentBatch,
} from './enrich-floor-rooms'
import {
  resolveHabitacionesFetchError,
  type HabitacionesErrorInfo,
} from './habitaciones-error-resolver'
import { useDeviceResourceProfile } from './use-device-resource-profile'

/**
 * Hook de aplicación para listar habitaciones paginadas con enriquecimiento en lote,
 * adaptado al perfil de hardware/red (`useDeviceResourceProfile`).
 */
export function useHabitacionesLista() {
  const { policy } = useDeviceResourceProfile()
  const pageSize = policy.tier === 'ultra-light' ? 10 : 15

  const [allRawRooms, setAllRawRooms] = useState<RawRoomData[]>([])
  const [rows, setRows] = useState<RoomRow[]>([])
  const [page, setPage] = useState(1)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorInfo, setErrorInfo] = useState<HabitacionesErrorInfo | null>(null)
  const [filters, setFilters] = useState<HabitacionesListFilters>({
    search: '',
    status: 'all',
    buildingId: 'all',
  })
  const [knownBuildings, setKnownBuildings] = useState<KnownBuildingItem[]>([])

  const isMountedRef = useRef(true)
  const loadMoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (loadMoreTimerRef.current !== null) {
        clearTimeout(loadMoreTimerRef.current)
        loadMoreTimerRef.current = null
      }
    }
  }, [])

  /** Enriquece edificios y camas únicos en lote aplicando una sola actualización por grupo. */
  const enrichBatch = useCallback(async (targetRows: RoomRow[]) => {
    if (targetRows.length === 0) return
    try {
      const repo = await getHabitacionListaRepository()
      const batch = await fetchFloorEnrichmentBatch(repo, targetRows)
      if (!isMountedRef.current) return
      setRows((prev) => applyFloorEnrichmentToRows(prev, batch))
      if (batch.resolvedBuildingNames.length > 0) {
        setKnownBuildings((prev) =>
          mergeKnownBuildings(prev, batch.resolvedBuildingNames)
        )
      }
    } catch (err) {
      console.error('Error al enriquecer lote de habitaciones:', err)
    }
  }, [])

  /** Carga inicial completa de habitaciones desde `GET /room`. */
  const loadInitialRooms = useCallback(async () => {
    setInitialLoading(true)
    setError(null)
    setErrorInfo(null)
    try {
      const repo = await getHabitacionListaRepository()
      const sorted = await repo.getRooms()
      if (!isMountedRef.current) return

      setAllRawRooms(sorted)
      const firstPageRows = sorted.slice(0, pageSize).map(mapRawToRoomRow)
      setRows(firstPageRows)
      setPage(1)

      void enrichBatch(firstPageRows)
    } catch (err) {
      console.error('Error al cargar habitaciones iniciales:', err)
      if (!isMountedRef.current) return
      const resolved = resolveHabitacionesFetchError(err)
      setError(resolved.message)
      setErrorInfo(resolved)
    } finally {
      if (isMountedRef.current) {
        setInitialLoading(false)
      }
    }
  }, [enrichBatch, pageSize])

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        if (!active) return
        return loadInitialRooms()
      })
      .catch((err) => {
        console.error('Error al inicializar lista de habitaciones:', err)
      })
    return () => {
      active = false
    }
  }, [loadInitialRooms])

  /** Carga la siguiente página incremental evitando fugas de timers al desmontar. */
  const loadMore = useCallback(async () => {
    if (loadingMore || initialLoading) return

    const startIndex = page * pageSize
    if (startIndex >= allRawRooms.length) return

    setLoadingMore(true)
    try {
      if (policy.enableAnimations) {
        await new Promise<void>((resolve) => {
          loadMoreTimerRef.current = setTimeout(() => {
            loadMoreTimerRef.current = null
            resolve()
          }, 200)
        })
      }
      if (!isMountedRef.current) return

      const nextBatchRows = allRawRooms
        .slice(startIndex, startIndex + pageSize)
        .map(mapRawToRoomRow)

      setRows((prev) => [...prev, ...nextBatchRows])
      setPage((prev) => prev + 1)
      void enrichBatch(nextBatchRows)
    } catch (err) {
      console.error('Error al cargar más habitaciones:', err)
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false)
      }
    }
  }, [
    allRawRooms,
    enrichBatch,
    initialLoading,
    loadingMore,
    page,
    pageSize,
    policy.enableAnimations,
  ])

  /** Reintento puntual de un edificio desde la fila correspondiente. */
  const retryBuilding = useCallback(async (buildingId: string) => {
    if (!buildingId) return
    setRows((prev) => markBuildingRetrying(prev, buildingId))

    try {
      const repo = await getHabitacionListaRepository()
      repo.invalidateBuilding(buildingId)
      const data = await repo.getBuilding(buildingId)
      if (!isMountedRef.current) return

      setRows((prev) => applySingleBuildingResult(prev, buildingId, data))
      if (data) {
        setKnownBuildings((prev) =>
          mergeKnownBuildings(prev, [{ id: buildingId, name: data.name }])
        )
      }
    } catch (err) {
      console.error('Error al reintentar edificio:', err)
      if (!isMountedRef.current) return
      setRows((prev) => applySingleBuildingResult(prev, buildingId, null))
    }
  }, [])

  /** Reintento puntual de una cama desde la fila correspondiente. */
  const retryBed = useCallback(async (bedId: string) => {
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
  }, [])

  const filteredRows = useMemo(
    () => filterHabitacionesRows(rows, filters),
    [rows, filters]
  )

  return {
    rows: filteredRows,
    totalRawCount: allRawRooms.length,
    loadedCount: rows.length,
    initialLoading,
    loadingMore,
    hasMore: rows.length < allRawRooms.length,
    error,
    errorInfo,
    filters,
    knownBuildings,
    setFilters,
    loadMore,
    reload: loadInitialRooms,
    retryBuilding,
    retryBed,
  }
}

export default useHabitacionesLista
