/**
 * Paleta de colores oficial para el Planeta Urano (The Tilted Ice Giant):
 *
 * Colores obligatorios:
 * - #355B6D (Cian petróleo profundo / Capas subatmosféricas y sombra del terminador)
 * - #218193 (Cian brillante metánico / Acento interactivo primario y atmósfera alta)
 * - #79A4A9 (Aguamarina glacial / Zonas templadas intermedias y resplandor de anillos)
 * - #A5BEBD (Hielo cian suave / Bandas ecuatoriales y dispersión de luz)
 * - #D1D9CE (Menta escarchada / Cuello polar y neblina de metano condensado)
 * - #EAECDF (Crema glacial pálido / Cirros de metano de gran altitud y brillo especular)
 * - #D0C1AC (Arena mineral / Partículas de polvo de anillos exteriores)
 * - #384555 (Azul pizarra profundo / Terminador nocturno 3D y tipografía)
 */
export const URANUS_PALETTE = {
  deepTeal: '#355B6D',
  cyanBlue: '#218193',
  glacialAqua: '#79A4A9',
  paleCyanIce: '#A5BEBD',
  frostedMint: '#D1D9CE',
  glacialCream: '#EAECDF',
  mineralSand: '#D0C1AC',
  slateNavy: '#384555',
} as const

export const URANUS_GRADIENTS = {
  // Gradiente esférico continuo de Urano con su suave manto de metano
  surface: `linear-gradient(135deg, 
    ${URANUS_PALETTE.frostedMint} 0%, 
    ${URANUS_PALETTE.paleCyanIce} 20%, 
    ${URANUS_PALETTE.glacialAqua} 40%, 
    ${URANUS_PALETTE.cyanBlue} 65%, 
    ${URANUS_PALETTE.deepTeal} 85%, 
    ${URANUS_PALETTE.slateNavy} 100%)`,

  // Bandas sutiles de neblina fotoquímica
  bands: `linear-gradient(180deg, 
    ${URANUS_PALETTE.deepTeal} 0%, 
    ${URANUS_PALETTE.cyanBlue} 15%, 
    ${URANUS_PALETTE.glacialAqua} 30%, 
    ${URANUS_PALETTE.paleCyanIce} 45%, 
    ${URANUS_PALETTE.frostedMint} 55%, 
    ${URANUS_PALETTE.paleCyanIce} 70%, 
    ${URANUS_PALETTE.deepTeal} 85%, 
    ${URANUS_PALETTE.slateNavy} 100%)`,

  // Resplandor áurico y corona difusa de metano
  atmosphere: `radial-gradient(circle, rgba(33,129,147,0) 60%, ${URANUS_PALETTE.cyanBlue}88 74%, ${URANUS_PALETTE.glacialAqua}44 88%, rgba(33,129,147,0) 100%)`,
  glow: `radial-gradient(circle, rgba(33,129,147,0.30) 0%, rgba(121,164,169,0.18) 50%, transparent 74%)`,

  // Anillos verticales / inclinados únicos de Urano (inclinación de ~88° a 98°)
  verticalRings: `radial-gradient(ellipse at center,
    transparent 0%,
    transparent 58%,
    ${URANUS_PALETTE.mineralSand}33 60%,
    ${URANUS_PALETTE.glacialAqua}66 64%,
    ${URANUS_PALETTE.cyanBlue}aa 66%,
    transparent 68%,
    ${URANUS_PALETTE.paleCyanIce}88 74%,
    ${URANUS_PALETTE.deepTeal}55 78%,
    transparent 82%)`,

  // Borde y acento interactivo
  cardBorder: `linear-gradient(135deg, ${URANUS_PALETTE.cyanBlue}66 0%, ${URANUS_PALETTE.slateNavy}44 50%, ${URANUS_PALETTE.glacialAqua}66 100%)`,
} as const

