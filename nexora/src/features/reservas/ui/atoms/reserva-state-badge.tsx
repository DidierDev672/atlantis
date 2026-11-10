import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleDot,
  faBan,
  faTriangleExclamation,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { popIn } from '../../../../design-tokens/motion';
import type { ReservaTone } from '../../domain/reserva-list-types';

export type ReservaNormalizedState =
  'completed' | 'progress' | 'canceled' | 'default';

export interface ReservaStateBadgeProps {
  label: string;
  tone?: ReservaTone;
  status?: string;
  size?: 'sm' | 'md';
  className?: string;
}

interface StateStyleConfig {
  hex: string;
  bg: string;
  border: string;
  textClass: string;
  icon: IconDefinition;
}

/**
 * Paleta de colores solicitada para estados de reserva:
 * - #9ABC05 -> completed (Completada / Finalizada)
 * - #ffc926 -> progress (Progreso / En curso)
 * - #f96015 -> canceled (Cancelada)
 */
const STATE_THEMES: Record<ReservaNormalizedState, StateStyleConfig> = {
  completed: {
    hex: '#9ABC05',
    bg: 'rgba(154, 188, 5, 0.14)',
    border: 'rgba(154, 188, 5, 0.38)',
    textClass: 'text-[#586b03] dark:text-[#c4ea15]',
    icon: faCircleCheck,
  },
  progress: {
    hex: '#ffc926',
    bg: 'rgba(255, 201, 38, 0.16)',
    border: 'rgba(255, 201, 38, 0.45)',
    textClass: 'text-[#7e5c00] dark:text-[#ffdc5c]',
    icon: faCircleDot,
  },
  canceled: {
    hex: '#f96015',
    bg: 'rgba(249, 96, 21, 0.14)',
    border: 'rgba(249, 96, 21, 0.38)',
    textClass: 'text-[#ab3803] dark:text-[#ff8342]',
    icon: faBan,
  },
  default: {
    hex: '#6d6e76',
    bg: 'rgba(109, 110, 118, 0.14)',
    border: 'rgba(109, 110, 118, 0.35)',
    textClass: 'text-neutral',
    icon: faTriangleExclamation,
  },
};

export function normalizeReservaState(
  status?: string,
  label?: string,
  tone?: ReservaTone
): ReservaNormalizedState {
  const norm = `${status || ''} ${label || ''} ${tone || ''}`.toLowerCase();

  if (
    norm.includes('completed') ||
    norm.includes('completada') ||
    norm.includes('finalizada') ||
    norm.includes('confirmed') ||
    norm.includes('confirmada') ||
    tone === 'purple' ||
    tone === 'emerald'
  ) {
    return 'completed';
  }

  if (
    norm.includes('progress') ||
    norm.includes('progreso') ||
    norm.includes('en curso') ||
    norm.includes('pending') ||
    norm.includes('pendiente') ||
    tone === 'blue' ||
    tone === 'amber'
  ) {
    return 'progress';
  }

  if (
    norm.includes('canceled') ||
    norm.includes('cancelada') ||
    norm.includes('cancelled') ||
    tone === 'red'
  ) {
    return 'canceled';
  }

  return 'default';
}

export function ReservaStateBadge({
  label,
  tone,
  status,
  size = 'sm',
  className = '',
}: ReservaStateBadgeProps) {
  const stateKey = normalizeReservaState(status, label, tone);
  const config = STATE_THEMES[stateKey];
  const sizeClass =
    size === 'sm' ? 'px-2.5 py-0.5 text-xs gap-1.5' : 'px-3 py-1 text-xs gap-2';

  return (
    <motion.span
      variants={popIn}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
      className={`inline-flex items-center rounded-full border font-semibold shadow-2xs backdrop-blur-xs transition-shadow select-none hover:shadow-xs ${sizeClass} ${config.textClass} ${className}`}
    >
      <FontAwesomeIcon
        icon={config.icon}
        className="size-3 shrink-0"
        style={{ color: config.hex }}
      />
      <span className="leading-none">{label}</span>
    </motion.span>
  );
}
