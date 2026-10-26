import type { DateRange } from '../types';
import { addDays, compareDays } from '../lib/date-utils';

export const EMPTY_RANGE: DateRange = { start: null, end: null };

/** Hay algun dia bloqueado estrictamente entre `start` y `end`? */
export function hasDisabledBetween(
  start: Date,
  end: Date,
  isDisabled: (d: Date) => boolean
): boolean {
  for (let d = addDays(start, 1); compareDays(d, end) < 0; d = addDays(d, 1)) {
    if (isDisabled(d)) return true;
  }
  return false;
}

type NextRangeOptions = {
  allowSameDay: boolean;
  isDisabled: (d: Date) => boolean;
};

/**
 * Regla de selección de rangos:
 * 1er clic → inicio · 2do clic → fin · 3er clic → nuevo inicio.
 * Reinicia el inicio si el clic es anterior, repite día (cuando no se permite)
 * o el rango atravesaría días bloqueados.
 */

export function nextRange(
  current: DateRange,
  day: Date,
  { allowSameDay, isDisabled }: NextRangeOptions
): DateRange {
  const { start, end } = current;

  if (!start || end) return { start: day, end: null };

  const diff = compareDays(day, start);
  if (diff < 0 || (diff === 0 && !allowSameDay)) {
    return { start: day, end: null };
  }
  if (hasDisabledBetween(start, day, isDisabled)) {
    return { start: day, end: null };
  }
  return { start, end: day };
}
