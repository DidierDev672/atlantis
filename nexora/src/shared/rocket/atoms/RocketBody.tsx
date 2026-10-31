import { useId } from 'react';
import { cn } from '../../lib';

const FUSELAGE =
  'M40 2 C56 18 62 44 60 96 L60 108 L20 108 L20 96 C18 44 24 18 40 2 Z';

type RocketBodyProps = {
  className?: string;
};

/**
 * Átomo: cuerpo del cohete en SVG (apunta hacia arriba).
 * El color de acento (nariz, aletas y franja) sale de `currentColor`,
 * por defecto `text-primary`: pasa otra clase `text-*` para cambiarlo.
 */

export function RocketBody({ className }: RocketBodyProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `rocket-clip-${uid}`;
  const glassId = `rocket-glass-${uid}`;
  const shadeId = `rocket-shade-${uid}`;

  return (
    <svg
      viewBox="0 0 80 122"
      aria-hidden="true"
      className={cn('text-primary block w-full overflow-visible', className)}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={FUSELAGE} />
        </clipPath>
        <radialGradient id={glassId} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="1" stopColor="#0284c7" />
        </radialGradient>
        <linearGradient id={shadeId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.55" stopColor="#0f172a" stopOpacity="0" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Aletas laterales */}
      <path d="M22 84 L5 112 Q2 119 9 119 L24 113 Z" fill="currentColor" />
      <path d="M58 84 L75 112 Q78 119 71 119 L56 113 Z" fill="currentColor" />

      {/* Tobera */}
      <path d="M29 108 L51 108 L55 122 L25 122 Z" fill="#475569" />

      {/* Fuselaje */}
      <path d={FUSELAGE} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="80" height="32" fill="currentColor" />
        <rect x="0" y="82" width="80" height="7" fill="currentColor" />
        <rect x="0" y="0" width="80" height="122" fill={`url(#${shadeId})`} />
      </g>

      {/* Ventana */}
      <circle cx="40" cy="56" r="12" fill="#1e293b" />
      <circle cx="40" cy="56" r="9" fill={`url(#${glassId})`} />
      <ellipse
        cx="36.5"
        cy="52.5"
        rx="3"
        ry="2"
        fill="#fff"
        opacity="0.6"
        transform="rotate(-30 36.5 52.5)"
      />
    </svg>
  );
}
