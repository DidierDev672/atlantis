import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  compareRoomNumbersDesc,
  filterHabitacionesRows,
  groupRoomsByFloor,
  mapRawToRoomRow,
  normalizeFloorKey,
  type FloorGroup,
  type HabitacionesListFilters,
  type RoomRow,
} from '../domain/habitacion-lista';
import type { FloorStatusBadgeFilter } from '../domain/piso-badge-filter';
import { ApiHabitacionListaRepository } from '../infrastructure/api-habitacion-lista-repository';
import { detectarCapacidadesHardwareYRed } from '../infrastructure/device-resource-profile';
import {
  applyFloorEnrichmentToRows,
  fetchFloorEnrichmentBatch,
  preloadBuildingsMap,
} from './enrich-floor-rooms';
import { invalidateOperativaStayCache } from './operativa-stay-cache';

const repository = new ApiHabitacionListaRepository();

export function useHabitacionesPisos() {
  const [rows, setRows] = useState<RoomRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<HabitacionesListFilters>({
    search: '',
    status: 'all',
    statuses: [],
    buildingId: 'all',
    roomTypeIds: [],
  });
  const [knownBuildings, setKnownBuildings] = useState<
    { id: string; name: string }[]
  >([]);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(
    () => new Set()
  );
  const [enrichingFloors, setEnrichingFloors] = useState<
    Record<string, boolean>
  >({});
  const [floorErrors, setFloorErrors] = useState<Record<string, string | null>>(
    {}
  );
  const [floorBadgeFilters, setFloorBadgeFilters] = useState<
    Record<string, FloorStatusBadgeFilter>
  >({});

  const isMountedRef = useRef(true);
  const rowsRef = useRef<RoomRow[]>([]);
  const enrichedFloorsRef = useRef<Set<string>>(new Set());
  const expandedFloorsRef = useRef<Set<string>>(new Set());
  const floorBadgeFiltersRef = useRef<Record<string, FloorStatusBadgeFilter>>(
    {}
  );

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    expandedFloorsRef.current = expandedFloors;
  }, [expandedFloors]);

  useEffect(() => {
    floorBadgeFiltersRef.current = floorBadgeFilters;
  }, [floorBadgeFilters]);

  useEffect(() => {
    isMountedRef.current = true;
    const enrichedRef = enrichedFloorsRef;
    const expandedRef = expandedFloorsRef;
    return () => {
      isMountedRef.current = false;
      rowsRef.current = [];
      enrichedRef.current.clear();
      expandedRef.current.clear();
      floorBadgeFiltersRef.current = {};
    };
  }, []);

  const enrichFloor = useCallback(
    async (floorKey: string, targetRows?: RoomRow[]) => {
      const source = targetRows ?? rowsRef.current;
      const floorRows = source.filter(
        (r) => normalizeFloorKey(r.floor) === floorKey
      );
      if (floorRows.length === 0) return;

      enrichedFloorsRef.current.add(floorKey);
      setEnrichingFloors((prev) => ({ ...prev, [floorKey]: true }));
      setFloorErrors((prev) => ({ ...prev, [floorKey]: null }));

      try {
        const batch = await fetchFloorEnrichmentBatch(repository, floorRows);
        if (!isMountedRef.current) return;

        if (batch.buildingsById.size > 0 || batch.bedsById.size > 0) {
          setRows((prev) => applyFloorEnrichmentToRows(prev, batch));
        }
        if (batch.resolvedBuildingNames.length > 0) {
          setKnownBuildings((prev) => {
            const seen = new Set(prev.map((b) => b.id));
            const additions = batch.resolvedBuildingNames.filter(
              (b) => !seen.has(b.id)
            );
            return additions.length > 0 ? [...prev, ...additions] : prev;
          });
        }
      } catch {
        if (!isMountedRef.current) return;
        enrichedFloorsRef.current.delete(floorKey);
        setFloorErrors((prev) => ({
          ...prev,
          [floorKey]: 'Ocurrió un error al cargar los detalles de este piso.',
        }));
      } finally {
        if (isMountedRef.current) {
          setEnrichingFloors((prev) => ({ ...prev, [floorKey]: false }));
        }
      }
    },
    []
  );

  const preloadKnownBuildings = useCallback(async (mappedRows: RoomRow[]) => {
    try {
      const byId = await preloadBuildingsMap(repository, mappedRows);
      if (!isMountedRef.current || byId.size === 0) return;

      setKnownBuildings(
        Array.from(byId.values()).map(({ id, name }) => ({ id, name }))
      );
      setRows((prev) =>
        prev.map((row) => {
          const match = row.buildingId ? byId.get(row.buildingId) : undefined;
          return match
            ? { ...row, building: { ...match, loading: false, error: false } }
            : row;
        })
      );
    } catch {
      // El filtro de edificios es auxiliar
    }
  }, []);

  const applyLoadedRawRooms = useCallback(
    (rawData: Awaited<ReturnType<typeof repository.getRooms>>) => {
      const mapped = [...rawData]
        .sort((a, b) => compareRoomNumbersDesc(a.number, b.number))
        .map(mapRawToRoomRow);
      rowsRef.current = mapped;
      setRows(mapped);

      const firstFloor = groupRoomsByFloor(mapped)[0]?.floorKey;
      setExpandedFloors(firstFloor ? new Set([firstFloor]) : new Set());

      const { allowPreloadAllBuildings } =
        detectarCapacidadesHardwareYRed().policy;
      if (allowPreloadAllBuildings) {
        void preloadKnownBuildings(mapped);
      }
      if (firstFloor) {
        void enrichFloor(firstFloor, mapped);
      }
    },
    [enrichFloor, preloadKnownBuildings]
  );

  const reload = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    enrichedFloorsRef.current.clear();
    setFloorErrors({});
    setFloorBadgeFilters({});
    try {
      const rawData = await repository.getRooms();
      if (!isMountedRef.current) return;
      applyLoadedRawRooms(rawData);
    } catch {
      if (!isMountedRef.current) return;
      setError(
        'No pudimos conectar con el servidor para obtener las habitaciones. Verifica tu conexión e inténtalo de nuevo.'
      );
    } finally {
      if (isMountedRef.current) setInitialLoading(false);
    }
  }, [applyLoadedRawRooms]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rawData = await repository.getRooms();
        if (!active || !isMountedRef.current) return;
        applyLoadedRawRooms(rawData);
      } catch {
        if (!active || !isMountedRef.current) return;
        setError(
          'No pudimos conectar con el servidor para obtener las habitaciones. Verifica tu conexión e inténtalo de nuevo.'
        );
      } finally {
        if (active && isMountedRef.current) setInitialLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyLoadedRawRooms]);

  const toggleFloor = useCallback(
    (floorKey: string) => {
      const willOpen = !expandedFloorsRef.current.has(floorKey);
      setExpandedFloors((prev) => {
        const next = new Set(prev);
        if (next.has(floorKey)) next.delete(floorKey);
        else next.add(floorKey);
        return next;
      });
      if (willOpen && !enrichedFloorsRef.current.has(floorKey)) {
        void enrichFloor(floorKey);
      }
    },
    [enrichFloor]
  );

  const selectFloorBadge = useCallback(
    async (floorKey: string, badge: FloorStatusBadgeFilter) => {
      try {
        const current = floorBadgeFiltersRef.current[floorKey] ?? 'all';
        const nextBadge: FloorStatusBadgeFilter =
          badge === 'all' ? 'all' : current === badge ? 'all' : badge;
        setFloorBadgeFilters((prev) => ({ ...prev, [floorKey]: nextBadge }));
        if (!expandedFloorsRef.current.has(floorKey)) {
          setExpandedFloors((prev) => new Set(prev).add(floorKey));
        }
        if (!enrichedFloorsRef.current.has(floorKey)) {
          await enrichFloor(floorKey);
        }
      } catch {
        if (!isMountedRef.current) return;
        setFloorErrors((prev) => ({
          ...prev,
          [floorKey]: 'No pudimos filtrar las habitaciones de este piso.',
        }));
      }
    },
    [enrichFloor]
  );

  const retryFloor = useCallback(
    async (floorKey: string) => {
      enrichedFloorsRef.current.delete(floorKey);
      await enrichFloor(floorKey);
    },
    [enrichFloor]
  );

  const retryBuilding = useCallback(async (buildingId: string) => {
    if (!buildingId) return;
    repository.invalidateBuilding(buildingId);
    try {
      const data = await repository.getBuilding(buildingId);
      if (!isMountedRef.current || !data) return;
      setRows((prev) =>
        prev.map((r) =>
          r.buildingId === buildingId
            ? { ...r, building: { id: buildingId, ...data, loading: false, error: false } }
            : r
        )
      );
    } catch {
      if (!isMountedRef.current) return;
      setRows((prev) =>
        prev.map((r) =>
          r.buildingId === buildingId
            ? { ...r, building: { ...r.building, loading: false, error: true, name: 'No disponible' } }
            : r
        )
      );
    }
  }, []);

  const retryBed = useCallback(async (bedId: string) => {
    if (!bedId) return;
    repository.invalidateBed(bedId);
    try {
      const data = await repository.getBedType(bedId);
      if (!isMountedRef.current || !data) return;
      setRows((prev) =>
        prev.map((r) =>
          r.roomTypesId === bedId
            ? { ...r, bed: { id: bedId, ...data, loading: false, error: false } }
            : r
        )
      );
    } catch {
      if (!isMountedRef.current) return;
      setRows((prev) =>
        prev.map((r) =>
          r.roomTypesId === bedId
            ? { ...r, bed: { ...r.bed, loading: false, error: true, name: 'No disponible' } }
            : r
        )
      );
    }
  }, []);

  const filteredRows = useMemo(
    () => filterHabitacionesRows(rows, filters),
    [rows, filters]
  );
  const floorGroups: FloorGroup[] = useMemo(
    () => groupRoomsByFloor(filteredRows),
    [filteredRows]
  );

  const setFilters = useCallback(
    (next: HabitacionesListFilters) => {
      setFiltersState(next);
      const hasActive =
        Boolean(next.search.trim()) ||
        next.status !== 'all' ||
        (next.statuses?.length ?? 0) > 0 ||
        next.buildingId !== 'all' ||
        (next.roomTypeIds?.length ?? 0) > 0;
      if (hasActive) {
        const matchedKeys = groupRoomsByFloor(
          filterHabitacionesRows(rowsRef.current, next)
        ).map((g) => g.floorKey);
        setExpandedFloors(new Set(matchedKeys));
        for (const key of matchedKeys) {
          if (!enrichedFloorsRef.current.has(key)) void enrichFloor(key);
        }
      }
    },
    [enrichFloor]
  );

  const expandAllFloors = useCallback(() => {
    const keys = floorGroups.map((g) => g.floorKey);
    setExpandedFloors(new Set(keys));
    for (const key of keys) {
      if (!enrichedFloorsRef.current.has(key)) void enrichFloor(key);
    }
  }, [floorGroups, enrichFloor]);

  const collapseAllFloors = useCallback(() => {
    setExpandedFloors(new Set());
  }, []);

  const expandedRoomRefs = useMemo(() => {
    const refs: Array<{ id: string }> = [];
    for (const group of floorGroups) {
      if (!expandedFloors.has(group.floorKey)) continue;
      for (const room of group.rooms) refs.push({ id: room.id });
    }
    return refs;
  }, [floorGroups, expandedFloors]);

  const updateRoomStatus = useCallback(
    async (room: RoomRow, newStatus: string) => {
      try {
        await repository.updateRoomStatus(room, newStatus);
      } catch (err) {
        console.error('Error al actualizar estado de habitación en API:', err);
      }
      if (!isMountedRef.current) return;
      setRows((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
            : r
        )
      );
    },
    []
  );

  const markRoomOccupiedLocal = useCallback((roomId: string) => {
    const cleanId = String(roomId).trim();
    if (!cleanId) return;
    invalidateOperativaStayCache(cleanId);
    setRows((prev) =>
      prev.map((r) =>
        r.id === cleanId
          ? { ...r, status: 'busy', updatedAt: new Date().toISOString() }
          : r
      )
    );
  }, []);

  return {
    allRooms: rows,
    floorGroups,
    expandedFloors,
    expandedRoomRefs,
    enrichingFloors,
    floorErrors,
    floorBadgeFilters,
    totalCount: rows.length,
    filteredCount: filteredRows.length,
    initialLoading,
    error,
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
  };
}
