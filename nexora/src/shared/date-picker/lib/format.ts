import type { DateRange, WeekStart } from '../types';

const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = locale + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    cache.set(key, f);
  }
  return f;
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/** "Octubre de 2026" */
export const formatMonthYear = (d: Date, locale: string) =>
  capitalize(formatter(locale, { month: 'long', year: 'numeric' }).format(d));

/** "domingo, 25 de octubre de 2026" (para lectores de pantalla) */
export const formatFullDate = (d: Date, locale: string) =>
  formatter(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);

/** "25 oct 2026" (valor compacto visible en el campo; quita puntos y "de") */
export const formatDisplay = (d: Date, locale: string) =>
  formatter(locale, { day: '2-digit', month: 'short', year: 'numeric' })
    .format(d)
    .replace(/\./g, '')
    .replace(/\s+de\s+/g, ' ');

export function formatRangeDisplay(range: DateRange, locale: string): string {
  if (!range.start) return '';
  const start = formatDisplay(range.start, locale);
  return range.end
    ? `${start} – ${formatDisplay(range.end, locale)}`
    : `${start} – …`;
}

export type WeekdayLabel = { short: string; long: string };

/** Encabezados de columnas, ya rotados según el inicio de semana. */
export function getWeekdayLabels(
  locale: string,
  weekStartsOn: WeekStart
): WeekdayLabel[] {
  // 1 ene 2023 fue domingo → índice de día = día del mes - 1
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2023, 0, 1 + ((weekStartsOn + i) % 7));
    return {
      short: formatter(locale, { weekday: 'short' })
        .format(date)
        .replace(/\./g, ''),
      long: formatter(locale, { weekday: 'long' }).format(date),
    };
  });
}

export type MonthOption = { value: number; label: string };

/** Meses del año (0 a 11) con su nombre localizado y capitalizado. */
export function getMonthLabels(locale: string): MonthOption[] {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const date = new Date(2023, monthIndex, 1);
    const monthName = formatter(locale, { month: 'long' }).format(date);
    return {
      value: monthIndex,
      label: capitalize(monthName),
    };
  });
}
