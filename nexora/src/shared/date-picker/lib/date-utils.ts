import type { DateConstraints, WeekStart } from '../types';

/**  Todas las funciones trabajan en hora local y sin  dependencias externas */
export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const startOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** Suma meses conservando el dia; si no existe (31 -> feb) usa el ultimo del mes. */
export function addMonths(d: Date, n: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = endOfMonth(target).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(d.getDate(), lastDay)
  );
}

export function isSameDay(a?: Date | null, b?: Date | null): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** -1 si a a < b, 0 si es el mismo dia, 1 si a > b (ignora la hora).  */
export function compareDays(a: Date, b: Date): number {
  return Math.sign(startOfDay(a).getTime() - startOfDay(b).getTime());
}

/**  `date` esta estrictamente entre `a` y `b`. */
export const isBetween = (date: Date, a: Date, b: Date) => {
  const d = startOfDay(date).getTime();
  return d > startOfDay(a).getTime() && d < startOfDay(b).getTime();
};

export function clampDate(date: Date, min?: Date, max?: Date): Date {
  if (min && compareDays(date, min) < 0) return startOfDay(min);
  if (max && compareDays(date, max) > 0) return startOfDay(max);
  return date;
}

export function isDayDisabled(
  date: Date,
  { minDate, maxDate, isDateDisabled }: DateConstraints
): boolean {
  if (minDate && compareDays(date, minDate) < 0) return true;
  if (maxDate && compareDays(date, maxDate) > 0) return true;
  return isDateDisabled?.(date) ?? false;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** yyyy-mm-dd en hora local (no usa toISOString, que cambia el día por zona horaria). */
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const yearNum = Number(y);
  // En JavaScript, años de 0 a 99 son convertidos por legacy a 1900-1999 (ej: '0001' -> 1901).
  // Fechas dummy del backend (como 0001-01-01) o años <= 1900 se descartan como fecha inválida.
  if (yearNum <= 1900) return null;
  const date = new Date(yearNum, Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Cuadrícula de 6 semanas (altura estable al cambiar de mes). */
export function getMonthGrid(month: Date, weekStartsOn: WeekStart): Date[][] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const gridStart = addDays(first, -offset);

  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day))
  );
}

/** Columna (0-6) que ocupa un día según el inicio de semana. */
export const weekColumn = (d: Date, weekStartsOn: WeekStart) =>
  (d.getDay() - weekStartsOn + 7) % 7;
