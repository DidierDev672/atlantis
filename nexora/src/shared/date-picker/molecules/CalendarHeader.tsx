import { useMemo } from 'react';

import { CalendarNavButton } from '../atoms/CalendarNavButton';
import { getMonthLabels } from '../lib/format';
import type { CalendarLabels } from '../types';

type CalendarHeaderProps = {
  viewMonth: Date;
  locale: string;
  direction: 1 | -1;
  canGoPrev: boolean;
  canGoNext: boolean;
  labels: CalendarLabels;
  minYear?: number;
  maxYear?: number;
  onPrev: () => void;
  onNext: () => void;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
};

/** Molécula: navegación + selectores interactivos de Mes y Año con acceso rápido. */
export function CalendarHeader({
  viewMonth,
  locale,
  canGoPrev,
  canGoNext,
  labels,
  minYear,
  maxYear,
  onPrev,
  onNext,
  onYearChange,
  onMonthChange,
}: CalendarHeaderProps) {
  const currentYear = viewMonth.getFullYear();
  const currentMonth = viewMonth.getMonth();

  const startYear = minYear ?? currentYear - 100;
  const endYear = maxYear ?? currentYear + 10;

  const years = useMemo(() => {
    const list: number[] = [];
    const min = Math.min(startYear, endYear, currentYear);
    const max = Math.max(startYear, endYear, currentYear);
    for (let y = min; y <= max; y++) {
      list.push(y);
    }
    return list;
  }, [startYear, endYear, currentYear]);

  const months = useMemo(() => getMonthLabels(locale), [locale]);

  return (
    <div className="mb-2.5 flex items-center justify-between gap-1.5 px-0.5">
      <CalendarNavButton
        direction="prev"
        label={labels.prevMonth}
        disabled={!canGoPrev}
        onClick={onPrev}
      />

      <div className="flex flex-1 items-center justify-center gap-1.5">
        {/* Selector de Mes */}
        <div className="relative">
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange?.(Number(e.target.value))}
            aria-label="Seleccionar mes"
            className="appearance-none rounded-lg border border-line/60 bg-canvas/70 py-1 pl-2.5 pr-5 text-xs font-semibold text-ink hover:border-primary/50 hover:bg-panel focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer outline-none"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value} className="bg-panel text-ink text-xs">
                {m.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-ink-muted/80"
          >
            ▼
          </span>
        </div>

        {/* Selector de Año */}
        <div className="relative">
          <select
            value={currentYear}
            onChange={(e) => onYearChange?.(Number(e.target.value))}
            aria-label="Seleccionar año"
            className="appearance-none rounded-lg border border-line/60 bg-canvas/70 py-1 pl-2.5 pr-5 text-xs font-semibold text-ink hover:border-primary/50 hover:bg-panel focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer outline-none font-mono"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-panel text-ink text-xs">
                {y}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-ink-muted/80"
          >
            ▼
          </span>
        </div>
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
