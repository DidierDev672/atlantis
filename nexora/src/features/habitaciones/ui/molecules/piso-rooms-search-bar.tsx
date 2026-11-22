import { Suspense, lazy, memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

const LazySharedInput = lazy(() =>
  import('../../../../shared/ui/Input').then((m) => ({ default: m.Input }))
);

export interface PisoRoomsSearchBarProps {
  floorKey: string;
  floorLabel: string;
  value: string;
  matchedCount: number;
  totalCount: number;
  onChange: (value: string) => void;
  onClear: () => void;
}

/**
 * Molécula: Buscador en tiempo real por piso usando el componente reutilizable `Input`.
 */
export const PisoRoomsSearchBar = memo(function PisoRoomsSearchBar({
  floorKey,
  floorLabel,
  value,
  matchedCount,
  totalCount,
  onChange,
  onClear,
}: PisoRoomsSearchBarProps) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        onChange(e.target.value);
      } catch (err) {
        console.error('Error al buscar habitaciones en el piso:', err);
      }
    },
    [onChange]
  );

  const handleClearClick = useCallback(() => {
    try {
      onClear();
    } catch (err) {
      console.error('Error al limpiar búsqueda del piso:', err);
    }
  }, [onClear]);

  const hasQuery = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full flex-1">
        <Suspense
          fallback={
            <div className="bg-line/40 h-10 w-full animate-pulse rounded-xl" />
          }
        >
          <LazySharedInput
            id={`piso-search-${floorKey}`}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={`Buscar en ${floorLabel} por número o tipo de cama…`}
            aria-label={`Buscar habitaciones en ${floorLabel}`}
            inputClassName="py-2 text-xs"
            icon={
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="size-3.5"
                aria-hidden="true"
              />
            }
            action={
              hasQuery ? (
                <button
                  type="button"
                  onClick={handleClearClick}
                  aria-label={`Limpiar búsqueda en ${floorLabel}`}
                  title="Limpiar búsqueda"
                  className="text-ink-muted hover:text-ink focus-visible:ring-primary/40 flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="size-3.5"
                    aria-hidden="true"
                  />
                </button>
              ) : undefined
            }
          />
        </Suspense>
      </div>

      {hasQuery && (
        <span className="text-ink-muted shrink-0 text-[11px] font-medium whitespace-nowrap">
          <strong className="text-ink font-semibold">{matchedCount}</strong> de{' '}
          {totalCount} en {floorLabel}
        </span>
      )}
    </div>
  );
});

export default PisoRoomsSearchBar;
