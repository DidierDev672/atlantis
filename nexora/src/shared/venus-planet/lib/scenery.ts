import type {
  CloudLayerConfig,
  EmberConfig,
  HazeBandConfig,
  RiverConfig,
} from './types';

/* Todo el paisaje se dibuja en un viewBox 0 0 200 200: escala a cualquier tamaño. */

/** Silueta de la cordillera (solo el borde). */
export const RIDGE_LINE =
  'M0 112 L14 102 L26 108 L44 90 L60 104 L76 94 L96 110 L116 92 L134 106 L152 88 L170 102 L186 94 L200 104';

/** Silueta cerrada hacia abajo: es el suelo. */
export const RIDGE_FILL = `${RIDGE_LINE} V200 H0 Z`;

/** Rocas grandes en primer plano (se dibujan sobre la lava para dar profundidad). */
export const FOREGROUND_ROCKS = [
  'M0 200 L0 150 L12 140 L20 156 L34 146 L46 170 L40 200 Z',
  'M200 200 L200 148 L186 142 L178 160 L164 150 L152 176 L160 200 Z',
  'M78 200 L86 186 L97 192 L108 184 L122 200 Z',
];

/** Rocas sueltas sobre el suelo. */
export const BOULDERS = [
  'M30 132 L36 126 L44 130 L42 138 L32 138 Z',
  'M150 128 L158 122 L166 128 L162 136 L152 136 Z',
  'M112 124 L116 120 L122 123 L120 128 L113 128 Z',
  'M54 150 L60 144 L68 148 L66 156 L56 156 Z',
];

/** Ríos de lava: nacen en el horizonte y bajan hacia el espectador. */
export const RIVERS: RiverConfig[] = [
  {
    d: 'M101 112 C96 124 108 132 99 144 S84 162 92 178 S104 194 98 206',
    w: 4.2,
  },
  { d: 'M62 113 C58 124 70 131 60 143 S36 157 42 173 S30 192 22 206', w: 3.2 },
  {
    d: 'M138 113 C144 124 130 133 142 145 S166 161 158 177 S172 194 180 206',
    w: 3.2,
  },
  { d: 'M99 144 C112 148 126 142 142 145', w: 2 },
  { d: 'M60 143 C50 146 44 144 36 150', w: 1.6 },
  { d: 'M82 112 C80 118 86 121 82 127', w: 1.4 },
  { d: 'M120 112 C122 118 116 121 120 127', w: 1.4 },
];

/**
 * Capas de nubes de ácido sulfúrico, de fondo (oscuras, lentas) a frente (claras, rápidas).
 * Cada capa es periódica (se repite cada 100% del ancho) para que el bucle no tenga saltos.
 */
export const CLOUD_LAYERS: CloudLayerConfig[] = [
  {
    top: 0,
    height: 40,
    duration: 95,
    opacity: 0.95,
    blobs: [
      { x: 0, w: 38, y: 5, h: 80, color: '#8a5a0a' },
      { x: 24, w: 40, y: 15, h: 75, color: '#a06c0e' },
      { x: 50, w: 36, y: 0, h: 85, color: '#946208' },
      { x: 70, w: 38, y: 10, h: 80, color: '#b27a10' },
      { x: 88, w: 24, y: 20, h: 70, color: '#8a5a0a' },
    ],
  },
  {
    top: 14,
    height: 40,
    duration: 62,
    opacity: 0.92,
    blobs: [
      { x: 0, w: 34, y: 10, h: 75, color: '#d2a01c' },
      { x: 20, w: 38, y: 0, h: 80, color: '#e2b82e' },
      { x: 44, w: 36, y: 18, h: 72, color: '#bf8a14' },
      { x: 64, w: 40, y: 5, h: 80, color: '#f2d04a' },
      { x: 86, w: 26, y: 15, h: 70, color: '#d2a01c' },
    ],
  },
  {
    top: 26,
    height: 34,
    duration: 42,
    opacity: 0.9,
    blobs: [
      { x: 0, w: 36, y: 8, h: 78, color: '#f6e070' },
      { x: 22, w: 34, y: 20, h: 70, color: '#e8c23a' },
      { x: 42, w: 38, y: 0, h: 82, color: '#fff0a0' },
      { x: 64, w: 34, y: 14, h: 74, color: '#f6e070' },
      { x: 84, w: 30, y: 6, h: 80, color: '#fff3b0' },
    ],
  },
];

/** Brasas que suben desde el suelo. */
export const EMBERS: EmberConfig[] = [
  { left: 28, bottom: 34, size: 2.2, delay: 0, duration: 3.2, drift: 120 },
  { left: 48, bottom: 30, size: 1.8, delay: 1.1, duration: 3.8, drift: -140 },
  { left: 66, bottom: 36, size: 2.4, delay: 0.5, duration: 3.4, drift: 160 },
  { left: 38, bottom: 26, size: 1.6, delay: 1.9, duration: 4, drift: -100 },
  { left: 58, bottom: 24, size: 2, delay: 2.4, duration: 3.6, drift: 90 },
  { left: 20, bottom: 30, size: 1.5, delay: 0.8, duration: 4.2, drift: 130 },
  { left: 76, bottom: 28, size: 1.7, delay: 1.6, duration: 3.9, drift: -120 },
];

/** Bruma de calor: bandas translúcidas que ondulan sobre el horizonte. */
export const HAZE_BANDS: HazeBandConfig[] = [
  {
    top: 46,
    height: 24,
    background:
      'linear-gradient(to bottom, rgba(255,176,64,0) 0%, rgba(255,176,64,0.55) 45%, rgba(255,214,120,0.35) 65%, rgba(255,176,64,0) 100%)',
    duration: 4.5,
    drift: 3,
    delay: 0,
  },
  {
    top: 54,
    height: 22,
    background:
      'linear-gradient(to bottom, rgba(255,120,30,0) 0%, rgba(255,120,30,0.4) 50%, rgba(255,120,30,0) 100%)',
    duration: 5.5,
    drift: -3,
    delay: 1.2,
  },
  {
    top: 40,
    height: 30,
    background:
      'radial-gradient(ellipse at 50% 60%, rgba(255,140,30,0.6), rgba(255,140,30,0) 70%)',
    duration: 3.8,
    drift: 0,
    delay: 0.6,
  },
];
