import { EARTH_PALETTE } from '../../earth-planet'
import { JUPITER_PALETTE } from '../../jupiter-planet'
import { NEPTUNE_PALETTE } from '../../neptune-planet'
import { MARS_PALETTE } from '../../mars-planet'
import type { AlertPlanet, AlertVariant } from './types'

export interface PlanetThemeColors {
  planet: AlertPlanet
  planetName: string
  label: string
  // Colores principales
  border: string
  borderHover: string
  bgLight: string
  bgDark: string
  glowGradient: string
  // Tipografía
  titleLight: string
  titleDark: string
  textLight: string
  textDark: string
  subtextLight: string
  subtextDark: string
  // Badge
  badgeBg: string
  badgeText: string
  badgeBorder: string
  // Icono
  iconColor: string
  iconBg: string
  // Caja de detalles / errores
  detailsBgLight: string
  detailsBgDark: string
  detailsBorder: string
}

/**
 * Mapeo de variantes de alerta a sus respectivos planetas
 */
export const VARIANT_TO_PLANET: Record<AlertVariant, AlertPlanet> = {
  success: 'earth',
  warning: 'jupiter',
  info: 'neptune',
  danger: 'mars',
  error: 'mars',
}

/**
 * Temas visuales completos para cada planeta según la paleta oficial
 */
