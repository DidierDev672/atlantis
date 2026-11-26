import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDeviceResourceProfile } from '../../../shared/lib/use-device-resource-profile'
import {
  compareRoomNumbersDesc,
  filterHabitacionesRows,
  groupRoomsByFloor,
  mapRawToRoomRow,
  normalizeFloorKey,
  type FloorGroup,
  type HabitacionesListFilters,
  type RawRoomData,
  type RoomRow,
} from '../domain/habitacion-lista'
import { mergeKnownBuildings } from '../domain/habitaciones-lista-updaters'
import {
  applyPreloadedBuildingsToRows,
  getExpandedRoomRefs,
  hasActiveListFilters,
  toggleExpandedFloorSet,
} from '../domain/habitaciones-pisos-helpers'
import type { FloorStatusBadgeFilter } from '../domain/piso-badge-filter'
import { getHabitacionListaRepository } from '../infrastructure/get-habitacion-lista-repository'
import {
  applyFloorEnrichmentToRows,
  fetchFloorEnrichmentBatch,
  preloadBuildingsMap,
} from './enrich-floor-rooms'
import {
  resolveHabitacionesFetchError,
  type HabitacionesErrorInfo,
} from './habitaciones-error-resolver'
import { useHabitacionesPisosMutations } from './use-habitaciones-pisos-mutations'

/**
 * Hook de aplicación para el mapa de habitaciones por piso, adaptado a perfiles
 * de hardware/red (`useDeviceResourceProfile`) y con resolución de excepciones para `PlanetAlert`.
 */
