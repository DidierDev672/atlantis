import { memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { formatCurrencyCOP } from '../lib/formatters';

export interface DrawerFolioBalanceCardProps {
  nightlyRate: number;
  nights: number;
  lodgingTotal: number;
  consumptionsTotal: number;
  paidAmount: number;
  onCargarConsumo: () => void;
}

/**
 * Molécula: Desglose de saldo por cobrar (Precio, Hospedaje, Consumo, Pagado) con acción Cargar consumo.
 */
export const DrawerFolioBalanceCard = memo(function DrawerFolioBalanceCard({
  nightlyRate,
  nights,
  lodgingTotal,
  consumptionsTotal,
  paidAmount,
  onCargarConsumo,
}: DrawerFolioBalanceCardProps) {
  const balanceDue = Math.max(0, lodgingTotal + consumptionsTotal - paidAmount);

  const handleCargarConsumo = useCallback(() => {
    try {
      onCargarConsumo();
    } catch (err) {
      console.error('Error al cambiar a pestaña de consumos:', err);
    }
  }, [onCargarConsumo]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-ink-muted flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
          <FontAwesomeIcon icon={faReceipt} className="size-3.5" />
          <span>Saldo por cobrar</span>
        </h4>

        <button
          type="button"
          onClick={handleCargarConsumo}
          className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors"
        >
          <FontAwesomeIcon icon={faBagShopping} className="size-3" />
          <span>Cargar consumo</span>
        </button>
      </div>

      <div className="border-line bg-panel divide-line/60 divide-y rounded-2xl border text-xs">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-ink-muted">Precio por noche</span>
          <span className="text-ink font-semibold">
            {formatCurrencyCOP(nightlyRate)}
          </span>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-ink-muted">
            Hospedaje ({nights} {nights === 1 ? 'noche' : 'noches'})
          </span>
          <span className="text-ink font-semibold">
            {formatCurrencyCOP(lodgingTotal)}
          </span>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-ink-muted">Consumo</span>
          <span className="text-ink font-semibold">
            {formatCurrencyCOP(consumptionsTotal)}
          </span>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-ink-muted">Pagado</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            - {formatCurrencyCOP(paidAmount)}
          </span>
        </div>

        <div className="bg-canvas/75 flex items-center justify-between px-3.5 py-3 text-sm font-extrabold">
          <span className="text-ink">Saldo por cobrar</span>
          <span className="text-primary">{formatCurrencyCOP(balanceDue)}</span>
        </div>
      </div>
    </div>
  );
});

export default DrawerFolioBalanceCard;
