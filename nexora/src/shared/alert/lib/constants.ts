import {
  faCircleCheck,
  faTriangleExclamation,
  faCircleInfo,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { AlertPlanet, AlertVariant } from './types'

export const PLANET_ICONS: Record<AlertPlanet, IconDefinition> = {
  earth: faCircleCheck,
  jupiter: faTriangleExclamation,
  neptune: faCircleInfo,
  mars: faCircleExclamation,
}

export const VARIANT_DEFAULT_TITLES: Record<AlertVariant, string> = {
  success: 'Operación exitosa',
  warning: 'Advertencia del sistema',
  info: 'Información relevante',
  danger: 'Error detectado',
  error: 'Error detectado',
}

export const PLANET_DESCRIPTIONS: Record<AlertPlanet, string> = {
  earth: 'Planeta Tierra • Atmósfera y Océanos Estables',
  jupiter: 'Planeta Júpiter • Tormentas y Vórtices Jovianos',
  neptune: 'Planeta Neptuno • Vientos y Atmósfera Criogénica',
  mars: 'Planeta Marte • Terreno Volcánico y Carmesí',
}
