import type { Variants } from 'motion/react';

export const FLOOR_STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.04,
    },
  },
};

export const FLOOR_STAGGER_ROW_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 26,
      stiffness: 320,
      mass: 0.75,
    },
  },
};
