import { memo } from 'react';
import {
  getFloorBadgeLabel,
  type FloorStatusBadgeFilter,
} from '../../domain/piso-badge-filter';

export interface PisoBadgeEmptyStateProps {
  floorLabel: string;
  activeBadgeFilter: FloorStatusBadgeFilter;
  searchQuery?: string;
  onClearFilter: () => void;
}

export const PisoBadgeEmptyState = memo(function PisoBadgeEmptyState({
  floorLabel,
  activeBadgeFilter,
  searchQuery = '',
  onClearFilter,
}: PisoBadgeEmptyStateProps) {
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-6 text-center">
      <p className="text-ink-muted text-xs">
        {hasSearch ? (
          <>
            No hay habitaciones que coincidan con{' '}
            <strong className="text-ink font-semibold">
              &ldquo;{searchQuery.trim()}&rdquo;
            </strong>{' '}
            en {floorLabel}.
          </>
        ) : (
          <>
            No hay habitaciones con estado{' '}
            <strong className="text-ink font-semibold">
              {getFloorBadgeLabel(activeBadgeFilter).toLowerCase()}
            </strong>{' '}
            en {floorLabel}.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onClearFilter}
        className="border-line bg-canvas text-ink hover:border-primary/40 hover:text-primary cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition"
      >
        {hasSearch
          ? 'Limpiar búsqueda en este piso'
          : 'Ver todas las habitaciones del piso'}
      </button>
    </div>
  );
});
