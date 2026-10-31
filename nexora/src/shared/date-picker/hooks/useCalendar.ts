import { useCallback, useState, type KeyboardEvent } from 'react';

import {
  addDays,
  addMonths,
  clampDate,
  compareDays,
  endOfMonth,
  startOfDay,
  startOfMonth,
  weekColumn,
} from '../lib/date-utils';

import type { WeekStart } from '../types';

type Options = {
  initialDate: Date;
  minDate?: Date;
  maxDate?: Date;
  weekStartsOn: WeekStart;
  /** Pide enfocar el día activo al montar (calendario dentro de un popover). */
  autoFocus?: boolean;
};

/**
 * Navegación del calendario: mes visible, día con foco y teclado.
 * El día con foco (`focusedDate`) siempre pertenece al mes visible.
 */
export function useCalendar({
  initialDate,
  minDate,
  maxDate,
  weekStartsOn,
  autoFocus = false,
}: Options) {
  const [focusedDate, setFocusedDate] = useState(() =>
    clampDate(startOfDay(initialDate), minDate, maxDate)
  );
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(focusedDate));
  const [direction, setDirection] = useState<1 | -1>(1);
  /** Cada incremento le pide a la cuadrícula mover el foco real al día activo. */
  const [focusToken, setFocusToken] = useState(autoFocus ? 1 : 0);

  const moveTo = useCallback(
    (target: Date, focus = false) => {
      const next = clampDate(startOfDay(target), minDate, maxDate);
      const nextMonth = startOfMonth(next);
      setDirection(nextMonth.getTime() < viewMonth.getTime() ? -1 : 1);
      setViewMonth(nextMonth);
      setFocusedDate(next);
      if (focus) setFocusToken((t) => t + 1);
    },
    [minDate, maxDate, viewMonth]
  );

  const goToMonth = (delta: number) => moveTo(addMonths(focusedDate, delta));

  const setYear = useCallback(
    (year: number) => {
      const currentMonth = viewMonth.getMonth();
      const currentDay = focusedDate.getDate();
      const maxDay = new Date(year, currentMonth + 1, 0).getDate();
      const safeDay = Math.min(currentDay, maxDay);
      moveTo(new Date(year, currentMonth, safeDay), false);
    },
    [viewMonth, focusedDate, moveTo]
  );

  const setMonth = useCallback(
    (month: number) => {
      const currentYear = viewMonth.getFullYear();
      const currentDay = focusedDate.getDate();
      const maxDay = new Date(currentYear, month + 1, 0).getDate();
      const safeDay = Math.min(currentDay, maxDay);
      moveTo(new Date(currentYear, month, safeDay), false);
    },
    [viewMonth, focusedDate, moveTo]
  );

  const canGoPrev =
    !minDate || compareDays(endOfMonth(addMonths(viewMonth, -1)), minDate) >= 0;
  const canGoNext =
    !maxDate ||
    compareDays(startOfMonth(addMonths(viewMonth, 1)), maxDate) <= 0;

  const onGridKeyDown = (e: KeyboardEvent) => {
    const col = weekColumn(focusedDate, weekStartsOn);
    const targets: Record<string, Date> = {
      ArrowLeft: addDays(focusedDate, -1),
      ArrowRight: addDays(focusedDate, 1),
      ArrowUp: addDays(focusedDate, -7),
      ArrowDown: addDays(focusedDate, 7),
      Home: addDays(focusedDate, -col),
      End: addDays(focusedDate, 6 - col),
      PageUp: addMonths(focusedDate, e.shiftKey ? -12 : -1),
      PageDown: addMonths(focusedDate, e.shiftKey ? 12 : 1),
    };
    const target = targets[e.key];
    if (!target) return;
    e.preventDefault();
    moveTo(target, true);
  };

  return {
    viewMonth,
    focusedDate,
    direction,
    focusToken,
    canGoPrev,
    canGoNext,
    moveTo,
    goToMonth,
    setYear,
    setMonth,
    onGridKeyDown,
  };
}
