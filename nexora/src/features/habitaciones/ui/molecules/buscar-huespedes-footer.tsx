import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

export interface BuscarHuespedesFooterProps {
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  selectedCount: number;
  maxAllowed: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Molécula: Paginación y barra de acciones inferior del buscador de huéspedes.
 */
export const BuscarHuespedesFooter = memo(function BuscarHuespedesFooter({
  page,
  hasMore,
  isLoading,
  selectedCount,
  maxAllowed,
  onPrevPage,
  onNextPage,
  onClose,
  onConfirm,
}: BuscarHuespedesFooterProps) {
  return (
    <>
      {(page > 1 || hasMore) && !isLoading && (
        <div className="border-line/60 flex items-center justify-between border-t px-5 py-3 text-xs sm:px-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={onPrevPage}
            className="border-line bg-canvas text-ink hover:bg-panel inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
            <span>Anterior</span>
          </button>
          <span className="text-ink-muted font-mono">Página {page}</span>
          <button
            type="button"
            disabled={!hasMore}
            onClick={onNextPage}
            className="border-line bg-canvas text-ink hover:bg-panel inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span>Siguiente</span>
            <FontAwesomeIcon icon={faChevronRight} className="size-3" />
          </button>
        </div>
      )}

      <div className="border-line/60 bg-canvas/40 flex shrink-0 flex-col items-center justify-between gap-3 border-t px-5 py-4 sm:flex-row sm:px-6">
        <div className="text-ink-muted text-center text-xs sm:text-left">
          <span>
            Seleccionados:{' '}
            <strong className="text-ink font-bold">
              {selectedCount} de {maxAllowed}
            </strong>{' '}
            huésped(es)
          </span>
        </div>

        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="border-line bg-canvas/80 text-ink-muted hover:bg-panel hover:text-ink inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors sm:flex-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="border-primary/50 bg-primary text-primary-foreground inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold shadow-md transition-all hover:brightness-110 sm:flex-none"
          >
            <FontAwesomeIcon icon={faCheck} className="size-3" />
            <span>Confirmar Selección ({selectedCount})</span>
          </button>
        </div>
      </div>
    </>
  );
});

export default BuscarHuespedesFooter;
