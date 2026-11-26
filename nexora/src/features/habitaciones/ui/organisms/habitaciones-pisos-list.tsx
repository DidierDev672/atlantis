import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'motion/react';
import { fadeIn } from '../../../../design-tokens/motion';
import { useHabitacionesPisos } from '../../application/use-habitaciones-pisos';
import { useVerificarHabitacionesTarifas } from '../../application/use-verificar-habitaciones-tarifas';
import {
  matchesHabitacionStatus,
  type RoomRow,
} from '../../domain/habitacion-lista';
import { FloorAccordionSkeleton } from '../atoms/floor-accordion-skeleton';
import type { HabitacionesViewMode } from '../molecules/habitaciones-view-mode-toggle';
import {
  HabitacionesPisosModals,
  type SelectedBuildingState,
  type SelectedTarifasState,
} from './habitaciones-pisos-modals';

const LazyHabitacionesPisosHeader = lazy(
  () => import('../molecules/habitaciones-pisos-header')
);
const LazyHabitacionesPisosFeed = lazy(
  () => import('./habitaciones-pisos-feed')
);

export interface HabitacionesPisosListProps {
  onNewHabitacion?: () => void;
  viewMode?: HabitacionesViewMode;
  onViewModeChange?: (mode: HabitacionesViewMode) => void;
  onSelectHabitacion?: (room: RoomRow) => void;
  refreshVersion?: number;
}

