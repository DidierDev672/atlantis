import { motion } from 'motion/react';

import type { EmberConfig } from '../lib/types';

type EmberProps = EmberConfig & {
  animated: boolean;
};

/** Átomo: una brasa que sube desde el suelo, se desplaza de lado y se apaga. */

export function Ember({
  left,
  bottom,
  size,
  delay,
  duration,
  drift,
  animated,
}: EmberProps) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute rounded-full"
      style={{
        left: `${left}%`,
        bottom: `${bottom}%`,
        width: `${size}%`,
        aspectRatio: '1',
        background: '#ffd27a',
        boxShadow: '0 0 5px 1px rgba(255,140,30,0.9)',
      }}
      initial={false}
      animate={
        animated
          ? {
              y: ['0%', '-1000%'],
              x: ['0%', `${drift}%`],
              opacity: [0, 1, 0],
              scale: [0.6, 1, 0.4],
            }
          : { opacity: 0 }
      }
      transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  );
}
