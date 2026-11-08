/**
 * Paleta de colores oficial para el Planeta Neptuno (The Windy Blue Giant):
 *
 * Colores obligatorios:
 * - #212354 (Azul abisal profundo / Sombra del terminador nocturno 3D y capas profundas)
 * - #3E54E8 (Azul cobalto real / Capas intermedias y cinturones atmosféricos)
 * - #3E66F9 (Azul celeste intenso / Manto característico de Neptuno y bordes interactivos)
 * - #6081FF (Azul eléctrico aciano / Resplandor atmosférico, corona y neblina alta)
 * - #89F3FF (Cian glacial luminoso / Nubes cirro de metano, "Scooter", tormentas y brillo especular)
 */
export const NEPTUNE_PALETTE = {
  abyssalNavy: '#212354',
  royalCobalt: '#3E54E8',
  azureVivid: '#3E66F9',
  electricBlue: '#6081FF',
  luminousCyan: '#89F3FF',
} as const

export const NEPTUNE_GRADIENTS = {
  // Gradiente esférico continuo de la superficie de Neptuno
  surface: `linear-gradient(145deg, 
    ${NEPTUNE_PALETTE.electricBlue} 0%, 
    ${NEPTUNE_PALETTE.azureVivid} 25%, 
    ${NEPTUNE_PALETTE.royalCobalt} 55%, 
    ${NEPTUNE_PALETTE.abyssalNavy} 100%)`,

  // Bandas atmosféricas supersónicas
  bands: `linear-gradient(180deg, 
    ${NEPTUNE_PALETTE.abyssalNavy} 0%, 
    ${NEPTUNE_PALETTE.royalCobalt} 14%, 
    ${NEPTUNE_PALETTE.azureVivid} 30%, 
    ${NEPTUNE_PALETTE.electricBlue} 45%, 
    ${NEPTUNE_PALETTE.azureVivid} 60%, 
    ${NEPTUNE_PALETTE.royalCobalt} 76%, 
    ${NEPTUNE_PALETTE.abyssalNavy} 100%)`,

  // Resplandor áurico y corona de metano de Neptuno
  atmosphere: `radial-gradient(circle, rgba(96,129,255,0) 60%, ${NEPTUNE_PALETTE.electricBlue}88 74%, ${NEPTUNE_PALETTE.luminousCyan}44 88%, rgba(96,129,255,0) 100%)`,
  glow: `radial-gradient(circle, rgba(96,129,255,0.32) 0%, rgba(137,243,255,0.18) 50%, transparent 74%)`,

  // La Gran Mancha Oscura (Great Dark Spot)
  greatDarkSpot: `radial-gradient(ellipse at 40% 40%, 
    ${NEPTUNE_PALETTE.abyssalNavy} 0%, 
    ${NEPTUNE_PALETTE.royalCobalt} 65%, 
    transparent 100%)`,

  // Borde y acento interactivo
  cardBorder: `linear-gradient(135deg, ${NEPTUNE_PALETTE.azureVivid}66 0%, ${NEPTUNE_PALETTE.abyssalNavy}44 50%, ${NEPTUNE_PALETTE.luminousCyan}66 100%)`,
} as const

