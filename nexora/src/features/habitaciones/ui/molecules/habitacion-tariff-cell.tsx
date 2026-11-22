import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faTags } from '@fortawesome/free-solid-svg-icons';
import { formatCurrencyCOP } from '../lib/formatters';

export interface HabitacionTariffCellProps {
  hasTariff: boolean;
  isVerifying: boolean;
  tariffPrice: number | null;
  tariffName: string | null;
  onOpenTarifas: () => void;
}

export const HabitacionTariffCell = memo(function HabitacionTariffCell({
  hasTariff,
  isVerifying,
  tariffPrice,
  tariffName,
  onOpenTarifas,
}: HabitacionTariffCellProps) {
  if (hasTariff) {
    return (
      <button
        type="button"
        onClick={onOpenTarifas}
        className="group/rate flex cursor-pointer items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-left transition-all hover:bg-emerald-500/20 hover:shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none dark:border-emerald-400/30 dark:bg-emerald-500/20"
        title={`Tarifa verificada: ${tariffName || 'Tarifa activa'}. Haz clic para gestionar.`}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-700 shadow-2xs transition-colors group-hover/rate:bg-emerald-600 group-hover/rate:text-white dark:bg-emerald-500/30 dark:text-emerald-300">
          <FontAwesomeIcon icon={faTags} className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="max-w-[130px] truncate text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {tariffName || 'Tarifa aplicada'}
            </span>
            <FontAwesomeIcon
              icon={faCheck}
              className="size-2.5 font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <span className="block text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80">
            {tariffPrice != null ? formatCurrencyCOP(tariffPrice) : 'Verificada y activa'}
          </span>
        </div>
      </button>
    );
  }

  if (isVerifying) {
    return (
      <div
        className="border-line/40 bg-canvas/60 text-ink-muted inline-flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-xs shadow-2xs"
        title="Consultando tarifa con el servidor..."
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-600 shadow-2xs dark:text-amber-400">
          <FontAwesomeIcon icon={faTags} className="size-3.5 animate-pulse" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 animate-ping rounded-full bg-amber-500" />
            <span className="text-ink-muted block text-xs font-semibold">Verificando…</span>
          </div>
          <span className="text-ink-muted/80 block text-[10px]">Consultando</span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenTarifas}
      className="group/rate border-line/60 bg-canvas/60 hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-primary/40 flex cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left transition-all hover:shadow-2xs focus-visible:ring-2 focus-visible:outline-none"
      title="Habitación sin tarifa aplicada. Haz clic para asignar una tarifa."
    >
      <span className="bg-primary/10 text-primary group-hover/rate:bg-primary grid size-7 shrink-0 place-items-center rounded-lg shadow-2xs transition-colors group-hover/rate:text-white">
        <FontAwesomeIcon icon={faTags} className="size-3.5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="bg-ink-muted/50 size-1.5 rounded-full" />
          <span className="text-ink group-hover/rate:text-primary text-xs font-semibold transition-colors">
            Sin tarifa
          </span>
          <FontAwesomeIcon
            icon={faPlus}
            className="text-ink-muted group-hover/rate:text-primary size-2.5 transition-colors"
          />
        </div>
        <span className="text-ink-muted group-hover/rate:text-primary/80 block text-[11px]">
          Asignar tarifa
        </span>
      </div>
    </button>
  );
});
