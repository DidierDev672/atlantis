/**
 * Paleta de colores oficial para el Planeta Júpiter (Gas Giant):
 * Regla de oro:
 * - #82614D (Marrón café oscuro / Cinturones oscuros y sombras jovianas)
 * - #D3C7AF (Crema arena claro / Zonas claras de nubes y amoníaco / Zona ecuatorial)
 * - #8B7A62 (Ocre grisáceo / Bandas intermedias y vórtices templados)
 * - #FEAC4D (Ámbar dorado radiante / Resplandor atmosférico y corona)
 * - #D26F37 (Terracota / Gran Mancha Roja "Great Red Spot" y tormentas ovales)
 */
export const JUPITER_PALETTE = {
  darkBrown: '#82614D',
  lightCream: '#D3C7AF',
  mutedOchre: '#8B7A62',
  amberGold: '#FEAC4D',
  terracotta: '#D26F37',
} as const

export const JUPITER_GRADIENTS = {
  // Gradiente esférico continuo de Júpiter con bandas alternadas
  surface: `linear-gradient(180deg, 
    ${JUPITER_PALETTE.mutedOchre} 0%, 
    ${JUPITER_PALETTE.lightCream} 12%, 
    ${JUPITER_PALETTE.darkBrown} 26%, 
    ${JUPITER_PALETTE.lightCream} 38%, 
    ${JUPITER_PALETTE.amberGold} 48%, 
    ${JUPITER_PALETTE.lightCream} 58%, 
    ${JUPITER_PALETTE.terracotta} 68%, 
    ${JUPITER_PALETTE.darkBrown} 82%, 
    ${JUPITER_PALETTE.mutedOchre} 100%)`,

  // Bandas jovianas gaseosas dinámicas
  bands: `linear-gradient(180deg, 
    ${JUPITER_PALETTE.darkBrown} 0%, 
    ${JUPITER_PALETTE.mutedOchre} 10%, 
    ${JUPITER_PALETTE.lightCream} 22%, 
    ${JUPITER_PALETTE.darkBrown} 36%, 
    ${JUPITER_PALETTE.amberGold} 46%, 
    ${JUPITER_PALETTE.lightCream} 56%, 
    ${JUPITER_PALETTE.terracotta} 68%, 
    ${JUPITER_PALETTE.darkBrown} 82%, 
    ${JUPITER_PALETTE.mutedOchre} 100%)`,

  // Resplandor áurico y corona joviana
  atmosphere: `radial-gradient(circle, rgba(254,172,77,0) 60%, ${JUPITER_PALETTE.amberGold}99 74%, ${JUPITER_PALETTE.terracotta}55 86%, rgba(210,111,55,0) 100%)`,
  glow: `radial-gradient(circle, rgba(254,172,77,0.32) 0%, rgba(210,111,55,0.18) 50%, transparent 72%)`,

  // La Gran Mancha Roja (Great Red Spot)
  greatRedSpot: `radial-gradient(ellipse at 42% 42%, ${JUPITER_PALETTE.amberGold} 0%, ${JUPITER_PALETTE.terracotta} 65%, ${JUPITER_PALETTE.darkBrown} 100%)`,

  // Borde y acento de componentes interactivos
  cardBorder: `linear-gradient(135deg, ${JUPITER_PALETTE.amberGold}66 0%, ${JUPITER_PALETTE.darkBrown}44 50%, ${JUPITER_PALETTE.terracotta}66 100%)`,
} as const

