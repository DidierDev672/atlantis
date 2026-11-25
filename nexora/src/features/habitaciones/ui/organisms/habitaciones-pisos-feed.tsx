import { memo } from 'react';
import type { FloorGroup, RoomRow } from '../../domain/habitacion-lista';
import type { FloorStatusBadgeFilter } from '../../domain/piso-badge-filter';
import { FloorAccordionSkeleton } from '../atoms/floor-accordion-skeleton';
import { HabitacionesEmptyState } from '../molecules/habitaciones-empty-state';
import { HabitacionesErrorState } from '../molecules/habitaciones-error-state';
import type { HabitacionesViewMode } from '../molecules/habitaciones-view-mode-toggle';
import { PisoAccordionItem } from './piso-accordion-item';

export interface HabitacionesPisosFeedProps {
  error: string | null;
  initialLoading: boolean;
  visibleFloorGroups: FloorGroup[];
  hasActiveFilters: boolean;
  expandedFloors: Set<string>;
  enrichingFloors: Record<string, boolean>;
  floorErrors: Record<string, string | null>;
  floorBadgeFilters: Record<string, FloorStatusBadgeFilter>;
  viewMode: HabitacionesViewMode;
  hasTariff: (roomId: string) => boolean;
  getRateId: (roomId: string) => string | null;
  getTariffPrice: (roomId: string) => number | null;
  getTariffName: (roomId: string) => string | null;
  isVerifying: boolean;
  onReload: () => Promise<void> | void;
  onNewHabitacion?: () => void;
  onToggleFloor: (floorKey: string) => void;
  onSelectBadge: (floorKey: string, badge: FloorStatusBadgeFilter) => void;
  onRetryFloor: (floorKey: string) => void;
  onRetryBuilding: (id: string) => void;
  onRetryBed: (id: string) => void;
  onOpenBuilding: (
    id: string,
    summary: RoomRow['building'],
    room: RoomRow
  ) => void;
  onOpenTarifas: (
    row: RoomRow,
    roomHasTariff: boolean,
    rateId: string | null
  ) => void;
  onOpenRoomDetail: (row: RoomRow) => void;
  onSelectHabitacion: (row: RoomRow) => void;
  onOpenAssignGuestDrawer: (row: RoomRow) => void;
  onQuickMarkAvailable: (row: RoomRow) => Promise<void> | void;
}

/**
 * Organismo: Cuerpo del mapa de habitaciones por piso (estados de error, carga, vacío y acordeones).
 */
export const HabitacionesPisosFeed = memo(function HabitacionesPisosFeed({
  error,
  initialLoading,
  visibleFloorGroups,
  hasActiveFilters,
  expandedFloors,
  enrichingFloors,
  floorErrors,
  floorBadgeFilters,
  viewMode,
  hasTariff,
  getRateId,
  getTariffPrice,
  getTariffName,
  isVerifying,
  onReload,
  onNewHabitacion,
  onToggleFloor,
  onSelectBadge,
  onRetryFloor,
  onRetryBuilding,
  onRetryBed,
  onOpenBuilding,
  onOpenTarifas,
  onOpenRoomDetail,
  onSelectHabitacion,
  onOpenAssignGuestDrawer,
  onQuickMarkAvailable,
}: HabitacionesPisosFeedProps) {
  if (error) {
    return (
      <div className="border-line bg-panel rounded-2xl border p-4 shadow-sm sm:p-6">
        <HabitacionesErrorState
          message={error}
          actionLabel="Reintentar carga de habitaciones"
          onRetry={onReload}
        />
      </div>
    );
  }

  if (initialLoading) {
    return <FloorAccordionSkeleton count={3} />;
  }

  if (visibleFloorGroups.length === 0) {
    return (
      <div className="border-line bg-panel rounded-2xl border p-4 shadow-sm sm:p-6">
        <HabitacionesEmptyState
          hasActiveFilters={hasActiveFilters}
          onNewHabitacion={onNewHabitacion}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleFloorGroups.map((group) => (
        <PisoAccordionItem
          key={group.floorKey}
          group={group}
          isOpen={expandedFloors.has(group.floorKey)}
          isEnriching={Boolean(enrichingFloors[group.floorKey])}
          floorError={floorErrors[group.floorKey] ?? null}
          activeBadgeFilter={floorBadgeFilters[group.floorKey] ?? 'all'}
          viewMode={viewMode}
          hasTariff={hasTariff}
          getRateId={getRateId}
          getTariffPrice={getTariffPrice}
          getTariffName={getTariffName}
          isVerifying={isVerifying}
          onToggle={onToggleFloor}
          onSelectBadge={onSelectBadge}
          onRetryFloor={onRetryFloor}
          onRetryBuilding={onRetryBuilding}
          onRetryBed={onRetryBed}
          onOpenBuilding={onOpenBuilding}
          onOpenTarifas={onOpenTarifas}
          onOpenRoomDetail={onOpenRoomDetail}
          onSelectHabitacion={onSelectHabitacion}
          onOpenAssignGuestDrawer={onOpenAssignGuestDrawer}
          onQuickMarkAvailable={onQuickMarkAvailable}
        />
      ))}
    </div>
  );
});

export default HabitacionesPisosFeed;
