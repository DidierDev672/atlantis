import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type PlanetIconProps = {
  icon: IconDefinition;
  px: number;
  /** Sube el icono para dejar espacio al texto cuando éste va sobre el planeta. */
  raised?: boolean;
};

/** Átomo: icono de FontAwesome centrado sobre el planeta (ej. faConciergeBell para Recepcionista). */
export function PlanetIcon({ icon, px, raised = false }: PlanetIconProps) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 flex justify-center leading-none text-white"
      style={{
        top: raised ? '24%' : '50%',
        transform: raised ? undefined : 'translateY(-50%)',
        fontSize: px * 0.3,
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))',
      }}
    >
      <FontAwesomeIcon icon={icon} />
    </span>
  );
}
