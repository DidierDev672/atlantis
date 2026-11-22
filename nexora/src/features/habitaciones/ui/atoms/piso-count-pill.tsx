import { memo } from 'react';
import type { FloorBadgeTone } from '../../domain/piso-badge-filter';

export type PisoPillTone = FloorBadgeTone;

export interface PisoCountPillProps {
  label: string;
  tone?: PisoPillTone;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}

const TONE_CLASSES: Record<PisoPillTone, string> = {
  neutral: 'border-line bg-canvas/70 text-ink-muted',
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300',
  warning:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-300',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-400/30 dark:text-sky-300',
  danger:
    'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-300',
};

const ACTIVE_TONE_CLASSES: Record<PisoPillTone, string> = {
  neutral: 'border-primary/40 bg-primary text-white shadow-xs ring-2 ring-primary/25',
  success:
    'border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30',
  warning:
    'border-amber-600 bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30',
  info: 'border-sky-600 bg-sky-600 text-white shadow-xs ring-2 ring-sky-500/30',
  danger:
    'border-rose-600 bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30',
};

export const PisoCountPill = memo(function PisoCountPill({
  label,
  tone = 'neutral',
  active = false,
  disabled = false,
  title,
  onClick,
}: PisoCountPillProps) {
  const toneClass = active ? ACTIVE_TONE_CLASSES[tone] : TONE_CLASSES[tone];
  const baseClass = `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition ${toneClass}`;

  if (onClick) {
    return (
      <button
        type="button"
        aria-pressed={active}
        disabled={disabled}
        title={title}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`${baseClass} ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none active:scale-[0.98]'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <span title={title} className={baseClass}>
      {label}
    </span>
  );
});
