import { motion } from 'motion/react';

import { RIVERS } from '../lib/scenery';

type LavaRiversProps = {
  animated: boolean;
};

/**
 * Engrosa todos los ríos para que se lean bien incluso en tamaños pequeños.
 */
const WIDTH_SCALE = 1.4;

const common = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * Átomo: ríos de lava naranja brillante.
 * Cada río tiene 4 trazos: dos halos anchos y translúcidos (el resplandor, sin filtros SVG
 * para que sea liviano), el cuerpo naranja y un núcleo amarillo discontinuo cuyo
 * `strokeDashoffset` se anima: da la sensación de que la lava fluye hacia el espectador.
 */
export function LavaRivers({ animated }: LavaRiversProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="absolute inset-0 size-full"
    >
      <motion.g
        animate={animated ? { opacity: [0.75, 1, 0.75] } : { opacity: 0.95 }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {RIVERS.map((river) => {
          const w = river.w * WIDTH_SCALE;
          return (
            <g key={river.d}>
              <path
                {...common}
                d={river.d}
                stroke="#ff4d00"
                strokeOpacity="0.22"
                strokeWidth={w + 8}
              />
              <path
                {...common}
                d={river.d}
                stroke="#ff6a00"
                strokeOpacity="0.42"
                strokeWidth={w + 4}
              />
              <path {...common} d={river.d} stroke="#ff9a1a" strokeWidth={w} />
            </g>
          );
        })}
      </motion.g>

      {RIVERS.map((river, i) => (
        <motion.path
          key={`core-${river.d}`}
          {...common}
          d={river.d}
          stroke="#ffe08a"
          strokeWidth={river.w * WIDTH_SCALE * 0.42}
          strokeDasharray="7 9"
          initial={false}
          animate={
            animated ? { strokeDashoffset: [0, -32] } : { strokeDashoffset: 0 }
          }
          transition={{
            duration: 1.8 + i * 0.25,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </svg>
  );
}
