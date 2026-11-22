import type { Variants } from 'motion/react';

/**
 * Transición única de contenedor sin staggerChildren ni transformaciones por ítem,
 * evitando crear decenas de capas compuestas en GPU al expandir pisos grandes.
 */
export const FLOOR_CONTENT_FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.14, ease: 'easeOut' },
  },
};
