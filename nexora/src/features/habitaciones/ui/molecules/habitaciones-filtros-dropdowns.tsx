import { Suspense, lazy, memo, useCallback, useMemo } from 'react';
import { Loading } from '../../../../shared/loading';
import type { DropdownOption } from '../../../recursos/ui/molecules/recursos-dropdown';
import type { HabitacionesListFilters } from '../../domain/habitacion-lista';

const LazyRecursosDropdown = lazy(() =>
  import('../../../recursos/ui/molecules/recursos-dropdown').then((m) => ({
    default: m.RecursosDropdown,
  }))
);

const STATUS_OPTIONS: ReadonlyArray<DropdownOption> = [
  { value: 'available', label: 'Disponible' },
  { value: 'occupied', label: 'Ocupada' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'inactive', label: 'Inactiva' },
];

export interface HabitacionesFiltrosDropdownsProps {
  filters: HabitacionesListFilters;
  knownBuildings: { id: string; name: string }[];
  roomTypeOptions: ReadonlyArray<DropdownOption>;
  roomTypesLoading: boolean;
  roomTypesError: string | null;
  onFilterChange: (next: HabitacionesListFilters) => void;
}

/**
 * Molécula: Filtros configurables con RecursosDropdown
 * (Estados múltiple, Edificios y Tipo de habitaciones múltiple).
 */
export const HabitacionesFiltrosDropdowns = memo(
  function HabitacionesFiltrosDropdowns({
    filters,
    knownBuildings,
    roomTypeOptions,
    roomTypesLoading,
    roomTypesError,
    onFilterChange,
  }: HabitacionesFiltrosDropdownsProps) {
    const buildingOptions = useMemo<ReadonlyArray<DropdownOption>>(
      () => [
        { value: 'all', label: 'Todos los edificios' },
        ...knownBuildings.map((b) => ({ value: b.id, label: b.name })),
      ],
      [knownBuildings]
    );

    const selectedStatuses = useMemo(
      () =>
        filters.statuses && filters.statuses.length > 0
          ? filters.statuses
          : filters.status !== 'all'
            ? [filters.status]
            : [],
      [filters.statuses, filters.status]
    );

    const handleStatusesChange = useCallback(
      (values: string[]) => {
        try {
          onFilterChange({
            ...filters,
            statuses: values,
            status: values.length === 1 ? values[0] : 'all',
          });
        } catch (err) {
          console.error('Error al cambiar filtro de estados:', err);
        }
      },
      [filters, onFilterChange]
    );

    const handleBuildingChange = useCallback(
      (value: string) => {
        try {
          onFilterChange({ ...filters, buildingId: value || 'all' });
        } catch (err) {
          console.error('Error al cambiar filtro de edificio:', err);
        }
      },
      [filters, onFilterChange]
    );

    const handleRoomTypesChange = useCallback(
      (values: string[]) => {
        try {
          onFilterChange({ ...filters, roomTypeIds: values });
        } catch (err) {
          console.error('Error al cambiar filtro de tipos de habitación:', err);
        }
      },
      [filters, onFilterChange]
    );

    return (
      <div className="flex flex-wrap items-center gap-2.5">
        <Suspense
          fallback={
            <div className="bg-line/40 h-[42px] w-full animate-pulse rounded-xl sm:w-56" />
          }
        >
          <LazyRecursosDropdown
            id="habitaciones-filtro-estado"
            label="Filtrar por estados"
            multiple
            options={STATUS_OPTIONS}
            selectedValues={selectedStatuses}
            onMultiChange={handleStatusesChange}
            placeholder="Todos los estados"
            searchable={false}
            direction="auto"
            className="w-full space-y-0 sm:w-56 [&>label]:hidden"
          />
        </Suspense>

        <Suspense
          fallback={
            <div className="bg-line/40 h-[42px] w-full animate-pulse rounded-xl sm:w-48" />
          }
        >
          <LazyRecursosDropdown
            id="habitaciones-filtro-edificio"
            label="Filtrar por edificio"
            options={buildingOptions}
            value={filters.buildingId}
            onChange={handleBuildingChange}
            placeholder="Todos los edificios"
            searchable={knownBuildings.length > 5}
            searchPlaceholder="Buscar edificio…"
            emptyLabel="Sin edificios disponibles"
            direction="auto"
            className="w-full space-y-0 sm:w-48 [&>label]:hidden"
          />
        </Suspense>

        <div className="relative w-full sm:w-64">
          {roomTypesLoading ? (
            <div className="border-line bg-panel flex min-h-[42px] w-full items-center rounded-xl border px-3.5 shadow-xs">
              <Loading
                variant="inline"
                size="sm"
                label="Cargando tipos de habitación…"
                delay={0}
              />
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="bg-line/40 h-[42px] w-full animate-pulse rounded-xl" />
              }
            >
              <LazyRecursosDropdown
                id="habitaciones-filtro-tipos"
                label="Tipo de habitaciones"
                multiple
                options={roomTypeOptions}
                selectedValues={filters.roomTypeIds ?? []}
                onMultiChange={handleRoomTypesChange}
                isLoading={roomTypesLoading}
                error={roomTypesError ?? undefined}
                placeholder="Tipo de habitaciones"
                searchPlaceholder="Buscar por tipo o capacidad…"
                emptyLabel="Sin tipos de habitación disponibles"
                direction="auto"
                className="w-full space-y-0 [&>label]:hidden"
              />
            </Suspense>
          )}
        </div>
      </div>
    );
  }
);

export default HabitacionesFiltrosDropdowns;
