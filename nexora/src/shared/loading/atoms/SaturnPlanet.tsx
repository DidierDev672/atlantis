import { useId } from 'react';

import { cn } from '../../lib'; // ajusta a la ruta de tu helper `cn`

import { RING_TILT_DEG } from '../lib/sizes';

type SaturnPlanetProps = {
  className?: string;
};

/**
 * Átomo: Saturno dibujado en SVG (planeta + bandas + anillo).
 * El anillo se dibuja en dos mitades: la trasera queda detrás del planeta
 *  y la delantera encima, lo que da la sensación de profundidad
 * El color sale de `currentColor` (por defecto `text-primary`)
 */

export function SaturnPlanet({ className }: SaturnPlanetProps) {
  const uid = useId().replace(/:/g, '');
  const bodyId = `saturn-body-${uid}`;
  const shadeId = `saturn-shade-${uid}`;
  const clipId = `saturn-clip-${uid}`;

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={cn('text-primary size-full overflow-visible', className)}
    >
      <defs>
        <radialGradient id={bodyId} cx="36%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="35%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" />
        </radialGradient>
        <radialGradient id={shadeId} cx="36%" cy="30%" r="80%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx="60" cy="60" r="32" />
        </clipPath>
      </defs>

      {/* Anillo: mitad trasera */}
      <g transform={`rotate(${RING_TILT_DEG} 60 60)`}>
        <path
          d="M6 60 A54 15 0 0 1 114 60"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M16 60 A44 11 0 0 1 104 60"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.3"
        />
      </g>

      {/* Planeta */}
      <circle cx="60" cy="60" r="32" fill={`url(#${bodyId})`} />
      <g clipPath={`url(#${clipId})`}>
        <rect x="20" y="46" width="80" height="7" fill="#fff" opacity="0.18" />
        <rect x="20" y="61" width="80" height="5" fill="#000" opacity="0.12" />
        <rect x="20" y="72" width="80" height="8" fill="#fff" opacity="0.12" />
      </g>
      <circle cx="60" cy="60" r="32" fill={`url(#${shadeId})`} />

      {/* Anillo: mitad delantera */}
      <g transform={`rotate(${RING_TILT_DEG} 60 60)`}>
        <path
          d="M6 60 A54 15 0 0 0 114 60"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.95"
        />
        <path
          d="M16 60 A44 11 0 0 0 104 60"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
