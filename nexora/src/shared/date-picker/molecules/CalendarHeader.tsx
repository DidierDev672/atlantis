import { motion, useReducedMotion } from 'framer-motion';

import { CalendarNavButton } from '../atoms/CalendarNavButton';
import { toISODate } from '../lib/date-utils';
import { formatMonthYear } from '../lib/format';
import type { CalendarLabels } from '../types';

type CalendarHeaderProps = {
  viewMonth: Date;
  locale: string;
  direction: 1 | -1;
  canGoPrev: boolean;
  canGoNext: boolean;
  labels: CalendarLabels;
  onPrev: () => void;
  onNext: () => void;
};

/** Molécula: navegación + nombre del mes con transición direccional. */
export function CalendarHeader({
  viewMonth,
  locale,
  direction,
  canGoPrev,
  canGoNext,
  labels,
  onPrev,
  onNext,
}: CalendarHeaderProps) {
  const reduced = useReducedMotion();

  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <CalendarNavButton
        direction="prev"
        label={labels.prevMonth}
        disabled={!canGoPrev}
        onClick={onPrev}
      />

      <div
        aria-live="polite"
        className="relative h-6 flex-1 overflow-hidden text-center"
      >
        <motion.span
          key={toISODate(viewMonth)}
          initial={reduced ? false : { opacity: 0, y: direction * 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="text-ink absolute inset-0 text-sm font-semibold"
        >
          {formatMonthYear(viewMonth, locale)}
        </motion.span>
      </div>

      <CalendarNavButton
        direction="next"
        label={labels.nextMonth}
        disabled={!canGoNext}
        onClick={onNext}
      />
    </div>
  );
}
