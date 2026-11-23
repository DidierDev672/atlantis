import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { FloorGroup, RoomRow } from '../../domain/habitacion-lista';
import {
  filterFloorRoomsByBadge,
  filterFloorRoomsBySearch,
  getFloorBadgeLabel,
  type FloorStatusBadgeFilter,
} from '../../domain/piso-badge-filter';
import { HabitacionesErrorState } from '../molecules/habitaciones-error-state';
import { HabitacionCardsSkeleton } from '../molecules/habitacion-cards-skeleton';
import type { HabitacionesViewMode } from '../molecules/habitaciones-view-mode-toggle';
import { PisoAccordionHeader } from '../molecules/piso-accordion-header';
import { PisoBadgeEmptyState } from '../molecules/piso-badge-empty-state';
import { PisoRoomsSearchBar } from '../molecules/piso-rooms-search-bar';

const LazyHabitacionFloorCards = lazy(() => import('./habitacion-floor-cards'));
const LazyHabitacionFloorCompactGrid = lazy(
  () => import('./habitacion-floor-compact-grid')
);

export interface PisoAccordionItemProps {
  group: FloorGroup;
  isOpen: boolean;
  isEnriching: boolean;
  floorError: string | null;
  activeBadgeFilter: FloorStatusBadgeFilter;
  viewMode: HabitacionesViewMode;
  hasTariff: (roomId: string) => boolean;
  getRateId: (roomId: string) => string | null;
  getTariffPrice: (roomId: string) => number | null;
  getTariffName: (roomId: string) => string | null;
  isVerifying: boolean;
  onToggle: (floorKey: string) => void;
  onSelectBadge: (floorKey: string, badge: FloorStatusBadgeFilter) => void;
  onRetryFloor: (floorKey: string) => void;
  onRetryBuilding: (id: string) => void;
  onRetryBed: (id: string) => void;
  onOpenBuilding: (id: string, summary: RoomRow['building'], room: RoomRow) => void;
  onOpenTarifas: (row: RoomRow, hasTariff: boolean, rateId: string | null) => void;
  onOpenRoomDetail: (row: RoomRow) => void;
  onSelectHabitacion?: (row: RoomRow) => void;
  onOpenAssignGuestDrawer?: (row: RoomRow) => void;
  onQuickMarkAvailable?: (row: RoomRow) => Promise<void> | void;
}

export const PisoAccordionItem = memo(function PisoAccordionItem({
  group,
  isOpen,
  isEnriching,
  floorError,
  activeBadgeFilter,
  viewMode,
  hasTariff,
  getRateId,
  getTariffPrice,
  getTariffName,
  isVerifying,
  onToggle,
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
}: PisoAccordionItemProps) {
  const panelId = `piso-accordion-panel-${group.floorKey}`;
  const [floorSearchQuery, setFloorSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(floorSearchQuery);

  const badgeFilteredRooms = useMemo(() => {
    try {
      return filterFloorRoomsByBadge(group.rooms, activeBadgeFilter);
    } catch {
      return group.rooms;
    }
  }, [group.rooms, activeBadgeFilter]);

  const visibleRooms = useMemo(() => {
    try {
      return filterFloorRoomsBySearch(badgeFilteredRooms, deferredSearchQuery);
    } catch {
      return badgeFilteredRooms;
    }
  }, [badgeFilteredRooms, deferredSearchQuery]);

  const handleClearFloorFilters = useCallback(() => {
    try {
      if (floorSearchQuery.trim()) {
        setFloorSearchQuery('');
        return;
      }
      onSelectBadge(group.floorKey, 'all');
    } catch (err) {
      console.error('Error al limpiar filtros del piso:', err);
    }
  }, [floorSearchQuery, group.floorKey, onSelectBadge]);

  return (
    <article className="border-line bg-panel overflow-hidden rounded-2xl border shadow-sm">
      <PisoAccordionHeader
        floorKey={group.floorKey}
        floorLabel={group.floorLabel}
        totalCount={group.totalCount}
        rooms={group.rooms}
        activeBadgeFilter={activeBadgeFilter}
        isOpen={isOpen}
        isEnriching={isEnriching}
        hasError={Boolean(floorError)}
        panelId={panelId}
        onToggle={onToggle}
        onSelectBadge={onSelectBadge}
      />

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            key={`panel-${group.floorKey}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-line space-y-3 border-t px-4 py-4 sm:px-6 sm:py-5">
              {!floorError && group.rooms.length > 0 && (
                <PisoRoomsSearchBar
                  floorKey={group.floorKey}
                  floorLabel={group.floorLabel}
                  value={floorSearchQuery}
                  matchedCount={visibleRooms.length}
                  totalCount={badgeFilteredRooms.length}
                  onChange={setFloorSearchQuery}
                  onClear={() => setFloorSearchQuery('')}
                />
              )}

              {activeBadgeFilter !== 'all' && (
                <div className="bg-canvas/70 border-line flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs">
                  <span className="text-ink-muted">
                    Mostrando{' '}
                    <strong className="text-ink font-semibold">
                      {visibleRooms.length}
                    </strong>{' '}
                    de {group.totalCount} habitaciones ·{' '}
                    <strong className="text-primary font-semibold">
                      {getFloorBadgeLabel(activeBadgeFilter)}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectBadge(group.floorKey, 'all')}
                    className="text-primary cursor-pointer font-semibold hover:underline"
                  >
                    Ver todas
                  </button>
                </div>
              )}

              {floorError ? (
                <HabitacionesErrorState
                  compact
                  message={floorError}
                  actionLabel={`Reintentar ${group.floorLabel}`}
                  onRetry={() => onRetryFloor(group.floorKey)}
                />
              ) : visibleRooms.length === 0 ? (
                <PisoBadgeEmptyState
                  floorLabel={group.floorLabel}
                  activeBadgeFilter={activeBadgeFilter}
                  searchQuery={floorSearchQuery}
                  onClearFilter={handleClearFloorFilters}
                />
              ) : (
                <Suspense
                  fallback={
                    <HabitacionCardsSkeleton
                      count={Math.min(visibleRooms.length, 4)}
                      className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5"
                    />
                  }
                >
                  {viewMode === 'compact' ? (
                    <LazyHabitacionFloorCompactGrid
                      rooms={visibleRooms}
                      hasTariff={hasTariff}
                      onSelectRoom={onOpenRoomDetail}
                    />
                  ) : (
                    <LazyHabitacionFloorCards
                      rooms={visibleRooms}
                      hasTariff={hasTariff}
                      getRateId={getRateId}
                      getTariffPrice={getTariffPrice}
                      getTariffName={getTariffName}
                      isVerifying={isVerifying}
                      onRetryBuilding={onRetryBuilding}
                      onRetryBed={onRetryBed}
                      onOpenBuilding={onOpenBuilding}
                      onOpenTarifas={onOpenTarifas}
                      onOpenRoomDetail={onOpenRoomDetail}
                      onSelectHabitacion={onSelectHabitacion}
                      onOpenAssignGuestDrawer={onOpenAssignGuestDrawer}
                      onQuickMarkAvailable={onQuickMarkAvailable}
                    />
                  )}
                </Suspense>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
});
