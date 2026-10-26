import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '../../lib'; // Ajusta a la ruta de tu helper `cn`

import { formatFullDate } from '../lib/format';
import { toISODate } from '../lib/date-utils';
import type { DayState, RangeBand } from '../types';

type DayCellProps = {
  date: Date;
  /** Columna 0-6 dentro de la semana (para redondear los extremos de la banda). */
  column: number;
  locale: string;
  todayLabel: string;
  state: DayState;
  /** Solo un día de la cuadrícula es alcanzable con Tab (roving tabindex). */
  tabbable: boolean;
  onSelect: (date: Date) => void;
  onHover: (date: Date) => void;
};

const BAND_POSITION: Record<Exclude<RangeBand, 'none'>, string> = {
  start: 'left-1/2 right-0',
  middle: 'inset-x-0',
  end: 'left-0 right-1/2',
};

/**
 * Átomo: un día del calendario.
 * Usa `aria-disabled` (no `disabled`) para que siga siendo alcanzable con teclado.
 */

export function DayCell({
  date,
  column,
  locale,
  todayLabel,
  state,
  tabbable,
  onSelect,
  onHover,
}: DayCellProps) {
  const reduced = useReducedMotion();
  const { disabled, today, outside, selected, previewEnd, band, preview } =
    state;

  const label = formatFullDate(date, locale) + (today ? `, ${todayLabel}` : '');

  return (
    <div
      role="gridcell"
      aria-selected={selected}
      className="relative flex h-10 items-center justify-center"
    >
      {band !== 'none' && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-1',
            preview ? 'bg-primary/[0.07]' : 'bg-primary/10',
            BAND_POSITION[band],
            band === 'middle' && column === 0 && 'rounded-l-full',
            band === 'middle' && column === 6 && 'rounded-r-full'
          )}
        />
      )}

      <motion.button
        type="button"
        data-date={toISODate(date)}
        tabIndex={tabbable ? 0 : -1}
        aria-label={label}
        aria-disabled={disabled || undefined}
        aria-current={today ? 'date' : undefined}
        onClick={() => {
          if (!disabled) onSelect(date);
        }}
        onMouseEnter={() => onHover(date)}
        whileTap={disabled || reduced ? undefined : { scale: 0.9 }}
        className={cn(
          'relative flex size-10 items-center justify-center rounded-full text-sm tabular-nums transition-colors outline-none',
          'focus-visible:ring-primary/50 focus-visible:ring-2',
          selected
            ? 'font-semibold text-white'
            : 'text-ink hover:bg-primary/10',
          outside && !selected && 'text-ink-muted/60',
          today &&
            !selected &&
            'text-primary ring-primary/40 font-semibold ring-1',
          previewEnd && 'ring-primary ring-1',
          disabled &&
            'text-ink-muted/40 cursor-not-allowed line-through hover:bg-transparent'
        )}
      >
        {selected && (
          <motion.span
            aria-hidden="true"
            className="bg-primary absolute inset-0 rounded-full shadow-sm"
            initial={reduced ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative">{date.getDate()}</span>
      </motion.button>
    </div>
  );
}
