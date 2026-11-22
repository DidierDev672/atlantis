import { Suspense, lazy, memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBagShopping,
  faPaperPlane,
  faRotateRight,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { formatCurrencyCOP } from '../lib/formatters';
import type { RegisteredConsumptionItem } from './drawer-tab-consumptions';

const LazyDrawerConsumptionItemRow = lazy(
  () => import('../atoms/drawer-consumption-item-row')
);

export interface DrawerPendingOrderCardProps {
  pendingConsumptions: RegisteredConsumptionItem[];
  pendingUnits: number;
  pendingTotal: number;
  isOccupied: boolean;
  actionLoading: boolean;
  updatingConsumptionId: string | null;
  onUpdateQty: (consumptionId: string, delta: 1 | -1) => Promise<void> | void;
  onClear?: () => Promise<void> | void;
  onConfirm?: () => Promise<void> | void;
}

/**
 * Molécula: Bandeja de pedido agrupado por confirmar antes de enviar un único POST /service-request.
 */
export const DrawerPendingOrderCard = memo(function DrawerPendingOrderCard({
  pendingConsumptions,
  pendingUnits,
  pendingTotal,
  isOccupied,
  actionLoading,
  updatingConsumptionId,
  onUpdateQty,
  onClear,
  onConfirm,
}: DrawerPendingOrderCardProps) {
  const handleClear = useCallback(async () => {
    if (!onClear) return;
    try {
      await onClear();
    } catch (err) {
      console.error('Error al vaciar pedido pendiente:', err);
    }
  }, [onClear]);

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) return;
    try {
      await onConfirm();
    } catch (err) {
      console.error('Error al confirmar pedido:', err);
    }
  }, [onConfirm]);

  if (pendingConsumptions.length === 0) return null;

  return (
    <section className="border-primary/25 bg-primary/5 space-y-2.5 rounded-2xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
          <FontAwesomeIcon icon={faBagShopping} className="size-3.5" />
          <span>Pedido por Confirmar</span>
          <span className="bg-primary rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
            {pendingUnits}
          </span>
        </h4>

        {onClear && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handleClear()}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-400"
          >
            <FontAwesomeIcon icon={faTrashCan} className="size-3" />
            <span>Vaciar</span>
          </button>
        )}
      </div>

      <Suspense
        fallback={
          <div className="bg-line/30 h-14 w-full animate-pulse rounded-xl" />
        }
      >
        <ul className="space-y-2">
          {pendingConsumptions.map((c) => (
            <LazyDrawerConsumptionItemRow
              key={c.id}
              id={c.id}
              name={c.name}
              amount={c.amount}
              priceUnit={c.priceUnit}
              isUpdating={updatingConsumptionId === c.id || actionLoading}
              onUpdateQty={onUpdateQty}
            />
          ))}
        </ul>
      </Suspense>

      {onConfirm && (
        <button
          type="button"
          disabled={!isOccupied || actionLoading}
          onClick={() => void handleConfirm()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FontAwesomeIcon
            icon={actionLoading ? faRotateRight : faPaperPlane}
            className={`size-3.5 ${actionLoading ? 'animate-spin' : ''}`}
          />
          <span>
            {actionLoading
              ? 'Enviando pedido…'
              : `Confirmar y cargar pedido (${formatCurrencyCOP(pendingTotal)})`}
          </span>
        </button>
      )}
    </section>
  );
});

export default DrawerPendingOrderCard;
