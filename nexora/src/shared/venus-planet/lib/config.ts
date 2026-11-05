import type { PlanetSize } from './types';

/** Diámetro del planeta en px. El blur, las sombras y los iconos escalan a partir de este valor. */
export const SIZE_PX: Record<PlanetSize, number> = {
  tiny: 32,
  small: 64,
  medium: 112,
  large: 176,
};

/** Tipografía del texto según el tamaño. */
export const LABEL_TEXT: Record<
  PlanetSize,
  { label: string; description: string }
> = {
  tiny: { label: 'text-xs', description: 'text-[10px]' },
  small: { label: 'text-xs', description: 'text-[11px]' },
  medium: { label: 'text-sm', description: 'text-xs' },
  large: { label: 'text-base', description: 'text-sm' },
};

/**
 * Nivel de detalle por tamaño: un planeta de 32px no necesita 3 capas de nubes ni brasas.
 * `cloudLayers` son índices de CLOUD_LAYERS (0 = fondo, 2 = frente).
 */

export const DETAIL: Record<
  PlanetSize,
  { cloudLayers: number[]; embers: number; hazeBands: number }
> = {
  tiny: { cloudLayers: [2], embers: 0, hazeBands: 1 },
  small: { cloudLayers: [1, 2], embers: 0, hazeBands: 2 },
  medium: { cloudLayers: [0, 1, 2], embers: 4, hazeBands: 3 },
  large: { cloudLayers: [0, 1, 2], embers: 7, hazeBands: 3 },
};

/** Cielo de Venus: ámbar oscuro arriba, amarillo anaranjado al horizonte, suelo oscuro (corte en 58%). */
export const SKY_BACKGROUND =
  'linear-gradient(to bottom, #6b3d08 0%, #b9791a 28%, #e8a63a 50%, #ffc15a 58%, #3a150a 58%, #150604 100%)';

/** Hover/tap del planeta cuando el padre es un botón (propagación de variantes). */
export const GLOBE_VARIANTS = {
  rest: { scale: 1 },
  hover: { scale: 1.06 },
  tap: { scale: 0.96 },
};
