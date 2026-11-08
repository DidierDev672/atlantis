/**
 * Paleta de colores oficial para el Planeta Saturno (The Ringed Planet):
 *
 * Colores obligatorios:
 * - #6E6660 (Gris pardo cenizo / Anillo exterior A, sombras frías de nubes y cinturones polares)
 * - #D3C7AF (Crema amoniacal suave / Zonas claras de nubes y bandas templadas)
 * - #D9BD9F (Arena cálida saturniana / Zona ecuatorial y cuerpo principal del planeta)
 * - #4E493F (Marrón sombra profundo / Sombra del terminador 3D, sombra planetaria sobre anillos y tipografía)
 * - #D29F37 (Ocre dorado saturniano / Anillo B brillante, corona luminosa y acentos de interacción)
 */
export const SATURN_PALETTE = {
  mutedSlate: '#6E6660',
  paleCream: '#D3C7AF',
  warmSand: '#D9BD9F',
  deepUmber: '#4E493F',
  goldenOchre: '#D29F37',
} as const

export const SATURN_GRADIENTS = {
  // Gradiente esférico continuo de la superficie de Saturno
  surface: `linear-gradient(180deg, 
    ${SATURN_PALETTE.mutedSlate} 0%, 
    ${SATURN_PALETTE.paleCream} 14%, 
    ${SATURN_PALETTE.warmSand} 28%, 
    ${SATURN_PALETTE.paleCream} 42%, 
    ${SATURN_PALETTE.goldenOchre} 54%, 
    ${SATURN_PALETTE.warmSand} 68%, 
    ${SATURN_PALETTE.paleCream} 82%, 
    ${SATURN_PALETTE.deepUmber} 100%)`,

  // Bandas atmosféricas gaseosas de Saturno
  bands: `linear-gradient(180deg, 
    ${SATURN_PALETTE.mutedSlate} 0%, 
    ${SATURN_PALETTE.paleCream} 12%, 
    ${SATURN_PALETTE.warmSand} 24%, 
    ${SATURN_PALETTE.goldenOchre} 38%, 
    ${SATURN_PALETTE.paleCream} 52%, 
    ${SATURN_PALETTE.warmSand} 66%, 
    ${SATURN_PALETTE.mutedSlate} 80%, 
    ${SATURN_PALETTE.deepUmber} 100%)`,

  // Resplandor áurico y corona difusa de Saturno
  atmosphere: `radial-gradient(circle, rgba(210,159,55,0) 62%, ${SATURN_PALETTE.goldenOchre}88 76%, ${SATURN_PALETTE.warmSand}44 88%, rgba(210,159,55,0) 100%)`,
  glow: `radial-gradient(circle, rgba(210,159,55,0.28) 0%, rgba(217,189,159,0.14) 50%, transparent 74%)`,

  // Anillos de Saturno (de adentro hacia afuera: Anillo C tenue, Anillo B brillante, Cassini, Anillo A)
  rings: `radial-gradient(ellipse at center,
    transparent 0%,
    transparent 44%,
    ${SATURN_PALETTE.mutedSlate}33 45%,
    ${SATURN_PALETTE.warmSand}aa 52%,
    ${SATURN_PALETTE.goldenOchre}ee 62%,
    ${SATURN_PALETTE.deepUmber}cc 64%,
    transparent 66%,
    ${SATURN_PALETTE.mutedSlate}bb 68%,
    ${SATURN_PALETTE.paleCream}dd 76%,
    ${SATURN_PALETTE.mutedSlate}88 82%,
    transparent 84%)`,

  // Borde y acento interactivo
  cardBorder: `linear-gradient(135deg, ${SATURN_PALETTE.goldenOchre}66 0%, ${SATURN_PALETTE.deepUmber}44 50%, ${SATURN_PALETTE.warmSand}66 100%)`,
} as const

