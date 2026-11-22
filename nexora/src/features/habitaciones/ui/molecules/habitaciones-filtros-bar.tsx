import { Suspense, lazy, memo, useCallback } from 'react';
import {
  faArrowsRotate,
  faFilterCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useRoomTypesCatalog } from '../../application/use-room-types-catalog';
import type { HabitacionesListFilters } from '../../domain/habitacion-lista';
import { IconActionButton } from '../atoms/icon-action-button';
import type { HabitacionesViewMode } from './habitaciones-view-mode-toggle';

const LazyFiltrosDropdowns = lazy(
  () => import('./habitaciones-filtros-dropdowns')
);

const LazyViewModeToggle = lazy(
  () => import('./habitaciones-view-mode-toggle')
);

interface HabitacionesFiltrosBarProps {
  filters: HabitacionesListFilters;
  knownBuildings: { id: string; name: string }[];
  loadedCount: number;
  totalCount: number;
  filteredCount: number;
  onFilterChange: (next: HabitacionesListFilters) => void;
  onReload: () => void | Promise<void>;
  isReloading?: boolean;
  viewMode?: HabitacionesViewMode;
  onViewModeChange?: (mode: HabitacionesViewMode) => void;
  onRecheckTarifas?: () => void;
  isVerifyingTarifas?: boolean;
}

export const HabitacionesFiltrosBar = memo(function HabitacionesFiltrosBar({
  filters,
  knownBuildings,
  loadedCount,
  totalCount,
  filteredCount,
  onFilterChange,
  onReload,
  isReloading,
  viewMode,
  onViewModeChange,
}: HabitacionesFiltrosBarProps) {
  const {
    options: roomTypeOptions,
    loading: roomTypesLoading,
    error: roomTypesError,
    reload: reloadRoomTypes,
  } = useRoomTypesCatalog();

  const isFiltering =
    Boolean(filters.search.trim()) ||
    filters.status !== 'all' ||
    (filters.statuses?.length ?? 0) > 0 ||
    filters.buildingId !== 'all' ||
    (filters.roomTypeIds?.length ?? 0) > 0;

  const handleSearchChange = useCallback(
    (value: string) => {
      try {
        onFilterChange({ ...filters, search: value });
      } catch (err) {
        console.error('Error al actualizar búsqueda:', err);
      }
    },
    [filters, onFilterChange]
  );

  const handleResetFilters = useCallback(() => {
    try {
      onFilterChange({
        search: '',
        status: 'all',
        statuses: [],
        buildingId: 'all',
        roomTypeIds: [],
      });
    } catch (err) {
      console.error('Error al limpiar filtros:', err);
    }
  }, [onFilterChange]);

  const handleReloadClick = useCallback(async () => {
    try {
      await Promise.all([onReload(), reloadRoomTypes()]);
    } catch (err) {
      console.error('Error al refrescar catálogo de habitaciones:', err);
    }
  }, [onReload, reloadRoomTypes]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3">
        {/* 1. Filtros (Estados, Edificios, Tipo de habitaciones) + Acciones arriba */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <Suspense
            fallback={
              <div className="bg-line/40 h-[42px] w-full animate-pulse rounded-xl sm:w-[460px]" />
            }
          >
            <LazyFiltrosDropdowns
              filters={filters}
              knownBuildings={knownBuildings}
              roomTypeOptions={roomTypeOptions}
              roomTypesLoading={roomTypesLoading}
              roomTypesError={roomTypesError}
              onFilterChange={onFilterChange}
            />
          </Suspense>

          <div className="ml-auto flex items-center gap-2">
            {isFiltering && (
              <IconActionButton
                icon={faFilterCircleXmark}
                tone="danger"
                label="Limpiar filtros"
                onClick={handleResetFilters}
              />
            )}

            <IconActionButton
              icon={faArrowsRotate}
              label="Refrescar catálogo de habitaciones"
              spin={Boolean(isReloading || roomTypesLoading)}
              disabled={Boolean(isReloading)}
              onClick={() => void handleReloadClick()}
            />

            {viewMode && onViewModeChange && (
              <div className="border-line border-l pl-2">
                <Suspense
                  fallback={
                    <div className="bg-line/40 h-[42px] w-[112px] animate-pulse rounded-xl" />
                  }
                >
                  <LazyViewModeToggle
                    viewMode={viewMode}
                    onChange={onViewModeChange}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        {/* 2. Cuadro de búsqueda debajo de los filtros (ancho completo) */}
        <div className="relative w-full">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por número, piso o nombre…"
            className="border-line bg-panel text-ink placeholder:text-ink-muted focus:border-primary focus:ring-primary/20 min-h-[42px] w-full rounded-xl border py-2.5 pr-9 pl-10 text-xs font-medium shadow-2xs transition outline-none focus:ring-2"
            aria-label="Buscar habitaciones"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          {filters.search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="text-ink-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-3.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Indicador de estado de filtrado y conteo */}
      <div className="text-ink-muted flex flex-wrap items-center justify-between px-1 text-xs">
        <div>
          {isFiltering ? (
            <span>
              Mostrando{' '}
              <strong className="text-ink font-semibold">
                {filteredCount}
              </strong>{' '}
              de{' '}
              <strong className="text-ink font-semibold">{totalCount}</strong>{' '}
              habitaciones registradas
            </span>
          ) : (
            <span>
              Mostrando{' '}
              <strong className="text-ink font-semibold">{loadedCount}</strong>{' '}
              de{' '}
              <strong className="text-ink font-semibold">{totalCount}</strong>{' '}
              habitaciones en total
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
