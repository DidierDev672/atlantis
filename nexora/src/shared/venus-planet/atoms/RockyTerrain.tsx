import { useId } from 'react';

import { BOULDERS, RIDGE_FILL, RIDGE_LINE } from '../lib/scenery';

/**
 * Atomo: suele rocoso y desolado (estatica).
 * Cordillera + textura de roca (ruido fractal) + bor
 * de iluminado por la lava + rocas sueltas.
 */

export function RockyTerrain() {
  const uid = useId().replace(/:/g, '');
  const groundId = `venus-ground-${uid}`;
  const rockId = `venus-rock-${uid}`;
  const clipId = `venus-clip-${uid}`;

  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="absolute inset-0 size-full"
    >
      <defs>
        <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5f2713" />
          <stop offset="0.35" stopColor="#3d170b" />
          <stop offset="1" stopColor="#160704" />
        </linearGradient>
        <filter
          id={rockId}
          filterUnits="userSpaceOnUse"
          x="0"
          y="86"
          width="200"
          height="114"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            seed="4"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.04  0 0 0 0 0.015  0 0 0 0 0.01  0 0 0 1.1 -0.38"
          />
        </filter>
        <clipPath id={clipId}>
          <path d={RIDGE_FILL} />
        </clipPath>
      </defs>

      <path d={RIDGE_FILL} fill={`url(#${groundId})`} />
      <rect
        x="0"
        y="86"
        width="200"
        height="114"
        filter={`url(#${rockId})`}
        opacity="0.55"
        clipPath={`url(#${clipId})`}
      />
      <path
        d={RIDGE_LINE}
        fill="none"
        stroke="#ff8a2a"
        strokeOpacity="0.4"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {BOULDERS.map((d) => (
        <path
          key={d}
          d={d}
          fill="#1a0805"
          stroke="#5a2410"
          strokeOpacity="0.5"
          strokeWidth="0.5"
        />
      ))}
    </svg>
  );
}
