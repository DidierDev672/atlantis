import type { LoadingSize, LoadingVariant } from '../type';

/** Tamano en px del "universo" del loader (planeta + anillo + satelite) */

export const SIZE_PX: Record<LoadingSize, number> = {
  sm: 32,
  md: 64,
  lg: 122,
};

/** Tamano por defecto segun la variante, para no repetirlo en cada uso. */
export const DEFAULT_SIZE_BY_VARIANT: Record<LoadingVariant, LoadingSize> = {
  inline: 'sm',
  block: 'md',
  overlay: 'md',
  fullscreen: 'lg',
};

/** Inclinacion del plano del anilo (grados). Compartida por anillo y satelite */
export const RING_TILT_DEG = -20;
