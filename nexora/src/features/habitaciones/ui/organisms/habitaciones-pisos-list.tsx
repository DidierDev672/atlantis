import { Suspense, lazy, memo, useCallback, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { fadeIn } from '../../../../design-tokens/motion';
import { useHabitacionesPisos } from '../../application/use-habitaciones-pisos';
import { useVerificarHabitacionesTarifas } from '../../application/use-verificar-habitaciones-tarifas';
import { matchesHabitacionStatus, type RoomRow } from '../../domain/habitacion-lista';
import { FloorAccordionSkeleton } from '../atoms/floor-accordion-skeleton';
import { FloorNavigationPills } from '../molecules/floor-navigation-pills';
import { HabitacionesEmptyState } from '../molecules/habitaciones-empty-state';
import { HabitacionesErrorState } from '../molecules/habitaciones-error-state';
import { HabitacionesFiltrosBar } from '../molecules/habitaciones-filtros-bar';
import type { HabitacionesViewMode } from '../molecules/habitaciones-view-mode-toggle';
import {
  HabitacionesPisosModals,
  type SelectedBuildingState,
  type SelectedTarifasState,
} from './habitaciones-pisos-modals';
import { PisoAccordionItem } from './piso-accordion-item';

const LazyHabitacionesKpiFilterBar = lazy(
  () => import('../molecules/habitaciones-kpi-filter-bar')
);

export interface HabitacionesPisosListProps {
  onNewHabitacion?: () => void;
  viewMode?: HabitacionesViewMode;
  onViewModeChange?: (mode: HabitacionesViewMode) => void;
  onSelectHabitacion?: (room: RoomRow) => void;
}

export const HabitacionesPisosList = memo(function HabitacionesPisosList({
  onNewHabitacion,
  viewMode: propViewMode,
  onViewModeChange,
  onSelectHabitacion,
}: HabitacionesPisosListProps) {
  const [internalViewMode, setInternalViewMode] =
    useState<HabitacionesViewMode>('cards');
  const activeViewMode = propViewMode ?? internalViewMode;
  const handleViewModeChange = onViewModeChange ?? setInternalViewMode;

  const [selectedFloorKey, setSelectedFloorKey] = useState<string>('all');
  const [drawerRoom, setDrawerRoom] = useState<RoomRow | null>(null);
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
    expandedRooms,
    enrichingFloors,
    floorErrors,
    floorBadgeFilters,
    totalCount,
    filteredCount,
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
  } = useHabitacionesPisos();

  const {
    hasTariff,
    getRateId,
    getTariffPrice,
    getTariffName,
    markRoomWithTariff,
    recheckAll,
    isVerifying,
  } = useVerificarHabitacionesTarifas({ rooms: expandedRooms });

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
      setSelectedFloorKey(key);
      if (key !== 'all' && !expandedFloors.has(key)) {
        toggleFloor(key);
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
      await updateRoomStatus(room, 'available');
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
      await reload();
    } catch (err) {
      console.error('Error al recargar habitaciones tras asignar huésped:', err);
    }
  }, [reload]);

  const handleDrawerStatusChange = useCallback(
    async (room: RoomRow, newStatus: string) => {
      await updateRoomStatus(room, newStatus);
      setDrawerRoom((prev) =>
        prev && prev.id === room.id ? { ...prev, status: newStatus } : prev
      );
    },
    [updateRoomStatus]
  );

  const activeDrawerRoom = useMemo(() => {
    if (!drawerRoom) return null;
    return allRooms.find((r) => r.id === drawerRoom.id) ?? drawerRoom;
  }, [allRooms, drawerRoom]);

  const drawerNightlyRate = useMemo(() => {
    if (!activeDrawerRoom) return 0;
    return (
      activeDrawerRoom.priceOverride ??
      getTariffPrice(activeDrawerRoom.id) ??
      0
    );
  }, [activeDrawerRoom, getTariffPrice]);

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

  return (
    <motion.section
      aria-label="Mapa operativo de habitaciones por piso"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Cabecera Operativa: KPIs Minimalistas + Filtros + Píldoras de Piso */}
      <div className="border-line bg-panel space-y-3 rounded-2xl border p-4 shadow-sm sm:p-5">
        <Suspense
          fallback={
            <div className="bg-line/35 h-8 w-full max-w-xl animate-pulse rounded-full" />
          }
        >
          <LazyHabitacionesKpiFilterBar
            rooms={allRooms}
            activeStatuses={activeStatuses}
            onSelectStatus={handleToggleKpiStatus}
          />
        </Suspense>

        <HabitacionesFiltrosBar
          filters={filters}
          knownBuildings={knownBuildings}
          loadedCount={filteredCount}
          totalCount={totalCount}
          filteredCount={filteredCount}
          onFilterChange={setFilters}
          onReload={handleReloadAll}
          isReloading={initialLoading}
          viewMode={activeViewMode}
          onViewModeChange={handleViewModeChange}
          onRecheckTarifas={recheckAll}
          isVerifyingTarifas={isVerifying}
        />

        <FloorNavigationPills
          floorGroups={floorGroups}
          selectedFloorKey={selectedFloorKey}
          onSelectFloorKey={handleSelectFloorKey}
          onExpandAll={expandAllFloors}
          onCollapseAll={collapseAllFloors}
        />
      </div>

      {error ? (
        <div className="border-line bg-panel rounded-2xl border p-4 shadow-sm sm:p-6">
          <HabitacionesErrorState
            message={error}
            actionLabel="Reintentar carga de habitaciones"
            onRetry={reload}
          />
        </div>
      ) : initialLoading ? (
        <FloorAccordionSkeleton count={3} />
      ) : visibleFloorGroups.length === 0 ? (
        <div className="border-line bg-panel rounded-2xl border p-4 shadow-sm sm:p-6">
          <HabitacionesEmptyState
            hasActiveFilters={
              Boolean(filters.search.trim()) ||
              filters.status !== 'all' ||
              (filters.statuses?.length ?? 0) > 0 ||
              filters.buildingId !== 'all' ||
              (filters.roomTypeIds?.length ?? 0) > 0 ||
              selectedFloorKey !== 'all'
            }
            onNewHabitacion={onNewHabitacion}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFloorGroups.map((group) => (
            <PisoAccordionItem
              key={group.floorKey}
              group={group}
              isOpen={expandedFloors.has(group.floorKey)}
              isEnriching={Boolean(enrichingFloors[group.floorKey])}
              floorError={floorErrors[group.floorKey] ?? null}
              activeBadgeFilter={floorBadgeFilters[group.floorKey] ?? 'all'}
              viewMode={activeViewMode}
              hasTariff={hasTariff}
              getRateId={getRateId}
              getTariffPrice={getTariffPrice}
              getTariffName={getTariffName}
              isVerifying={isVerifying}
              onToggle={toggleFloor}
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
              onSelectHabitacion={onSelectHabitacion}
              onOpenOperativaDrawer={setDrawerRoom}
              onOpenAssignGuestDrawer={handleOpenAssignGuestDrawer}
              onQuickMarkAvailable={handleQuickMarkAvailable}
            />
          ))}
        </div>
      )}

      <HabitacionesPisosModals
        selectedBuilding={selectedBuilding}
        selectedRoomForTarifas={selectedRoomForTarifas}
        selectedRoomForDetail={selectedRoomForDetail}
        activeDrawerRoom={activeDrawerRoom}
        drawerNightlyRate={drawerNightlyRate}
        assignGuestDrawerRoom={assignGuestDrawerRoom}
        hasTariff={hasTariff}
        getRateId={getRateId}
        getTariffPrice={getTariffPrice}
        getTariffName={getTariffName}
        onCloseBuilding={() => setSelectedBuilding(null)}
        onCloseTarifas={() => setSelectedRoomForTarifas(null)}
        onCloseDetail={() => setSelectedRoomForDetail(null)}
        onCloseOperativaDrawer={() => setDrawerRoom(null)}
        onCloseAssignGuestDrawer={() => setAssignGuestDrawerRoom(null)}
        onAssignGuestSuccess={handleAssignGuestSuccess}
        onAssignGuestFromOperativa={(room) => {
          setDrawerRoom(null);
          onSelectHabitacion?.(room);
        }}
        onChangeDrawerStatus={handleDrawerStatusChange}
        onTariffApplied={markRoomWithTariff}
        onSelectTarifas={setSelectedRoomForTarifas}
        onSelectBuilding={setSelectedBuilding}
        onOpenFullDetailFromDrawer={(room) => {
          setDrawerRoom(null);
          setSelectedRoomForDetail(room);
        }}
      />
    </motion.section>
  );
});

export default HabitacionesPisosList;
