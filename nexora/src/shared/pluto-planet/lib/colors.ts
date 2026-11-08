/**
 * Paleta de colores oficial para el Planeta Plutón (The Heart of the Kuiper Belt):
 *
 * Colores obligatorios:
 * - #594588 (Púrpura místico de Plutón / Capas de neblina y tierras altas craterizadas)
 * - #2E1C48 (Violeta profundo de Kuiper / Sombra del terminador 3D y región oscura Cthulhu Macula)
 * - #3A4481 (Índigo de neblina atmosférica / Capas azuladas descubiertas por New Horizons)
 * - #E8D7B7 (Arena de nitrógeno pálido / Dunas de metano y bordes de cuencas)
 * - #F1F0D7 (Glaciar Corazón luminoso / El famoso Corazón de Plutón "Tombaugh Regio" y Sputnik Planitia)
 * - #403C34 (Marrón sombra de tolinas / Cordilleras de hielo de agua Montes Hillary y Norgay)
 */
export const PLUTO_PALETTE = {
  mysticPurple: '#594588',
  kuiperViolet: '#2E1C48',
  hazeIndigo: '#3A4481',
  nitrogenSand: '#E8D7B7',
  heartGlacier: '#F1F0D7',
  tholinUmber: '#403C34',
} as const

export const PLUTO_GRADIENTS = {
  // Gradiente esférico continuo de la superficie de Plutón
  surface: `linear-gradient(135deg, 
    ${PLUTO_PALETTE.heartGlacier} 0%, 
    ${PLUTO_PALETTE.nitrogenSand} 25%, 
    ${PLUTO_PALETTE.mysticPurple} 55%, 
    ${PLUTO_PALETTE.tholinUmber} 80%, 
    ${PLUTO_PALETTE.kuiperViolet} 100%)`,

  // Terreno geológico de Plutón
  terrain: `radial-gradient(ellipse at 42% 48%, 
    ${PLUTO_PALETTE.heartGlacier} 0%, 
    ${PLUTO_PALETTE.nitrogenSand} 35%, 
    ${PLUTO_PALETTE.mysticPurple} 65%, 
    ${PLUTO_PALETTE.tholinUmber} 85%, 
    ${PLUTO_PALETTE.kuiperViolet} 100%)`,

  // Resplandor áurico e índigo de la neblina atmosférica azul de Plutón
  atmosphere: `radial-gradient(circle, rgba(58,68,129,0) 60%, ${PLUTO_PALETTE.hazeIndigo}88 74%, ${PLUTO_PALETTE.mysticPurple}44 88%, rgba(58,68,129,0) 100%)`,
  glow: `radial-gradient(circle, rgba(58,68,129,0.30) 0%, rgba(89,69,136,0.18) 50%, transparent 74%)`,

  // El Gran Corazón de Plutón (Tombaugh Regio / Sputnik Planitia)
  heart: `radial-gradient(ellipse at 48% 46%, 
    ${PLUTO_PALETTE.heartGlacier} 0%, 
    ${PLUTO_PALETTE.nitrogenSand} 70%, 
    transparent 100%)`,

  // Borde y acento interactivo
  cardBorder: `linear-gradient(135deg, ${PLUTO_PALETTE.mysticPurple}66 0%, ${PLUTO_PALETTE.kuiperViolet}44 50%, ${PLUTO_PALETTE.nitrogenSand}66 100%)`,
} as const