export const HabitacionesPisosList = memo(function HabitacionesPisosList({
  onNewHabitacion,
  viewMode: propViewMode,
  onViewModeChange,
  onSelectHabitacion,
  refreshVersion = 0,
}: HabitacionesPisosListProps) {
  const [internalViewMode, setInternalViewMode] =
    useState<HabitacionesViewMode>('cards');
  const activeViewMode = propViewMode ?? internalViewMode;
  const handleViewModeChange = onViewModeChange ?? setInternalViewMode;

  const [selectedFloorKey, setSelectedFloorKey] = useState<string>('all');
  const [assignGuestDrawerRoom, setAssignGuestDrawerRoom] =
    useState<RoomRow | null>(null);
  const [selectedBuilding, setSelectedBuilding] =
    useState<SelectedBuildingState | null>(null);
  const [selectedRoomForTarifas, setSelectedRoomForTarifas] =
    useState<SelectedTarifasState | null>(null);
  const [selectedRoomForDetail, setSelectedRoomForDetail] =
    useState<RoomRow | null>(null);

  const {
    allRooms,
    floorGroups,
    expandedFloors,
    expandedRoomRefs,
    enrichingFloors,
    floorErrors,
    floorErrorInfos,
    floorBadgeFilters,
    totalCount,
    filteredCount,
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
  } = useHabitacionesPisos();

  const {
    hasTariff,
    getRateId,
    getTariffPrice,
    getTariffName,
    markRoomWithTariff,
    recheckAll,
    isVerifying,
  } = useVerificarHabitacionesTarifas({ rooms: expandedRoomRefs });

  const lastRefreshVersionRef = useRef(refreshVersion);

  useEffect(() => {
    if (refreshVersion <= 0 || refreshVersion === lastRefreshVersionRef.current) {
      return;
    }
    lastRefreshVersionRef.current = refreshVersion;
    void Promise.resolve()
      .then(() => reload())
      .catch((err) => {
        console.error('Error al refrescar pisos tras registro:', err);
      });
  }, [refreshVersion, reload]);

  const handleReloadAll = useCallback(async () => {
    try {
      await reload();
      await recheckAll();
    } catch {
      // Manejado en useHabitacionesPisos
    }
  }, [reload, recheckAll]);

  const handleSelectFloorKey = useCallback(
    (key: string) => {
      try {
        setSelectedFloorKey(key);
        if (key !== 'all' && !expandedFloors.has(key)) {
          toggleFloor(key);
        }
      } catch (err) {
        console.error('Error al seleccionar piso:', err);
      }
    },
    [expandedFloors, toggleFloor]
  );

  const visibleFloorGroups = useMemo(
    () =>
      selectedFloorKey === 'all'
        ? floorGroups
        : floorGroups.filter((g) => g.floorKey === selectedFloorKey),
    [floorGroups, selectedFloorKey]
  );

  const handleQuickMarkAvailable = useCallback(
    async (room: RoomRow) => {
      try {
        await updateRoomStatus(room, 'available');
      } catch (err) {
        console.error('Error al marcar habitación disponible:', err);
      }
    },
    [updateRoomStatus]
  );

  const handleOpenAssignGuestDrawer = useCallback((room: RoomRow) => {
    try {
      if (!matchesHabitacionStatus(room.status, 'available')) return;
      setAssignGuestDrawerRoom(room);
    } catch (err) {
      console.error('Error al abrir drawer de asignación:', err);
    }
  }, []);

  const handleAssignGuestSuccess = useCallback(async () => {
    try {
      if (assignGuestDrawerRoom?.id) {
        markRoomOccupiedLocal(assignGuestDrawerRoom.id);
      }
    } catch (err) {
      console.error(
        'Error al actualizar estado local tras asignar huésped:',
        err
      );
    }
  }, [assignGuestDrawerRoom, markRoomOccupiedLocal]);

  const activeStatuses = useMemo(
    () =>
      filters.statuses && filters.statuses.length > 0
        ? filters.statuses
        : filters.status !== 'all'
          ? [filters.status]
          : [],
    [filters.statuses, filters.status]
  );

  const handleToggleKpiStatus = useCallback(
    (target: string) => {
      try {
        if (target === 'all') {
          setFilters({ ...filters, statuses: [], status: 'all' });
          return;
        }
        const exists = activeStatuses.includes(target);
        const nextStatuses = exists
          ? activeStatuses.filter((s) => s !== target)
          : [...activeStatuses, target];
        setFilters({
          ...filters,
          statuses: nextStatuses,
          status: nextStatuses.length === 1 ? nextStatuses[0] : 'all',
        });
      } catch (err) {
        console.error('Error al alternar filtro de estado:', err);
      }
    },
    [activeStatuses, filters, setFilters]
  );

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.status !== 'all' ||
    (filters.statuses?.length ?? 0) > 0 ||
    filters.buildingId !== 'all' ||
    (filters.roomTypeIds?.length ?? 0) > 0 ||
    selectedFloorKey !== 'all';

  return (
    <motion.section
      aria-label="Mapa operativo de habitaciones por piso"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <Suspense
        fallback={
          <div className="border-line bg-panel h-32 animate-pulse rounded-2xl border p-4" />
        }
      >
        <LazyHabitacionesPisosHeader
          allRooms={allRooms}
          activeStatuses={activeStatuses}
          filters={filters}
          knownBuildings={knownBuildings}
          filteredCount={filteredCount}
          totalCount={totalCount}
          initialLoading={initialLoading}
          viewMode={activeViewMode}
          isVerifying={isVerifying}
          floorGroups={floorGroups}
          selectedFloorKey={selectedFloorKey}
          onToggleKpiStatus={handleToggleKpiStatus}
          onFilterChange={setFilters}
          onReload={() => void handleReloadAll()}
          onViewModeChange={handleViewModeChange}
          onRecheckTarifas={() => void recheckAll()}
          onSelectFloorKey={handleSelectFloorKey}
          onExpandAll={expandAllFloors}
          onCollapseAll={collapseAllFloors}
        />
      </Suspense>

      <Suspense fallback={<FloorAccordionSkeleton count={3} />}>
        <LazyHabitacionesPisosFeed
          error={error}
          errorInfo={errorInfo}
          initialLoading={initialLoading}
          visibleFloorGroups={visibleFloorGroups}
          hasActiveFilters={hasActiveFilters}
          expandedFloors={expandedFloors}
          enrichingFloors={enrichingFloors}
          floorErrors={floorErrors}
          floorErrorInfos={floorErrorInfos}
          floorBadgeFilters={floorBadgeFilters}
          viewMode={activeViewMode}
          hasTariff={hasTariff}
          getRateId={getRateId}
          getTariffPrice={getTariffPrice}
          getTariffName={getTariffName}
          isVerifying={isVerifying}
          onReload={reload}
          onNewHabitacion={onNewHabitacion}
          onToggleFloor={toggleFloor}
          onSelectBadge={selectFloorBadge}
          onRetryFloor={retryFloor}
          onRetryBuilding={retryBuilding}
          onRetryBed={retryBed}
          onOpenBuilding={(id, summary, room) =>
            setSelectedBuilding({
              id,
              summary,
              room: { number: room.number, floor: room.floor },
            })
          }
          onOpenTarifas={(row, roomHasTariff, rateId) =>
            setSelectedRoomForTarifas({
              id: row.id,
              number: row.number,
              floor: row.floor,
              hasTariff: roomHasTariff,
              rateId,
            })
          }
          onOpenRoomDetail={setSelectedRoomForDetail}
          onSelectHabitacion={onSelectHabitacion ?? handleOpenAssignGuestDrawer}
          onOpenAssignGuestDrawer={handleOpenAssignGuestDrawer}
          onQuickMarkAvailable={handleQuickMarkAvailable}
        />
      </Suspense>

      <HabitacionesPisosModals
        selectedBuilding={selectedBuilding}
        selectedRoomForTarifas={selectedRoomForTarifas}
        selectedRoomForDetail={selectedRoomForDetail}
        assignGuestDrawerRoom={assignGuestDrawerRoom}
        hasTariff={hasTariff}
        getRateId={getRateId}
        getTariffPrice={getTariffPrice}
        getTariffName={getTariffName}
        onCloseBuilding={() => setSelectedBuilding(null)}
        onCloseTarifas={() => setSelectedRoomForTarifas(null)}
        onCloseDetail={() => setSelectedRoomForDetail(null)}
        onCloseAssignGuestDrawer={() => setAssignGuestDrawerRoom(null)}
        onAssignGuestSuccess={handleAssignGuestSuccess}
        onTariffApplied={markRoomWithTariff}
        onSelectTarifas={setSelectedRoomForTarifas}
        onSelectBuilding={setSelectedBuilding}
      />
    </motion.section>
  );
});

export default HabitacionesPisosList;
