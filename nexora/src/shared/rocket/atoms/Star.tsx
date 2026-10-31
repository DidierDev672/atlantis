import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

type StarProps = {
  /** Posición dentro del escenario, en %. */
  top: number;
  left: number;
  /** Tamaño en rem. */
  size: number;
  delay: number;
  animated: boolean;
};
/** Átomo: estrella decorativa que titila (icono FontAwesome). */
export function Star({ top, left, size, delay, animated }: StarProps) {
  return (
    <motion.span
      aria-hidden="true"
      className="text-ink-muted pointer-events-none absolute leading-none"
      style={{ top: `${top}%`, left: `${left}%`, fontSize: `${size}rem` }}
      initial={false}
      animate={
        animated
          ? { opacity: [0.2, 0.85, 0.2], scale: [0.8, 1.1, 0.8] }
          : { opacity: 0.45, scale: 1 }
      }
      transition={{
        duration: 2.4,
        repeat: animated ? Infinity : 0,
        delay,
        ease: 'easeInOut',
      }}
    >
      <FontAwesomeIcon icon={faStar} />
    </motion.span>
  );
}
