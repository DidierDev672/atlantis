import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { DayCell } from '../atoms/DayCell';
import { isSameDay, toISODate } from '../lib/date-utils';
import { formatMonthYear, type WeekdayLabel } from '../lib/format';
import type { CalendarLabels, DayState } from '../types';

type CalendarGridProps = {
  weeks: Date[][];
  weekdays: WeekdayLabel[];
  viewMonth: Date;
  focusedDate: Date;
  focusToken: number;
  direction: 1 | -1;
  locale: string;
  labels: CalendarLabels;
  getDayState: (date: Date) => DayState;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date | null) => void;
  onKeyDown: (e: KeyboardEvent) => void;
};

/** Molécula: encabezado de días + 6 semanas, con navegación por teclado. */
export function CalendarGrid({
  weeks,
  weekdays,
  viewMonth,
  focusedDate,
  focusToken,
  direction,
  locale,
  labels,
  getDayState,
  onDayClick,
  onDayHover,
  onKeyDown,
}: CalendarGridProps) {
  const reduced = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const handledToken = useRef(0);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Mueve el foco real solo cuando el teclado (o el autoFocus) lo pide,
  // para no robarle el foco a los botones de mes al hacer clic en ellos.
  useEffect(() => {
    if (focusToken === handledToken.current) return;
    handledToken.current = focusToken;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-date="${toISODate(focusedDate)}"]`
      )
      ?.focus({ preventScroll: true });
  }, [focusToken, focusedDate]);

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label={formatMonthYear(viewMonth, locale)}
      onKeyDown={onKeyDown}
      onMouseLeave={() => onDayHover(null)}
    >
      <div role="row" className="mb-1 grid grid-cols-7">
        {weekdays.map((day) => (
          <span
            key={day.long}
            role="columnheader"
            aria-label={day.long}
            className="text-ink-muted flex h-8 items-center justify-center text-[11px] font-semibold uppercase"
          >
            {day.short}
          </span>
        ))}
      </div>

      <motion.div
        key={toISODate(viewMonth)}
        initial={
          !hasMounted || reduced
            ? false
            : { opacity: 0, x: direction * 16 }
        }
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {weeks.map((week) => (
          <div role="row" key={toISODate(week[0])} className="grid grid-cols-7">
            {week.map((date, column) => (
              <DayCell
                key={toISODate(date)}
                date={date}
                column={column}
                locale={locale}
                todayLabel={labels.today.toLocaleLowerCase(locale)}
                state={getDayState(date)}
                tabbable={isSameDay(date, focusedDate)}
                onSelect={onDayClick}
                onHover={onDayHover}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
