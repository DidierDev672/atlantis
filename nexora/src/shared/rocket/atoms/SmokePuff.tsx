import { motion } from 'motion/react';

type SmokePuffProps = {
  index: number;
  active: boolean;
  /** -1 = sale hacia la izquierda, 1 = hacia la derecha. */
  side: -1 | 1;
  left: number;
};

/**
 * Átomo: una nube de humo. Nace en la base, crece, se desplaza a un lado y se desvanece.
 * Las distancias están en % de su propio tamaño, así escala con el escenario.
 */

export function SmokePuff({ index, active, side, left }: SmokePuffProps) {
  return (
    <motion.span
      aria-hidden="true"
      className="bg-ink-muted/30 absolute bottom-0 aspect-square w-[18%] rounded-full blur-[2px]"
      style={{ left: `${left}%` }}
      initial={false}
      animate={
        active
          ? {
              x: ['0%', `${side * (110 + index * 35)}%`],
              y: ['0%', '-70%'],
              scale: [0.4, 1.6 + (index % 3) * 0.25],
              opacity: [0, 0.65, 0],
            }
          : { opacity: 0, scale: 0.4 }
      }
      transition={
        active
          ? {
              duration: 1.5 + (index % 3) * 0.3,
              delay: index * 0.16,
              repeat: Infinity,
              ease: 'easeOut',
            }
          : { duration: 0.3 }
      }
    />
  );
}
