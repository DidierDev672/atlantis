import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
  faHotel,
  faCity,
  faMapPin,
} from '@fortawesome/free-solid-svg-icons';

export type TipoUbicacion = 'edificio' | 'sede' | 'sub-sede';

export interface UbicacionRegistroPillProps {
  tipo: TipoUbicacion;
  name?: string | null;
  className?: string;
}

const TIPO_CONFIG = {
  edificio: {
    missingLabel: 'Sin edificio registrado',
    icon: faHotel,
  },
  sede: {
    missingLabel: 'Sin sede registrada',
    icon: faCity,
  },
  'sub-sede': {
    missingLabel: 'Sin sub sede registrada',
    icon: faMapPin,
  },
} as const;

/**
 * Píldora de estado de ubicación que informa de forma inmediata y clara al recepcionista
 * si la habitación cuenta con edificio, sede o sub-sede registrada o si carece de ella.
 *
 * Cumple con la Regla de Oro 1 (Cero IDs) y Regla de Oro 3 (Iconos FontAwesome).
 */
export function UbicacionRegistroPill({
  tipo,
  name,
  className = '',
}: UbicacionRegistroPillProps) {
  const config = TIPO_CONFIG[tipo];
  const isRegistered = typeof name === 'string' && name.trim().length > 0;

  if (isRegistered) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary shadow-2xs select-none ${className}`}
      >
        <FontAwesomeIcon icon={config.icon} className="size-2.5 shrink-0 opacity-80" />
        <span className="truncate max-w-[140px] sm:max-w-[180px]">{name}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 shadow-2xs select-none ${className}`}
      title={config.missingLabel}
    >
      <FontAwesomeIcon icon={faCircleExclamation} className="size-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <span>{config.missingLabel}</span>
    </span>
  );
}