export const PLANET_ALERT_THEMES: Record<AlertPlanet, PlanetThemeColors> = {
  // Success -> Tierra (Océanos someros, azul profundo, continentes y atmósfera)
  earth: {
    planet: 'earth',
    planetName: 'Tierra',
    label: 'Éxito',
    border: 'rgba(84, 109, 147, 0.45)',
    borderHover: 'rgba(213, 211, 196, 0.6)',
    bgLight: 'radial-gradient(ellipse at 12% 18%, rgba(84, 109, 147, 0.12) 0%, rgba(23, 40, 66, 0.04) 55%, rgba(255, 255, 255, 0.98) 100%)',
    bgDark: 'radial-gradient(ellipse at 12% 18%, rgba(84, 109, 147, 0.22) 0%, rgba(23, 40, 66, 0.78) 55%, rgba(15, 22, 29, 0.95) 100%)',
    glowGradient: `linear-gradient(90deg, ${EARTH_PALETTE.oceanShallow} 0%, ${EARTH_PALETTE.cloudIce} 50%, ${EARTH_PALETTE.continent} 100%)`,
    titleLight: '#172842',
    titleDark: '#E4EAF4',
    textLight: '#263852',
    textDark: '#D5D3C4',
    subtextLight: '#475C7A',
    subtextDark: '#978C67',
    badgeBg: 'rgba(84, 109, 147, 0.18)',
    badgeText: '#546D93',
    badgeBorder: 'rgba(84, 109, 147, 0.35)',
    iconColor: '#546D93',
    iconBg: 'rgba(84, 109, 147, 0.16)',
    detailsBgLight: 'rgba(84, 109, 147, 0.08)',
    detailsBgDark: 'rgba(15, 22, 29, 0.65)',
    detailsBorder: 'rgba(84, 109, 147, 0.25)',
  },

  // Warning -> Júpiter (Ámbar dorado radiante, terracota de la Gran Mancha Roja, crema amoniacal)
  jupiter: {
    planet: 'jupiter',
    planetName: 'Júpiter',
    label: 'Advertencia',
    border: 'rgba(254, 172, 77, 0.45)',
    borderHover: 'rgba(210, 111, 55, 0.6)',
    bgLight: 'radial-gradient(ellipse at 12% 18%, rgba(254, 172, 77, 0.14) 0%, rgba(130, 97, 77, 0.05) 55%, rgba(255, 255, 255, 0.98) 100%)',
    bgDark: 'radial-gradient(ellipse at 12% 18%, rgba(254, 172, 77, 0.2) 0%, rgba(130, 97, 77, 0.7) 55%, rgba(25, 18, 14, 0.95) 100%)',
    glowGradient: `linear-gradient(90deg, ${JUPITER_PALETTE.amberGold} 0%, ${JUPITER_PALETTE.lightCream} 50%, ${JUPITER_PALETTE.terracotta} 100%)`,
    titleLight: '#82614D',
    titleDark: '#FFEBD4',
    textLight: '#5C4435',
    textDark: '#F7E7D4',
    subtextLight: '#8B7A62',
    subtextDark: '#D3C7AF',
    badgeBg: 'rgba(254, 172, 77, 0.2)',
    badgeText: '#D26F37',
    badgeBorder: 'rgba(254, 172, 77, 0.4)',
    iconColor: '#FEAC4D',
    iconBg: 'rgba(254, 172, 77, 0.18)',
    detailsBgLight: 'rgba(254, 172, 77, 0.08)',
    detailsBgDark: 'rgba(25, 18, 14, 0.65)',
    detailsBorder: 'rgba(254, 172, 77, 0.3)',
  },

  // Info -> Neptuno (Azul celeste intenso, azul eléctrico aciano, cian glacial)
  neptune: {
    planet: 'neptune',
    planetName: 'Neptuno',
    label: 'Información',
    border: 'rgba(62, 102, 249, 0.45)',
    borderHover: 'rgba(137, 243, 255, 0.6)',
    bgLight: 'radial-gradient(ellipse at 12% 18%, rgba(96, 129, 255, 0.12) 0%, rgba(33, 35, 84, 0.05) 55%, rgba(255, 255, 255, 0.98) 100%)',
    bgDark: 'radial-gradient(ellipse at 12% 18%, rgba(96, 129, 255, 0.22) 0%, rgba(33, 35, 84, 0.78) 55%, rgba(12, 14, 34, 0.95) 100%)',
    glowGradient: `linear-gradient(90deg, ${NEPTUNE_PALETTE.azureVivid} 0%, ${NEPTUNE_PALETTE.luminousCyan} 50%, ${NEPTUNE_PALETTE.electricBlue} 100%)`,
    titleLight: '#212354',
    titleDark: '#EBF3FF',
    textLight: '#1C2E63',
    textDark: '#D8E8FF',
    subtextLight: '#3E54E8',
    subtextDark: '#89F3FF',
    badgeBg: 'rgba(62, 102, 249, 0.18)',
    badgeText: '#3E66F9',
    badgeBorder: 'rgba(62, 102, 249, 0.35)',
    iconColor: '#3E66F9',
    iconBg: 'rgba(62, 102, 249, 0.16)',
    detailsBgLight: 'rgba(62, 102, 249, 0.08)',
    detailsBgDark: 'rgba(12, 14, 34, 0.65)',
    detailsBorder: 'rgba(62, 102, 249, 0.3)',
  },

  // Danger/Error -> Marte (Carmesí profundo, óxido anaranjado, arena clara marciana)
  mars: {
    planet: 'mars',
    planetName: 'Marte',
    label: 'Error',
    border: 'rgba(242, 147, 92, 0.45)',
    borderHover: 'rgba(159, 42, 42, 0.65)',
    bgLight: 'radial-gradient(ellipse at 12% 18%, rgba(242, 147, 92, 0.14) 0%, rgba(115, 36, 42, 0.05) 55%, rgba(255, 255, 255, 0.98) 100%)',
    bgDark: 'radial-gradient(ellipse at 12% 18%, rgba(242, 147, 92, 0.2) 0%, rgba(115, 36, 42, 0.8) 55%, rgba(24, 10, 12, 0.95) 100%)',
    glowGradient: `linear-gradient(90deg, ${MARS_PALETTE.rust} 0%, ${MARS_PALETTE.sand} 50%, ${MARS_PALETTE.crimson} 100%)`,
    titleLight: '#73242A',
    titleDark: '#FFEAE8',
    textLight: '#611B20',
    textDark: '#FFD9D6',
    subtextLight: '#966941',
    subtextDark: '#F2935C',
    badgeBg: 'rgba(242, 147, 92, 0.2)',
    badgeText: '#9F2A2A',
    badgeBorder: 'rgba(242, 147, 92, 0.4)',
    iconColor: '#F2935C',
    iconBg: 'rgba(242, 147, 92, 0.18)',
    detailsBgLight: 'rgba(242, 147, 92, 0.08)',
    detailsBgDark: 'rgba(24, 10, 12, 0.65)',
    detailsBorder: 'rgba(242, 147, 92, 0.3)',
  },
}

/**
 * Obtiene el tema planetario según la variante o planeta indicado
 */
export function getPlanetTheme(variant: AlertVariant = 'info', explicitPlanet?: AlertPlanet): PlanetThemeColors {
  const planet = explicitPlanet ?? VARIANT_TO_PLANET[variant] ?? 'neptune'
  return PLANET_ALERT_THEMES[planet]
}
