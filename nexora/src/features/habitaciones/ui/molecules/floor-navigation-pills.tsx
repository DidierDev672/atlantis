import { memo, useCallback } from 'react';
import { faAnglesDown, faAnglesUp } from '@fortawesome/free-solid-svg-icons';
import {
  matchesHabitacionStatus,
  type FloorGroup,
} from '../../domain/habitacion-lista';
import { FloorMiniProgressBar } from '../atoms/floor-mini-progress-bar';
import { IconActionButton } from '../atoms/icon-action-button';

export interface FloorNavigationPillsProps {
  floorGroups: FloorGroup[];
  selectedFloorKey: string;
  onSelectFloorKey: (floorKey: string) => void;
  onExpandAll: () => void | Promise<void>;
  onCollapseAll: () => void | Promise<void>;
}

/**
 * Molécula: Barra horizontal de píldoras de piso con acciones icon-only de expandir y contraer.
 */
export const FloorNavigationPills = memo(function FloorNavigationPills({
  floorGroups,
  selectedFloorKey,
  onSelectFloorKey,
  onExpandAll,
  onCollapseAll,
}: FloorNavigationPillsProps) {
  const handleSelectFloor = useCallback(
    (key: string) => {
      try {
        onSelectFloorKey(key);
      } catch (err) {
        console.error('Error al seleccionar piso:', err);
      }
    },
    [onSelectFloorKey]
  );

  const handleExpandAll = useCallback(async () => {
    try {
      await onExpandAll();
    } catch (err) {
      console.error('Error al expandir todos los pisos:', err);
    }
  }, [onExpandAll]);

  const handleCollapseAll = useCallback(async () => {
    try {
      await onCollapseAll();
    } catch (err) {
      console.error('Error al contraer todos los pisos:', err);
    }
  }, [onCollapseAll]);

  if (floorGroups.length === 0) return null;

  return (
    <div className="border-line/70 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
      <div
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
        role="tablist"
        aria-label="Navegación rápida por pisos"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedFloorKey === 'all'}
          onClick={() => handleSelectFloor('all')}
          className={`shrink-0 cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
            selectedFloorKey === 'all'
              ? 'border-primary bg-primary text-white shadow-xs'
              : 'border-line bg-panel text-ink-muted hover:text-ink hover:bg-canvas/60'
          }`}
        >
          Todos los pisos ({floorGroups.length})
        </button>

        {floorGroups.map((group) => {
          const isSelected = selectedFloorKey === group.floorKey;
          const cleaningCount = group.rooms.filter((r) =>
            matchesHabitacionStatus(r.status, 'cleaning')
          ).length;

          return (
            <button
              key={group.floorKey}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleSelectFloor(group.floorKey)}
              className={`flex min-w-[104px] shrink-0 cursor-pointer flex-col gap-1 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary ring-primary/30 font-bold ring-1'
                  : 'border-line bg-panel text-ink hover:border-primary/40 font-medium'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span>{group.floorLabel}</span>
                <span className="bg-canvas text-ink-muted rounded px-1.5 text-[10px] font-semibold">
                  {group.availableCount} lib
                </span>
              </div>
              <FloorMiniProgressBar
                occupiedCount={group.occupiedCount}
                availableCount={group.availableCount}
                cleaningCount={cleaningCount}
                totalCount={group.totalCount}
              />
            </button>
          );
        })}
      </div>

      <div
        className="border-line flex shrink-0 items-center gap-1.5 border-l pl-2.5"
        role="group"
        aria-label="Control de acordeones de pisos"
      >
        <IconActionButton
          icon={faAnglesDown}
          label="Expandir todos los pisos"
          size="sm"
          onClick={() => void handleExpandAll()}
        />
        <IconActionButton
          icon={faAnglesUp}
          label="Contraer todos los pisos"
          size="sm"
          onClick={() => void handleCollapseAll()}
        />
      </div>
    </div>
  );
});

export default FloorNavigationPills;
