/**
 * Paleta de colores oficial para el Planeta Marte
 * Regla de oro:
 * #F2D091 (Arena clara / Reflejo polar y polvo)
 * #966941 (Ocre / Cañones y mesetas)
 * #F2935C (Óxido anaranjado / Atmósfera y planicies)
 * #9F2A2A (Rojo marciano / Rocas volcánicas)
 * #73242A (Carmesí profundo / Sombras y corteza profunda)
 */
export const MARS_PALETTE = {
  sand: '#F2D091',
  ochre: '#966941',
  rust: '#F2935C',
  crimson: '#9F2A2A',
  deepRed: '#73242A',
} as const

export const MARS_GRADIENTS = {
  // Gradiente esférico del cielo/corteza de Marte
  surface: `linear-gradient(135deg, ${MARS_PALETTE.sand} 0%, ${MARS_PALETTE.rust} 35%, ${MARS_PALETTE.crimson} 70%, ${MARS_PALETTE.deepRed} 100%)`,
  // Terreno geológico con bandas de sedimentos
  terrain: `linear-gradient(to bottom, ${MARS_PALETTE.rust} 0%, ${MARS_PALETTE.ochre} 40%, ${MARS_PALETTE.crimson} 75%, ${MARS_PALETTE.deepRed} 100%)`,
  // Halo atmosférico de polvo en suspensión
  atmosphere: `radial-gradient(circle, rgba(242,147,92,0) 62%, rgba(242,147,92,0.65) 75%, rgba(242,208,145,0.35) 88%, rgba(242,147,92,0) 100%)`,
  // Resplandor cálido de fondo
  glow: `radial-gradient(circle, rgba(242,147,92,0.25) 0%, rgba(159,42,42,0.15) 50%, transparent 70%)`,
  // Casquete polar en el polo norte marciano
  polarCap: `radial-gradient(ellipse at 50% 12%, ${MARS_PALETTE.sand} 0%, rgba(242,208,145,0.7) 45%, transparent 75%)`,
} as const
