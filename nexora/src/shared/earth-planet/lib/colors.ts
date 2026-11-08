/**
 * Paleta de colores oficial para el Planeta Tierra
 * Regla de oro:
 * #D5D3C4 (Nubes blancas/hielo polar / reflejo de luz / arenas continentales)
 * #978C67 (Masas continentales / mesetas / llanuras y vegetación templada)
 * #546D93 (Océanos someros / mares / hidrosfera / dispersión Rayleigh)
 * #172842 (Océanos abisales / cuencas oceánicas profundas / atmósfera crepuscular)
 * #0F161D (Sombra nocturna / espacio exterior / corteza abisal)
 */
export const EARTH_PALETTE = {
  cloudIce: '#D5D3C4',
  continent: '#978C67',
  oceanShallow: '#546D93',
  oceanDeep: '#172842',
  nightShadow: '#0F161D',
} as const

export const EARTH_GRADIENTS = {
  // Gradiente base de la hidrosfera (océanos profundos a someros)
  ocean: `radial-gradient(circle at 40% 35%, ${EARTH_PALETTE.oceanShallow} 0%, ${EARTH_PALETTE.oceanDeep} 70%, ${EARTH_PALETTE.nightShadow} 100%)`,
  // Halo atmosférico azul tenue
  atmosphere: `radial-gradient(circle, rgba(84,109,147,0) 62%, rgba(84,109,147,0.7) 78%, rgba(213,211,196,0.4) 88%, rgba(84,109,147,0) 100%)`,
  // Resplandor cálido de la luz solar en el espacio
  glow: `radial-gradient(circle, rgba(84,109,147,0.3) 0%, rgba(23,40,66,0.18) 50%, transparent 70%)`,
  // Casquete polar
  polarCap: `radial-gradient(ellipse at 50% 10%, ${EARTH_PALETTE.cloudIce} 0%, rgba(213,211,196,0.7) 45%, transparent 75%)`,
} as const
