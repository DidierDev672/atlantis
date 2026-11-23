import { memo, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faClock } from '@fortawesome/free-solid-svg-icons';

export interface RecepcionTemporalBadgeProps {
  checkIn?: string | null;
  checkOut?: string | null;
  className?: string;
}

type TemporalState = 'sale-hoy' | 'sale-manana' | 'llego-hoy' | null;

function resolveTemporalState(
  checkIn?: string | null,
  checkOut?: string | null
): TemporalState {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const toDayMidnight = (iso?: string | null): Date | null => {
      if (!iso) return null;
      const parsed = new Date(iso);
      if (Number.isNaN(parsed.getTime())) return null;
      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    };

    const outDay = toDayMidnight(checkOut);
    if (outDay) {
      if (outDay.getTime() === today.getTime()) return 'sale-hoy';
      if (outDay.getTime() === tomorrow.getTime()) return 'sale-manana';
    }

    const inDay = toDayMidnight(checkIn);
    if (inDay && inDay.getTime() === today.getTime()) {
      return 'llego-hoy';
    }

    return null;
  } catch (err) {
    console.error('Error al calcular estado temporal de recepción:', err);
    return null;
  }
}

const TEMPORAL_STYLE_MAP: Record<
  Exclude<TemporalState, null>,
  {
    label: string;
    classes: string;
    icon: typeof faClock;
  }
> = {
  'sale-hoy': {
    label: 'Sale hoy',
    classes:
      'border-amber-500/35 bg-amber-500/15 text-amber-800 dark:border-amber-400/30 dark:text-amber-300',
    icon: faClock,
  },
  'sale-manana': {
    label: 'Sale mañana',
    classes:
      'border-sky-500/35 bg-sky-500/15 text-sky-800 dark:border-sky-400/30 dark:text-sky-300',
    icon: faClock,
  },
  'llego-hoy': {
    label: 'Llegó hoy',
    classes:
      'border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:text-emerald-300',
    icon: faCalendarCheck,
  },
};

/**
 * Átomo: Insignia temporal que indica si el huésped sale hoy, sale mañana o llegó hoy.
 */
export const RecepcionTemporalBadge = memo(function RecepcionTemporalBadge({
  checkIn,
  checkOut,
  className = '',
}: RecepcionTemporalBadgeProps) {
  const temporalState = useMemo(
    () => resolveTemporalState(checkIn, checkOut),
    [checkIn, checkOut]
  );

  if (!temporalState) return null;

  const config = TEMPORAL_STYLE_MAP[temporalState];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-2xs select-none ${config.classes} ${className}`}
    >
      <FontAwesomeIcon
        icon={config.icon}
        className="size-2.5"
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
});

export default RecepcionTemporalBadge;
