import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesDown, faAnglesUp } from '@fortawesome/free-solid-svg-icons';
import { useRecepcionesFloorGroups } from '../../application/use-recepciones-floor-groups';
import type { RoomFloorStatusFilter } from '../../domain/recepcion-floor';
import type { StayItem } from '../../domain/stay';

const LazyRecepcionFloorAccordion = lazy(
  () => import('../molecules/recepcion-floor-accordion')
);

export interface RecepcionesFloorAccordionsFeedProps {
  stays: StayItem[];
  onSelectStay: (stay: StayItem) => void;
  onOpenRoom: (roomId: string) => void;
  onSelectGuest: (personId: string) => void;
}

/**
 * Organismo: Agrupa y renderiza las accordiones de pisos con las habitaciones (RecepcionCard)
 * y mantiene el estado de expansión y filtros interactivos por piso.
 */
export const RecepcionesFloorAccordionsFeed = memo(
  function RecepcionesFloorAccordionsFeed({
    stays,
    onSelectStay,
    onOpenRoom,
    onSelectGuest,
  }: RecepcionesFloorAccordionsFeedProps) {
    const [toggledFloors, setToggledFloors] = useState<
      Record<string, boolean>
    >({});
    const { floorGroups } = useRecepcionesFloorGroups(stays, toggledFloors);
    const [badgeFilters, setBadgeFilters] = useState<
      Record<string, RoomFloorStatusFilter>
    >({});

    const firstFloorKey = floorGroups[0]?.floorKey ?? '';

    const isFloorOpen = useCallback(
      (floorKey: string) => {
        if (floorKey in toggledFloors) {
          return Boolean(toggledFloors[floorKey]);
        }
        return floorKey === firstFloorKey;
      },
      [firstFloorKey, toggledFloors]
    );

    const handleToggleFloor = useCallback(
      (floorKey: string) => {
        try {
          setToggledFloors((prev) => {
            const current =
              floorKey in prev ? Boolean(prev[floorKey]) : floorKey === firstFloorKey;
            return { ...prev, [floorKey]: !current };
          });
        } catch (err) {
          console.error('Error al alternar piso:', err);
        }
      },
      [firstFloorKey]
    );

    const handleSelectBadge = useCallback(
      (floorKey: string, badge: RoomFloorStatusFilter) => {
        try {
          setBadgeFilters((prev) => ({ ...prev, [floorKey]: badge }));
          if (badge !== 'all') {
            setToggledFloors((prev) => ({ ...prev, [floorKey]: true }));
          }
        } catch (err) {
          console.error('Error al filtrar piso por badge:', err);
        }
      },
      []
    );

    const handleExpandAll = useCallback(() => {
      try {
        const next: Record<string, boolean> = {};
        for (const group of floorGroups) next[group.floorKey] = true;
        setToggledFloors(next);
      } catch (err) {
        console.error('Error al expandir todos los pisos:', err);
      }
    }, [floorGroups]);

    const handleCollapseAll = useCallback(() => {
      try {
        const next: Record<string, boolean> = {};
        for (const group of floorGroups) next[group.floorKey] = false;
        setToggledFloors(next);
      } catch (err) {
        console.error('Error al contraer todos los pisos:', err);
      }
    }, [floorGroups]);

    const openCount = useMemo(
      () => floorGroups.filter((g) => isFloorOpen(g.floorKey)).length,
      [floorGroups, isFloorOpen]
    );

    return (
      <div className="space-y-4">
        {floorGroups.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <span className="text-ink-muted font-medium">
              {floorGroups.length} pisos · {openCount}{' '}
              {openCount === 1 ? 'abierto' : 'abiertos'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExpandAll}
                aria-label="Expandir todos los pisos"
                title="Expandir todos"
                className="border-line bg-panel text-primary hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-primary/40 grid size-8 cursor-pointer place-items-center rounded-xl border shadow-2xs transition focus-visible:ring-2 focus-visible:outline-none"
              >
                <FontAwesomeIcon
                  icon={faAnglesDown}
                  className="size-3.5"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                aria-label="Contraer todos los pisos"
                title="Contraer todos"
                className="border-line bg-panel text-ink-muted hover:border-primary/40 hover:text-ink focus-visible:ring-primary/40 grid size-8 cursor-pointer place-items-center rounded-xl border shadow-2xs transition focus-visible:ring-2 focus-visible:outline-none"
              >
                <FontAwesomeIcon
                  icon={faAnglesUp}
                  className="size-3.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {floorGroups.map((group) => (
            <Suspense
              key={group.floorKey}
              fallback={
                <div className="border-line bg-panel h-20 w-full animate-pulse rounded-2xl border" />
              }
            >
              <LazyRecepcionFloorAccordion
                group={group}
                isOpen={isFloorOpen(group.floorKey)}
                activeBadgeFilter={badgeFilters[group.floorKey] ?? 'all'}
                onToggle={handleToggleFloor}
                onSelectBadge={handleSelectBadge}
                onSelectStay={onSelectStay}
                onOpenRoom={onOpenRoom}
                onSelectGuest={onSelectGuest}
              />
            </Suspense>
          ))}
        </div>
      </div>
    );
  }
);

export default RecepcionesFloorAccordionsFeed;
