import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import type { RoomRow } from '../../domain/habitacion-lista';
import type { FloorStatusBadgeFilter } from '../../domain/piso-badge-filter';
import { PisoAccordionChevron } from '../atoms/piso-accordion-chevron';
import { PisoCountPill } from '../atoms/piso-count-pill';
import { PisoStatusBadges } from './piso-status-badges';

export interface PisoAccordionHeaderProps {
  floorKey: string;
  floorLabel: string;
  totalCount: number;
  rooms: RoomRow[];
  activeBadgeFilter: FloorStatusBadgeFilter;
  isOpen: boolean;
  isEnriching?: boolean;
  hasError?: boolean;
  panelId: string;
  onToggle: (floorKey: string) => void;
  onSelectBadge: (floorKey: string, badge: FloorStatusBadgeFilter) => void;
}

export const PisoAccordionHeader = memo(function PisoAccordionHeader({
  floorKey,
  floorLabel,
  totalCount,
  rooms,
  activeBadgeFilter,
  isOpen,
  isEnriching = false,
  hasError = false,
  panelId,
  onToggle,
  onSelectBadge,
}: PisoAccordionHeaderProps) {
  return (
    <div className="hover:bg-canvas/40 flex flex-col gap-3 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(floorKey)}
        className="focus-visible:ring-primary/40 flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 rounded-xl text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${
            isOpen
              ? 'bg-primary text-white shadow-xs'
              : 'bg-primary/10 text-primary'
          }`}
          aria-hidden="true"
        >
          <FontAwesomeIcon icon={faLayerGroup} className="size-4" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ink truncate text-sm font-bold sm:text-base">
              {floorLabel}
            </h2>
            {isEnriching && (
              <span className="text-primary inline-flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="border-primary/25 border-t-primary inline-block size-3 animate-spin rounded-full border-2" />
                <span>Cargando detalles…</span>
              </span>
            )}
            {hasError && (
              <PisoCountPill label="Error al cargar" tone="warning" />
            )}
          </div>
          <p className="text-ink-muted mt-0.5 text-xs">
            {totalCount === 1
              ? '1 habitación en este piso'
              : `${totalCount} habitaciones en este piso`}
          </p>
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:justify-end">
        <PisoStatusBadges
          floorKey={floorKey}
          floorLabel={floorLabel}
          rooms={rooms}
          activeFilter={activeBadgeFilter}
          onSelectBadge={onSelectBadge}
        />

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={isOpen ? `Contraer ${floorLabel}` : `Expandir ${floorLabel}`}
          onClick={() => onToggle(floorKey)}
          className="focus-visible:ring-primary/40 cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          <PisoAccordionChevron isOpen={isOpen} />
        </button>
      </div>
    </div>
  );
});
