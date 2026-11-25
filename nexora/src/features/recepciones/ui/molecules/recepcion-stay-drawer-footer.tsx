import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

export interface RecepcionStayDrawerFooterProps {
  printing?: boolean;
  onPrintReceipt: () => void;
  onViewRoomHistory: () => void;
}

/**
 * Molécula: Pie del drawer con acciones primarias apiladas
 * (Imprimir comprobante y Ver historial de la habitación).
 */
export const RecepcionStayDrawerFooter = memo(
  function RecepcionStayDrawerFooter({
    printing = false,
    onPrintReceipt,
    onViewRoomHistory,
  }: RecepcionStayDrawerFooterProps) {
    return (
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          disabled={printing}
          onClick={() => {
            try {
              onPrintReceipt();
            } catch (err) {
              console.error('Error al imprimir comprobante:', err);
            }
          }}
          className="border-line bg-panel text-ink hover:bg-canvas hover:border-ink-soft/40 focus-visible:ring-primary/40 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
        >
          <FontAwesomeIcon
            icon={faPrint}
            className="size-3.5"
            aria-hidden="true"
          />
          <span>{printing ? 'Preparando comprobante…' : 'Imprimir comprobante'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            try {
              onViewRoomHistory();
            } catch (err) {
              console.error('Error al ver historial de habitación:', err);
            }
          }}
          className="border-line bg-panel text-ink hover:bg-canvas hover:border-ink-soft/40 focus-visible:ring-primary/40 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-xs font-medium shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Ver historial de la habitación
        </button>
      </div>
    );
  }
);

export default RecepcionStayDrawerFooter;
