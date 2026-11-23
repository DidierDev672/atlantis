import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBed,
  faBroom,
  faCircleCheck,
  faScrewdriverWrench,
} from '@fortawesome/free-solid-svg-icons';
import type {
  FloorBadgeTone,
  RoomFloorStatusKey,
} from '../../domain/recepcion-floor';

export interface RecepcionFloorStatusPillProps {
  statusKey: RoomFloorStatusKey;
  label: string;
  tone: FloorBadgeTone;
  active: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}

const INACTIVE_CLASSES: Record<FloorBadgeTone, string> = {
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-400/30 dark:text-emerald-300',
  warning:
    'border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:border-amber-400/30 dark:text-amber-300',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:border-sky-400/30 dark:text-sky-300',
  danger:
    'border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:border-rose-400/30 dark:text-rose-300',
};

const ACTIVE_CLASSES: Record<FloorBadgeTone, string> = {
  success:
    'border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30',
  warning:
    'border-amber-600 bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30',
  info: 'border-sky-600 bg-sky-600 text-white shadow-xs ring-2 ring-sky-500/30',
  danger:
    'border-rose-600 bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30',
};

const STATUS_ICON_MAP: Record<RoomFloorStatusKey, typeof faCircleCheck> = {
  available: faCircleCheck,
  occupied: faBed,
  cleaning: faBroom,
  maintenance: faScrewdriverWrench,
};

/**
 * Átomo: Badge interactivo de estado de habitaciones por piso
 * (Disponible, Ocupada, Limpieza, Mantenimiento).
 */
export const RecepcionFloorStatusPill = memo(function RecepcionFloorStatusPill({
  statusKey,
  label,
  tone,
  active,
  disabled = false,
  title,
  onClick,
}: RecepcionFloorStatusPillProps) {
  const colorClass = active ? ACTIVE_CLASSES[tone] : INACTIVE_CLASSES[tone];
  const icon = STATUS_ICON_MAP[statusKey];

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        try {
          onClick();
        } catch (err) {
          console.error('Error al filtrar por badge de estado:', err);
        }
      }}
      className={`focus-visible:ring-primary/40 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition focus-visible:ring-2 focus-visible:outline-none ${colorClass} ${
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'cursor-pointer active:scale-[0.97]'
      }`}
    >
      <FontAwesomeIcon icon={icon} className="size-3" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
});

export default RecepcionFloorStatusPill;
