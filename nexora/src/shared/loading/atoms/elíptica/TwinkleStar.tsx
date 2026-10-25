import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

type TwinkleStarProps = {
  /** Posición absoluta dentro del loader, Ejemplo. {top: '8%', left: '4%'}  */
  position: React.CSSProperties;
  /** Tamaño en px. */
  size: number;
  /** Retraso (s) para que las estrellas no parpadeen sincronizadas. */
  delay?: number;
  animated: boolean;
};

/** Átomo: estrella decorativa que titila (icono FontAwesome). */
export function TwinkleStar({
  position,
  size,
  delay = 0,
  animated,
}: TwinkleStarProps) {
  return (
    <motion.span
      aria-hidden="true"
      className="text-ink-muted pointer-events-none absolute leading-none"
      style={{ ...position, fontSize: size }}
      initial={{ opacity: 0.25, scale: 0.8 }}
      animate={
        animated
          ? { opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.1, 0.8] }
          : { opacity: 0.5, scale: 1 }
      }
      transition={{ duration: 2.2, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <FontAwesomeIcon icon={faStar} />
    </motion.span>
  );
}
