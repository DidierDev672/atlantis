import { memo, useMemo } from 'react';
import {
  isHabitacionOcupada,
  matchesHabitacionStatus,
  type HabitacionEstadoKey,
} from '../../domain/habitacion-lista';

export interface HabitacionStatusTopBorderProps {
  status: HabitacionEstadoKey;
}

const GRADIENT_BY_STATUS: Record<string, string> = {
  available: 'from-emerald-400/15 via-emerald-500/75 to-teal-400/15',
  occupied: 'from-rose-400/15 via-rose-500/75 to-pink-400/15',
  maintenance: 'from-amber-400/15 via-amber-500/75 to-orange-400/15',
  cleaning: 'from-sky-400/15 via-sky-500/75 to-cyan-400/15',
  inactive: 'from-slate-400/10 via-slate-400/45 to-slate-400/10',
  default: 'from-primary/15 via-primary/65 to-primary/15',
};

function resolveGradientKey(status: HabitacionEstadoKey): string {
  try {
    if (isHabitacionOcupada(status)) return 'occupied';
    if (matchesHabitacionStatus(status, 'available')) return 'available';
    if (matchesHabitacionStatus(status, 'maintenance')) return 'maintenance';
    if (matchesHabitacionStatus(status, 'cleaning')) return 'cleaning';
    if (matchesHabitacionStatus(status, 'inactive')) return 'inactive';
    return 'default';
  } catch {
    return 'default';
  }
}

/**
 * Átomo: Borde superior sutil con gradiente semántico según el estado de la habitación.
 */
export const HabitacionStatusTopBorder = memo(function HabitacionStatusTopBorder({
  status,
}: HabitacionStatusTopBorderProps) {
  const gradientClass = useMemo(() => {
    const key = resolveGradientKey(status);
    return GRADIENT_BY_STATUS[key] ?? GRADIENT_BY_STATUS.default;
  }, [status]);

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-linear-to-r opacity-85 transition-opacity duration-200 group-hover:opacity-100 ${gradientClass}`}
    />
  );
});
