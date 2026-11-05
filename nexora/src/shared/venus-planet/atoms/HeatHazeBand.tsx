import { motion } from 'motion/react';

import type { HazeBandConfig } from '../lib/types';

type HeatHazeBandProps = HazeBandConfig & {
  blurPx: number;
  animated: boolean;
};

/**
 * Átomo: una franja de bruma de calor sobre el horizonte.
 * Respira (opacidad), se estira (scaleY) y ondula de lado a lado, como el aire sobre el asfalto.
 */
export function HeatHazeBand({
  top,
  height,
  background,
  duration,
  drift,
  delay,
  blurPx,
  animated,
}: HeatHazeBandProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: '-8%',
        right: '-8%',
        background,
        filter: `blur(${blurPx}px)`,
      }}
      initial={false}
      animate={
        animated
          ? {
              opacity: [0.55, 0.95, 0.55],
              scaleY: [1, 1.14, 1],
              x: [`${-drift}%`, `${drift}%`, `${-drift}%`],
            }
          : { opacity: 0.75 }
      }
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
