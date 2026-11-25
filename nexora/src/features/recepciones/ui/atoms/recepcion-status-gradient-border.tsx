import { memo, useMemo, type ReactNode } from 'react';

export interface RecepcionStatusGradientBorderProps {
  status?: string | null;
  children: ReactNode;
  className?: string;
}

type NormalizedRoomBorderStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'cleaning'
  | 'reserved'
  | 'inactive'
  | 'default';

const BORDER_GRADIENT_MAP: Record<NormalizedRoomBorderStatus, string> = {
  available: 'from-emerald-400/45 via-line/50 to-teal-400/20',
  occupied: 'from-blue-400/45 via-line/50 to-indigo-400/20',
  maintenance: 'from-amber-400/45 via-line/50 to-orange-400/20',
  cleaning: 'from-cyan-400/45 via-line/50 to-sky-400/20',
  reserved: 'from-purple-400/45 via-line/50 to-fuchsia-400/20',
  inactive: 'from-neutral-400/35 via-line/45 to-neutral-400/15',
  default: 'from-primary/35 via-line/50 to-primary/15',
};

function resolveStatusGradientKey(
  status?: string | null
): NormalizedRoomBorderStatus {
  try {
    const norm = (status || '').trim().toLowerCase();
    if (
      norm === 'available' ||
      norm === 'disponible' ||
      norm === 'active' ||
      norm === 'activo'
    ) {
      return 'available';
    }
    if (
      norm === 'occupied' ||
      norm === 'ocupada' ||
      norm === 'ocupado' ||
      norm === 'busy'
    ) {
      return 'occupied';
    }
    if (norm === 'maintenance' || norm === 'mantenimiento') {
      return 'maintenance';
    }
    if (norm === 'cleaning' || norm === 'limpieza') {
      return 'cleaning';
    }
    if (norm === 'reserved' || norm === 'reservada' || norm === 'reservado') {
      return 'reserved';
    }
    if (norm === 'inactive' || norm === 'inactivo' || norm === 'disabled') {
      return 'inactive';
    }
    return 'default';
  } catch (err) {
    console.error('Error al resolver gradiente de estado de habitación:', err);
    return 'default';
  }
}

/**
 * Átomo: Marco minimalista de 1px con gradiente sutil según el estado de la habitación.
 */
export const RecepcionStatusGradientBorder = memo(
  function RecepcionStatusGradientBorder({
    status,
    children,
    className = '',
  }: RecepcionStatusGradientBorderProps) {
    const gradientClasses = useMemo(() => {
      const key = resolveStatusGradientKey(status);
      return BORDER_GRADIENT_MAP[key] ?? BORDER_GRADIENT_MAP.default;
    }, [status]);

    return (
      <div
        className={`rounded-2xl bg-linear-to-br px-px pt-[3px] pb-px transition-all duration-200 ${gradientClasses} ${className}`}
      >
        <div className="bg-panel flex h-full flex-col justify-between gap-3.5 rounded-t-[13px] rounded-b-[15px] p-4 sm:p-5">
          {children}
        </div>
      </div>
    );
  }
);

export default RecepcionStatusGradientBorder;
