import { memo, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faCalendarDays,
  faCalendarMinus,
} from '@fortawesome/free-solid-svg-icons';
import {
  formatStayDateTimeEs,
  getCheckoutReferenceBadge,
  type CheckoutBadgeTone,
} from '../../domain/stay-dates-reference';

export interface DrawerStayDatesCardProps {
  checkInDate?: string | null;
  checkOutDate?: string | null;
}

const BADGE_TONE_CLASSES: Record<CheckoutBadgeTone, string> = {
  danger:
    'border-rose-500/35 bg-rose-500/12 text-rose-700 dark:text-rose-300',
  warning:
    'border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-300',
  info: 'border-sky-500/35 bg-sky-500/12 text-sky-700 dark:text-sky-300',
  neutral: 'border-line bg-canvas text-ink-muted',
};

/**
 * Molécula: Fechas de entrada/salida con badge de referencia de salida.
 */
export const DrawerStayDatesCard = memo(function DrawerStayDatesCard({
  checkInDate,
  checkOutDate,
}: DrawerStayDatesCardProps) {
  const checkInLabel = useMemo(
    () => formatStayDateTimeEs(checkInDate),
    [checkInDate]
  );
  const checkOutLabel = useMemo(
    () => formatStayDateTimeEs(checkOutDate),
    [checkOutDate]
  );
  const badge = useMemo(
    () => getCheckoutReferenceBadge(checkOutDate),
    [checkOutDate]
  );

  return (
    <div className="border-line bg-panel space-y-2.5 rounded-2xl border p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-muted inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
          <FontAwesomeIcon icon={faCalendarDays} className="size-3.5" />
          <span>Estancia</span>
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_TONE_CLASSES[badge.tone]}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="border-line/70 bg-canvas/55 rounded-xl border px-3 py-2">
          <div className="text-ink-muted flex items-center gap-1.5 text-[11px]">
            <FontAwesomeIcon
              icon={faCalendarCheck}
              className="size-3 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>Entrada</span>
          </div>
          <div className="text-ink mt-0.5 text-xs font-bold">{checkInLabel}</div>
        </div>

        <div className="border-line/70 bg-canvas/55 rounded-xl border px-3 py-2">
          <div className="text-ink-muted flex items-center gap-1.5 text-[11px]">
            <FontAwesomeIcon
              icon={faCalendarMinus}
              className="size-3 text-rose-600 dark:text-rose-400"
              aria-hidden="true"
            />
            <span>Salida</span>
          </div>
          <div className="text-ink mt-0.5 text-xs font-bold">{checkOutLabel}</div>
        </div>
      </div>
    </div>
  );
});

export default DrawerStayDatesCard;
