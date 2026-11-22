import { Suspense, lazy, memo } from 'react';
import type {
  FloorGroup,
  HabitacionesListFilters,
  RoomRow,
} from '../../domain/habitacion-lista';
import { FloorNavigationPills } from '../molecules/floor-navigation-pills';
import { HabitacionesFiltrosBar } from '../molecules/habitaciones-filtros-bar';
import type { HabitacionesViewMode } from '../molecules/habitaciones-view-mode-toggle';

const LazyHabitacionesKpiFilterBar = lazy(
  () => import('../molecules/habitaciones-kpi-filter-bar')
);

export interface HabitacionesPisosHeaderProps {
  allRooms: RoomRow[];
  activeStatuses: string[];
  filters: HabitacionesListFilters;
  knownBuildings: { id: string; name: string }[];
  filteredCount: number;
  totalCount: number;
  initialLoading: boolean;
  viewMode: HabitacionesViewMode;
  isVerifying: boolean;
  floorGroups: FloorGroup[];
  selectedFloorKey: string;
  onToggleKpiStatus: (status: string) => void;
  onFilterChange: (next: HabitacionesListFilters) => void;
  onReload: () => void;
  onViewModeChange: (mode: HabitacionesViewMode) => void;
  onRecheckTarifas: () => void;
  onSelectFloorKey: (key: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

/**
 * Molécula: Cabecera operativa de la vista por pisos (KPIs, filtros y píldoras de piso).
 */
export const HabitacionesPisosHeader = memo(function HabitacionesPisosHeader({
  allRooms,
  activeStatuses,
  filters,
  knownBuildings,
  filteredCount,
  totalCount,
  initialLoading,
  viewMode,
  isVerifying,
  floorGroups,
  selectedFloorKey,
  onToggleKpiStatus,
  onFilterChange,
  onReload,
  onViewModeChange,
  onRecheckTarifas,
  onSelectFloorKey,
  onExpandAll,
  onCollapseAll,
}: HabitacionesPisosHeaderProps) {
  return (
    <div className="border-line bg-panel space-y-3 rounded-2xl border p-4 shadow-sm sm:p-5">
      <Suspense
        fallback={
          <div className="bg-line/35 h-8 w-full max-w-xl animate-pulse rounded-full" />
        }
      >
        <LazyHabitacionesKpiFilterBar
          rooms={allRooms}
          activeStatuses={activeStatuses}
          onSelectStatus={onToggleKpiStatus}
        />
      </Suspense>

      <HabitacionesFiltrosBar
        filters={filters}
        knownBuildings={knownBuildings}
        loadedCount={filteredCount}
        totalCount={totalCount}
        filteredCount={filteredCount}
        onFilterChange={onFilterChange}
        onReload={onReload}
        isReloading={initialLoading}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onRecheckTarifas={onRecheckTarifas}
        isVerifyingTarifas={isVerifying}
      />

      <FloorNavigationPills
        floorGroups={floorGroups}
        selectedFloorKey={selectedFloorKey}
        onSelectFloorKey={onSelectFloorKey}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
      />
    </div>
  );
});

export default HabitacionesPisosHeader;
