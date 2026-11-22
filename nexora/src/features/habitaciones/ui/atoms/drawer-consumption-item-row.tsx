import { memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { formatCurrencyCOP } from '../lib/formatters';

export interface DrawerConsumptionItemRowProps {
  id: string;
  name: string;
  amount: number;
  priceUnit: number;
  isUpdating: boolean;
  onUpdateQty: (consumptionId: string, delta: 1 | -1) => Promise<void> | void;
}

/**
 * Átomo: Fila de consumo agregado con controles accesibles (- / +) para
 * ajustar cantidad en tiempo real desde la vista operativa de recepción.
 */
export const DrawerConsumptionItemRow = memo(
  function DrawerConsumptionItemRow({
    id,
    name,
    amount,
    priceUnit,
    isUpdating,
    onUpdateQty,
  }: DrawerConsumptionItemRowProps) {
    const handleStep = useCallback(
      async (delta: 1 | -1) => {
        try {
          await onUpdateQty(id, delta);
        } catch (err) {
          console.error('Error al actualizar cantidad de consumo:', err);
        }
      },
      [id, onUpdateQty]
    );

    const isLastUnit = amount <= 1;

    return (
      <li className="border-line bg-panel flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs shadow-2xs">
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate font-semibold" title={name}>
            {name}
          </p>
          <p className="text-ink-muted text-[11px]">
            {formatCurrencyCOP(priceUnit)} c/u · Subtotal{' '}
            <span className="text-ink font-semibold">
              {formatCurrencyCOP(priceUnit * amount)}
            </span>
          </p>
        </div>

        <div className="bg-canvas border-line flex shrink-0 items-center gap-1 rounded-lg border p-0.5">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleStep(-1)}
            aria-label={
              isLastUnit ? `Quitar ${name}` : `Disminuir cantidad de ${name}`
            }
            title={isLastUnit ? 'Quitar producto' : 'Disminuir cantidad'}
            className="text-ink-muted hover:bg-panel hover:text-rose-600 flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FontAwesomeIcon
              icon={isLastUnit ? faTrashCan : faMinus}
              className="size-2.5"
              aria-hidden="true"
            />
          </button>

          <span
            aria-label={`Cantidad: ${amount}`}
            className="text-ink min-w-[1.5rem] text-center text-xs font-bold tabular-nums"
          >
            {amount}
          </span>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleStep(1)}
            aria-label={`Aumentar cantidad de ${name}`}
            title="Aumentar cantidad"
            className="text-ink-muted hover:bg-panel hover:text-primary flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FontAwesomeIcon
              icon={faPlus}
              className="size-2.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </li>
    );
  }
);

export default DrawerConsumptionItemRow;
