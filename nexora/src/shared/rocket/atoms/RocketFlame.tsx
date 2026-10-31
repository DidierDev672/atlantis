import { useId } from 'react';
import { motion } from 'framer-motion';

import type { FlameIntensity } from '../types';

type RocketFlameProps = {
  intensity: FlameIntensity;
  reduced?: boolean;
};

const LEVEL: Record<FlameIntensity, { scale: number; flicker: number }> = {
  off: { scale: 0, flicker: 0.3 },
  low: { scale: 0.35, flicker: 0.35 },
  medium: { scale: 0.8, flicker: 0.2 },
  high: { scale: 1.25, flicker: 0.12 },
};

/**
 * Átomo: llama del motor. Cada capa (naranja, amarilla, núcleo blanco) es una
 * gota; el conjunto se estira y titila desde la tobera hacia abajo.
 */

export function RocketFlame({ intensity, reduced = false }: RocketFlameProps) {
  const uid = useId().replace(/:/g, '');
  const outerId = `flame-outer-${uid}`;
  const midId = `flame-mid-${uid}`;
  const { scale, flicker } = LEVEL[intensity];
  const off = intensity === 'off';

  return (
    <svg
      viewBox="0 0 40 100"
      aria-hidden="true"
      className="block w-full overflow-visible"
    >
      <defs>
        <linearGradient id={outerId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="0.55" stopColor="#f97316" />
          <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={midId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fde047" />
          <stop offset="1" stopColor="#facc15" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.g
        style={{ originX: 0.5, originY: 0 }}
        initial={false}
        animate={
          off
            ? { scaleY: 0, scaleX: 1, opacity: 0 }
            : reduced
              ? { scaleY: scale, scaleX: 1, opacity: 1 }
              : {
                  scaleY: [scale, scale * 1.14, scale * 0.92, scale],
                  scaleX: [1, 0.93, 1.05, 1],
                  opacity: 1,
                }
        }
        transition={{
          duration: flicker,
          repeat: reduced || off ? 0 : Infinity,
          ease: 'linear',
        }}
      >
        <path
          d="M2 0 L38 0 C38 30 28 70 20 98 C12 70 2 30 2 0 Z"
          fill={`url(#${outerId})`}
        />
        <path
          d="M8 0 L32 0 C32 26 25 56 20 80 C15 56 8 26 8 0 Z"
          fill={`url(#${midId})`}
        />
        <path
          d="M13 0 L27 0 C27 18 23 36 20 52 C17 36 13 18 13 0 Z"
          fill="#fff"
          opacity="0.9"
        />
      </motion.g>
    </svg>
  );
}
