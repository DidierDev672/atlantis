import { Suspense, lazy, memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

const LazySharedInput = lazy(() =>
  import('../../../../shared/ui/Input').then((m) => ({ default: m.Input }))
);

export interface DrawerGuestsSearchBarProps {
  value: string;
  matchedCount: number;
  totalCount: number;
  onChange: (value: string) => void;
  onClear: () => void;
}

/**
 * Molécula: Buscador en tiempo real de huéspedes vinculados usando `Input` compartida.
 */
export const DrawerGuestsSearchBar = memo(function DrawerGuestsSearchBar({
  value,
  matchedCount,
  totalCount,
  onChange,
  onClear,
}: DrawerGuestsSearchBarProps) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        onChange(e.target.value);
      } catch (err) {
        console.error('Error al buscar huéspedes:', err);
      }
    },
    [onChange]
  );

  const handleClearClick = useCallback(() => {
    try {
      onClear();
    } catch (err) {
      console.error('Error al limpiar búsqueda de huéspedes:', err);
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
          placeholder="Buscar huésped por nombre, documento o teléfono…"
          aria-label="Buscar huésped vinculado"
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
                aria-label="Limpiar búsqueda de huéspedes"
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
          {totalCount} huéspedes
        </p>
      )}
    </div>
  );
});

export default DrawerGuestsSearchBar;
