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
  const [knownBuildings, setKnownBuildings] = useState<{ id: string; name: string }[]>([]);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(() => new Set());
  const [enrichingFloors, setEnrichingFloors] = useState<Record<string, boolean>>({});
  const [floorErrors, setFloorErrors] = useState<Record<string, string | null>>({});
  const [floorBadgeFilters, setFloorBadgeFilters] = useState<
    Record<string, FloorStatusBadgeFilter>
  >({});

  const isMountedRef = useRef(true);
  const rowsRef = useRef<RoomRow[]>([]);
  const enrichedFloorsRef = useRef<Set<string>>(new Set());
  const expandedFloorsRef = useRef<Set<string>>(new Set());
  const floorBadgeFiltersRef = useRef<Record<string, FloorStatusBadgeFilter>>({});

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
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Carga perezosa (async/await + try/catch) de edificios y tipos de cama para un piso específico.
   */
  const enrichFloor = useCallback(async (floorKey: string, targetRows?: RoomRow[]) => {
    const source = targetRows ?? rowsRef.current;
    const floorRows = source.filter((r) => normalizeFloorKey(r.floor) === floorKey);
    if (floorRows.length === 0) return;

    enrichedFloorsRef.current.add(floorKey);
    setEnrichingFloors((prev) => ({ ...prev, [floorKey]: true }));
    setFloorErrors((prev) => ({ ...prev, [floorKey]: null }));

    try {
      const buildingIds = Array.from(
        new Set(floorRows.map((r) => r.buildingId).filter((id): id is string => Boolean(id)))
      );
      const bedIds = Array.from(
        new Set(floorRows.map((r) => r.roomTypesId).filter((id): id is string => Boolean(id)))
      );

      const buildingTasks = buildingIds.map(async (bId) => {
        try {
          const data = await repository.getBuilding(bId);
          if (!isMountedRef.current || !data) return;
          setRows((prev) =>
            prev.map((r) =>
              r.buildingId === bId
                ? { ...r, building: { id: bId, ...data, loading: false, error: false } }
                : r
            )
          );
          setKnownBuildings((prev) =>
            prev.some((b) => b.id === bId) ? prev : [...prev, { id: bId, name: data.name }]
          );
        } catch {
          if (!isMountedRef.current) return;
          setRows((prev) =>
            prev.map((r) =>
              r.buildingId === bId
                ? { ...r, building: { id: bId, name: 'No disponible', loading: false, error: true } }
                : r
            )
          );
        }
      });

      const bedTasks = bedIds.map(async (bedId) => {
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
                ? { ...r, bed: { id: bedId, name: 'No disponible', loading: false, error: true } }
                : r
            )
          );
        }
      });

      await Promise.allSettled([...buildingTasks, ...bedTasks]);
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
  }, []);

  /**
   * Resuelve el catálogo de edificios para habilitar el filtro desde la carga inicial.
   */
  const preloadKnownBuildings = useCallback(async (mappedRows: RoomRow[]) => {
    try {
      const uniqueIds = Array.from(
        new Set(mappedRows.map((r) => r.buildingId).filter((id): id is string => Boolean(id)))
      );
      const settled = await Promise.allSettled(
        uniqueIds.map(async (id) => {
          const data = await repository.getBuilding(id);
          return data ? { id, ...data } : null;
        })
      );
      if (!isMountedRef.current) return;

      const resolved = settled
        .filter(
          (
            r
          ): r is PromiseFulfilledResult<{
            id: string;
            name: string;
            floorNumber?: number;
            headquartersId?: string;
            subHeadquartersId?: string;
          } | null> => r.status === 'fulfilled'
        )
        .map((r) => r.value)
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (resolved.length > 0) {
        const byId = new Map(resolved.map((b) => [b.id, b]));
        setKnownBuildings(resolved.map(({ id, name }) => ({ id, name })));
        setRows((prev) =>
          prev.map((row) => {
            const match = row.buildingId ? byId.get(row.buildingId) : undefined;
            return match ? { ...row, building: { ...match, loading: false, error: false } } : row;
          })
        );
      }
    } catch {
      // El filtro de edificios es auxiliar; la vista de pisos continúa funcionando.
    }
  }, []);

  const applyLoadedRawRooms = useCallback(
    (rawData: Awaited<ReturnType<typeof repository.getRooms>>) => {
      const sortedRaw = [...rawData].sort((a, b) => compareRoomNumbersDesc(a.number, b.number));
      const mapped = sortedRaw.map(mapRawToRoomRow);
      rowsRef.current = mapped;
      setRows(mapped);

      const groups = groupRoomsByFloor(mapped);
      const firstFloor = groups[0]?.floorKey;
      setExpandedFloors(firstFloor ? new Set([firstFloor]) : new Set());

      void preloadKnownBuildings(mapped);
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
      if (isMountedRef.current) {
        setInitialLoading(false);
      }
    }
  }, [applyLoadedRawRooms]);

  useEffect(() => {
    let active = true;

    async function loadOnMount() {
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
        if (active && isMountedRef.current) {
          setInitialLoading(false);
        }
      }
    }

    void loadOnMount();
    return () => {
      active = false;
    };
  }, [applyLoadedRawRooms]);

  const toggleFloor = useCallback(
    (floorKey: string) => {
      const willOpen = !expandedFloorsRef.current.has(floorKey);
      setExpandedFloors((prev) => {
        const next = new Set(prev);
        if (next.has(floorKey)) {
          next.delete(floorKey);
        } else {
          next.add(floorKey);
        }
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
          setExpandedFloors((prev) => {
            const next = new Set(prev);
            next.add(floorKey);
            return next;
          });
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
    setRows((prev) =>
      prev.map((r) =>
        r.buildingId === buildingId
          ? { ...r, building: { ...r.building, loading: true, error: false, name: 'Reintentando…' } }
          : r
      )
    );
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
    setRows((prev) =>
      prev.map((r) =>
        r.roomTypesId === bedId
          ? { ...r, bed: { ...r.bed, loading: true, error: false, name: 'Reintentando…' } }
          : r
      )
    );
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

  const filteredRows = useMemo(() => filterHabitacionesRows(rows, filters), [rows, filters]);
  const floorGroups: FloorGroup[] = useMemo(() => groupRoomsByFloor(filteredRows), [filteredRows]);

  const setFilters = useCallback(
    (next: HabitacionesListFilters) => {
      setFiltersState(next);
      const hasActiveFilter =
        Boolean(next.search.trim()) ||
        next.status !== 'all' ||
        (next.statuses?.length ?? 0) > 0 ||
        next.buildingId !== 'all' ||
        (next.roomTypeIds?.length ?? 0) > 0;

      if (hasActiveFilter) {
        const matchedKeys = groupRoomsByFloor(filterHabitacionesRows(rowsRef.current, next)).map(
          (g) => g.floorKey
        );
        setExpandedFloors(new Set(matchedKeys));
        matchedKeys.forEach((key) => {
          if (!enrichedFloorsRef.current.has(key)) {
            void enrichFloor(key);
          }
        });
      }
    },
    [enrichFloor]
  );

  const expandAllFloors = useCallback(() => {
    const keys = floorGroups.map((g) => g.floorKey);
    setExpandedFloors(new Set(keys));
    keys.forEach((key) => {
      if (!enrichedFloorsRef.current.has(key)) {
        void enrichFloor(key);
      }
    });
  }, [floorGroups, enrichFloor]);

  const collapseAllFloors = useCallback(() => {
    setExpandedFloors(new Set());
  }, []);

  const expandedRooms = useMemo(
    () => floorGroups.filter((g) => expandedFloors.has(g.floorKey)).flatMap((g) => g.rooms),
    [floorGroups, expandedFloors]
  );

  const updateRoomStatus = useCallback(async (room: RoomRow, newStatus: string) => {
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
  }, []);

  return {
    allRooms: rows,
    floorGroups,
    expandedFloors,
    expandedRooms,
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
  };
}
