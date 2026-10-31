import { motion } from 'motion/react';

type SpeedLineProps = {
  /** Posición horizontal en % del escenario. */
  left: number;
  /** Alto de la línea en % del escenario. */
  height: number;
  delay: number;
  active: boolean;
};

/** Átomo: estela vertical que cruza el escenario y da sensación de velocidad. */
export function SpeedLine({ left, height, delay, active }: SpeedLineProps) {
  return (
    <motion.span
      aria-hidden="true"
      className="bg-primary/40 absolute top-0 w-px rounded-full"
      style={{ left: `${left}%`, height: `${height}%` }}
      initial={false}
      animate={
        active ? { y: ['-120%', '800%'], opacity: [0, 1, 0] } : { opacity: 0 }
      }
      transition={
        active
          ? {
              duration: 0.55 + height / 100,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }
          : { duration: 0.2 }
      }
    />
  );
}