export function useHabitacionesPisos() {
  const resourceProfile = useDeviceResourceProfile()
  const [rows, setRows] = useState<RoomRow[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorInfo, setErrorInfo] = useState<HabitacionesErrorInfo | null>(null)
  const [filters, setFiltersState] = useState<HabitacionesListFilters>({
    search: '',
    status: 'all',
    statuses: [],
    buildingId: 'all',
    roomTypeIds: [],
  })
  const [knownBuildings, setKnownBuildings] = useState<{ id: string; name: string }[]>([])
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(() => new Set())
  const [enrichingFloors, setEnrichingFloors] = useState<Record<string, boolean>>({})
  const [floorErrors, setFloorErrors] = useState<Record<string, string | null>>({})
  const [floorErrorInfos, setFloorErrorInfos] = useState<
    Record<string, HabitacionesErrorInfo | null>
  >({})
  const [floorBadgeFilters, setFloorBadgeFilters] = useState<
    Record<string, FloorStatusBadgeFilter>
  >({})

  const isMountedRef = useRef(true)
  const rowsRef = useRef<RoomRow[]>([])
  const enrichedFloorsRef = useRef<Set<string>>(new Set())
  const expandedFloorsRef = useRef<Set<string>>(new Set())
  const floorBadgeFiltersRef = useRef<Record<string, FloorStatusBadgeFilter>>({})
  const resourceProfileRef = useRef(resourceProfile)

  useEffect(() => { rowsRef.current = rows }, [rows])
  useEffect(() => { expandedFloorsRef.current = expandedFloors }, [expandedFloors])
  useEffect(() => { floorBadgeFiltersRef.current = floorBadgeFilters }, [floorBadgeFilters])
  useEffect(() => { resourceProfileRef.current = resourceProfile }, [resourceProfile])

  useEffect(() => {
    isMountedRef.current = true
    const enrichedRef = enrichedFloorsRef
    const expandedRef = expandedFloorsRef
    return () => {
      isMountedRef.current = false
      rowsRef.current = []
      enrichedRef.current.clear()
      expandedRef.current.clear()
      floorBadgeFiltersRef.current = {}
    }
  }, [])

  const enrichFloor = useCallback(async (floorKey: string, targetRows?: RoomRow[]) => {
    const source = targetRows ?? rowsRef.current
    const floorRows = source.filter((r) => normalizeFloorKey(r.floor) === floorKey)
    if (floorRows.length === 0) return

    enrichedFloorsRef.current.add(floorKey)
    setEnrichingFloors((prev) => ({ ...prev, [floorKey]: true }))
    setFloorErrors((prev) => ({ ...prev, [floorKey]: null }))
    setFloorErrorInfos((prev) => ({ ...prev, [floorKey]: null }))

    try {
      const repo = await getHabitacionListaRepository()
      const batch = await fetchFloorEnrichmentBatch(repo, floorRows)
      if (!isMountedRef.current) return

      if (batch.buildingsById.size > 0 || batch.bedsById.size > 0) {
        setRows((prev) => applyFloorEnrichmentToRows(prev, batch))
      }
      if (batch.resolvedBuildingNames.length > 0) {
        setKnownBuildings((prev) => mergeKnownBuildings(prev, batch.resolvedBuildingNames))
      }
    } catch (err) {
      if (!isMountedRef.current) return
      enrichedFloorsRef.current.delete(floorKey)
      const resolved = resolveHabitacionesFetchError(
        err,
        'Ocurrió un error al cargar los detalles de este piso.'
      )
      setFloorErrors((prev) => ({ ...prev, [floorKey]: resolved.message }))
      setFloorErrorInfos((prev) => ({ ...prev, [floorKey]: resolved }))
    } finally {
      if (isMountedRef.current) {
        setEnrichingFloors((prev) => ({ ...prev, [floorKey]: false }))
      }
    }
  }, [])

  const preloadKnownBuildings = useCallback(async (mappedRows: RoomRow[]) => {
    try {
      const repo = await getHabitacionListaRepository()
      const byId = await preloadBuildingsMap(repo, mappedRows)
      if (!isMountedRef.current || byId.size === 0) return

      setKnownBuildings(Array.from(byId.values()).map(({ id, name }) => ({ id, name })))
      setRows((prev) => applyPreloadedBuildingsToRows(prev, byId))
    } catch (err) {
      console.error('Error al precargar catálogo de edificios:', err)
    }
  }, [])

  const applyLoadedRawRooms = useCallback(
    (rawData: RawRoomData[]) => {
      try {
        const mapped = [...rawData]
          .sort((a, b) => compareRoomNumbersDesc(a.number, b.number))
          .map(mapRawToRoomRow)
        rowsRef.current = mapped
        setRows(mapped)

        const firstFloor = groupRoomsByFloor(mapped)[0]?.floorKey
        setExpandedFloors(firstFloor ? new Set([firstFloor]) : new Set())

        const { policy, network } = resourceProfileRef.current
        const allowPreload =
          policy.allowPreloadAllBuildings && !network.saveData && network.tier !== 'low'
        if (allowPreload) {
          void preloadKnownBuildings(mapped)
        }
        if (firstFloor) {
          void enrichFloor(firstFloor, mapped)
        }
      } catch (err) {
        console.error('Error al procesar lista de pisos y habitaciones:', err)
      }
    },
    [enrichFloor, preloadKnownBuildings]
  )

  const reload = useCallback(async () => {
    setInitialLoading(true)
    setError(null)
    setErrorInfo(null)
    enrichedFloorsRef.current.clear()
    setFloorErrors({})
    setFloorErrorInfos({})
    setFloorBadgeFilters({})
    try {
      const repo = await getHabitacionListaRepository()
      const rawData = await repo.getRooms()
      if (!isMountedRef.current) return
      applyLoadedRawRooms(rawData)
    } catch (err) {
      if (!isMountedRef.current) return
      const resolved = resolveHabitacionesFetchError(err)
      setError(resolved.message)
      setErrorInfo(resolved)
    } finally {
      if (isMountedRef.current) setInitialLoading(false)
    }
  }, [applyLoadedRawRooms])

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => (active ? reload() : undefined))
      .catch((err) => {
        console.error('Error al inicializar lista de pisos:', err)
      })
    return () => {
      active = false
    }
  }, [reload])

  const toggleFloor = useCallback(
    (floorKey: string) => {
      try {
        const willOpen = !expandedFloorsRef.current.has(floorKey)
        setExpandedFloors((prev) => toggleExpandedFloorSet(prev, floorKey))
        if (willOpen && !enrichedFloorsRef.current.has(floorKey)) {
          void enrichFloor(floorKey)
        }
      } catch (err) {
        console.error('Error al expandir o contraer piso:', err)
      }
    },
    [enrichFloor]
  )

  const selectFloorBadge = useCallback(
    async (floorKey: string, badge: FloorStatusBadgeFilter) => {
      try {
        const current = floorBadgeFiltersRef.current[floorKey] ?? 'all'
        const nextBadge: FloorStatusBadgeFilter =
          badge === 'all' ? 'all' : current === badge ? 'all' : badge
        setFloorBadgeFilters((prev) => ({ ...prev, [floorKey]: nextBadge }))
        if (!expandedFloorsRef.current.has(floorKey)) {
          setExpandedFloors((prev) => new Set(prev).add(floorKey))
        }
        if (!enrichedFloorsRef.current.has(floorKey)) {
          await enrichFloor(floorKey)
        }
      } catch (err) {
        if (!isMountedRef.current) return
        const resolved = resolveHabitacionesFetchError(
          err,
          'No pudimos filtrar las habitaciones de este piso.'
        )
        setFloorErrors((prev) => ({ ...prev, [floorKey]: resolved.message }))
        setFloorErrorInfos((prev) => ({ ...prev, [floorKey]: resolved }))
      }
    },
    [enrichFloor]
  )

  const retryFloor = useCallback(
    async (floorKey: string) => {
      try {
        enrichedFloorsRef.current.delete(floorKey)
        await enrichFloor(floorKey)
      } catch (err) {
        console.error('Error al reintentar piso:', err)
      }
    },
    [enrichFloor]
  )

  const { retryBuilding, retryBed, updateRoomStatus, markRoomOccupiedLocal } =
    useHabitacionesPisosMutations({ setRows, isMountedRef })

  const filteredRows = useMemo(() => filterHabitacionesRows(rows, filters), [rows, filters])
  const floorGroups: FloorGroup[] = useMemo(() => groupRoomsByFloor(filteredRows), [filteredRows])

  const setFilters = useCallback(
    (next: HabitacionesListFilters) => {
      try {
        setFiltersState(next)
        if (!hasActiveListFilters(next)) return
        const matchedKeys = groupRoomsByFloor(
          filterHabitacionesRows(rowsRef.current, next)
        ).map((g) => g.floorKey)
        setExpandedFloors(new Set(matchedKeys))
        for (const key of matchedKeys) {
          if (!enrichedFloorsRef.current.has(key)) void enrichFloor(key)
        }
      } catch (err) {
        console.error('Error al aplicar filtros por piso:', err)
      }
    },
    [enrichFloor]
  )

  const expandAllFloors = useCallback(() => {
    try {
      const keys = floorGroups.map((g) => g.floorKey)
      setExpandedFloors(new Set(keys))
      for (const key of keys) {
        if (!enrichedFloorsRef.current.has(key)) void enrichFloor(key)
      }
    } catch (err) {
      console.error('Error al expandir todos los pisos:', err)
    }
  }, [floorGroups, enrichFloor])

  const collapseAllFloors = useCallback(() => setExpandedFloors(new Set()), [])

  const expandedRoomRefs = useMemo(
    () => getExpandedRoomRefs(floorGroups, expandedFloors),
    [floorGroups, expandedFloors]
  )

  return {
    allRooms: rows,
    floorGroups,
    expandedFloors,
    expandedRoomRefs,
    enrichingFloors,
    floorErrors,
    floorErrorInfos,
    floorBadgeFilters,
    totalCount: rows.length,
    filteredCount: filteredRows.length,
    initialLoading,
    error,
    errorInfo,
    filters,
    knownBuildings,
    setFilters,
    toggleFloor,
    selectFloorBadge,
    expandAllFloors,
    collapseAllFloors,
    reload,
    retryFloor,
    retryBuilding,
    retryBed,
    updateRoomStatus,
    markRoomOccupiedLocal,
  }
}
