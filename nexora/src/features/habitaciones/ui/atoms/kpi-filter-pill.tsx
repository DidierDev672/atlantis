import { memo } from 'react';

export type KpiPillTone = 'neutral' | 'emerald' | 'rose' | 'sky' | 'amber';

export interface KpiFilterPillProps {
  label: string;
  count: number;
  suffix?: string;
  tone?: KpiPillTone;
  active: boolean;
  onClick: () => void;
}

const DOT_CLASSES: Record<KpiPillTone, string> = {
  neutral: 'bg-ink-muted',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  amber: 'bg-amber-500',
};

const ACTIVE_CLASSES: Record<KpiPillTone, string> = {
  neutral: 'border-primary/40 bg-primary text-white',
  emerald:
    'border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  rose: 'border-rose-500/40 bg-rose-500/12 text-rose-700 dark:text-rose-300',
  sky: 'border-sky-500/40 bg-sky-500/12 text-sky-700 dark:text-sky-300',
  amber:
    'border-amber-500/40 bg-amber-500/12 text-amber-700 dark:text-amber-300',
};

/**
 * Átomo: Píldora minimalista para indicador y filtro rápido de estado en cabecera.
 */
export const KpiFilterPill = memo(function KpiFilterPill({
  label,
  count,
  suffix,
  tone = 'neutral',
  active,
  onClick,
}: KpiFilterPillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`focus-visible:ring-primary/40 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs transition-all focus-visible:ring-2 focus-visible:outline-none ${
        active
          ? `${ACTIVE_CLASSES[tone]} font-semibold`
          : 'border-line/80 bg-canvas/50 text-ink-muted hover:border-line hover:bg-canvas hover:text-ink font-medium'
      }`}
    >
      {tone !== 'neutral' && (
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${DOT_CLASSES[tone]}`}
        />
      )}
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums ${
          active && tone === 'neutral'
            ? 'bg-white/20 text-white'
            : 'bg-panel text-ink border-line/70 border'
        }`}
      >
        {count}
        {suffix ? ` · ${suffix}` : ''}
      </span>
    </button>
  );
});
