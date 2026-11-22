import { memo, useMemo } from 'react';
import type { RoomRow } from '../../domain/habitacion-lista';
import {
  buildFloorBadgeItems,
  type FloorStatusBadgeFilter,
} from '../../domain/piso-badge-filter';
import { PisoCountPill } from '../atoms/piso-count-pill';

export interface PisoStatusBadgesProps {
  floorKey: string;
  floorLabel: string;
  rooms: RoomRow[];
  activeFilter: FloorStatusBadgeFilter;
  onSelectBadge: (floorKey: string, badge: FloorStatusBadgeFilter) => void;
}

export const PisoStatusBadges = memo(function PisoStatusBadges({
  floorKey,
  floorLabel,
  rooms,
  activeFilter,
  onSelectBadge,
}: PisoStatusBadgesProps) {
  const badgeItems = useMemo(() => buildFloorBadgeItems(rooms), [rooms]);

  return (
    <div
      role="group"
      aria-label={`Filtrar habitaciones de ${floorLabel} por estado`}
      className="flex flex-wrap items-center gap-1.5"
    >
      {activeFilter !== 'all' && (
        <PisoCountPill
          label={`Todas (${rooms.length})`}
          tone="neutral"
          title={`Mostrar todas las habitaciones de ${floorLabel}`}
          onClick={() => onSelectBadge(floorKey, 'all')}
        />
      )}

      {badgeItems.map((item) => {
        const isActive = activeFilter === item.key;
        const isDisabled = item.count === 0 && !isActive;

        return (
          <PisoCountPill
            key={item.key}
            label={item.label}
            tone={item.tone}
            active={isActive}
            disabled={isDisabled}
            title={
              isActive
                ? `Quitar filtro de ${item.shortLabel.toLowerCase()} en ${floorLabel}`
                : `Ver habitaciones ${item.shortLabel.toLowerCase()} en ${floorLabel}`
            }
            onClick={() => onSelectBadge(floorKey, item.key)}
          />
        );
      })}
    </div>
  );
});
