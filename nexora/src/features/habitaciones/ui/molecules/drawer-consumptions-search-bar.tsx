import { Suspense, lazy, memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

const LazySharedInput = lazy(() =>
  import('../../../../shared/ui/Input').then((m) => ({ default: m.Input }))
);

export interface DrawerConsumptionsSearchBarProps {
  value: string;
  matchedCount: number;
  totalCount: number;
  onChange: (value: string) => void;
  onClear: () => void;
}

/**
 * Molécula: Buscador en tiempo real del catálogo de productos para consumos.
 * Implementa carga perezosa sobre `Input.tsx` compartido y manejo seguro con `try/catch`.
 */
export const DrawerConsumptionsSearchBar = memo(
  function DrawerConsumptionsSearchBar({
    value,
    matchedCount,
    totalCount,
    onChange,
    onClear,
  }: DrawerConsumptionsSearchBarProps) {
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
          onChange(e.target.value);
        } catch (err) {
          console.error('Error al buscar productos:', err);
        }
      },
      [onChange]
    );

    const handleClearClick = useCallback(() => {
      try {
        onClear();
      } catch (err) {
        console.error('Error al limpiar búsqueda de productos:', err);
      }
    }, [onClear]);

    const hasQuery = value.trim().length > 0;

    return (
      <div className="space-y-1.5">
        <Suspense
          fallback={
            <div className="bg-line/40 h-9 w-full animate-pulse rounded-xl" />
          }
        >
          <LazySharedInput
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder="Buscar producto o bebida en tiempo real…"
            aria-label="Buscar producto de consumo"
            inputClassName="py-1.5 text-xs"
            icon={
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="size-3"
                aria-hidden="true"
              />
            }
            action={
              hasQuery ? (
                <button
                  type="button"
                  onClick={handleClearClick}
                  aria-label="Limpiar búsqueda de productos"
                  title="Limpiar búsqueda"
                  className="text-ink-muted hover:text-ink flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="size-3" />
                </button>
              ) : undefined
            }
          />
        </Suspense>

        {hasQuery && (
          <p className="text-ink-muted px-1 text-[11px]">
            Mostrando{' '}
            <strong className="text-ink font-semibold">{matchedCount}</strong> de{' '}
            {totalCount} productos
          </p>
        )}
      </div>
    );
  }
);

export default DrawerConsumptionsSearchBar;
