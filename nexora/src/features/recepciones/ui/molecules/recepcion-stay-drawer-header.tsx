import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { RecepcionEstadoBadge } from '../atoms/recepcion-estado-badge';

export interface RecepcionStayDrawerHeaderProps {
  roomNumber: string;
  status: string;
  onClose: () => void;
}

/**
 * Molécula: Cabecera minimalista del drawer con número de habitación,
 * badge de estado, subtítulo claro y botón de cierre.
 */
export const RecepcionStayDrawerHeader = memo(
  function RecepcionStayDrawerHeader({
    roomNumber,
    status,
    onClose,
  }: RecepcionStayDrawerHeaderProps) {
    return (
      <header className="border-line/70 -mt-1 flex items-start justify-between gap-3 border-b pb-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-ink text-lg font-extrabold tracking-tight">
              {roomNumber ? `Habitación ${roomNumber}` : 'Habitación'}
            </h2>
            <RecepcionEstadoBadge status={status} size="sm" />
          </div>
          <p className="text-ink-muted text-xs">Detalle de recepción</p>
        </div>

        <button
          type="button"
          onClick={() => {
            try {
              onClose();
            } catch (err) {
              console.error('Error al cerrar drawer:', err);
            }
          }}
          aria-label="Cerrar detalle de recepción"
          title="Cerrar (Esc)"
          className="border-line bg-panel text-ink-muted hover:bg-canvas hover:text-ink focus-visible:ring-primary/40 grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="size-4"
            aria-hidden="true"
          />
        </button>
      </header>
    );
  }
);

export default RecepcionStayDrawerHeader;
