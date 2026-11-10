import type { ReactNode } from 'react'

/**
 * Variantes de alerta soportadas y sus planetas asociados:
 * - success -> Tierra
 * - warning -> Júpiter
 * - info    -> Neptuno
 * - danger  -> Marte (también acepta 'error')
 */
export type AlertVariant = 'success' | 'warning' | 'info' | 'danger' | 'error'

/**
 * Planetas disponibles en Nexora
 */
export type AlertPlanet = 'earth' | 'jupiter' | 'neptune' | 'mars'

/**
 * Tamaño del componente Alert
 */
export type AlertSize = 'small' | 'medium' | 'large'

/**
 * Estructura normalizada de un error de endpoint/API
 */
export interface ParsedApiError {
  /** Título sugerido para el error */
  title: string
  /** Mensaje principal del error */
  message: string
  /** Lista detallada de sub-errores o validaciones de campos */
  details: string[]
  /** Código de estado HTTP si está presente (ej. 400, 422, 500) */
  statusCode?: number
  /** Código interno o tipo de error devuelto por la API */
  errorCode?: string
}

/**
 * Propiedades del componente atómico / organismo PlanetAlert
 */
export interface PlanetAlertProps {
  /** Variante del estado: success (Tierra), warning (Júpiter), info (Neptuno), danger/error (Marte) */
  variant?: AlertVariant
  /** Permite forzar un planeta específico independiente de la variante */
  planet?: AlertPlanet
  /** Título principal de la alerta */
  title?: ReactNode
  /** Mensaje o descripción de la alerta (compatible con textos cortos, medianos o largos) */
  message?: ReactNode
  /** Contenido libre anidado (children) */
  children?: ReactNode
  /** Error crudo o parseado proveniente de una llamada a endpoints (AxiosError, Error, string, objeto 422, etc.) */
  error?: unknown
  /** Lista explícita de errores o advertencias para mostrar */
  errors?: string[] | Record<string, string | string[]>
  /** Mostrar u ocultar el avatar/globo interactivo del planeta @default true */
  showPlanet?: boolean
  /** Tamaño del avatar planetario en píxeles @default 32 */
  planetSizePx?: number
  /** Mostrar la insignia con el nombre del planeta y tipo @default true */
  showBadge?: boolean
  /** Mostrar la línea superior/lateral con el resplandor de gradiente del planeta @default true */
  showGlowLine?: boolean
  /** Mostrar botón para descartar/cerrar la alerta */
  dismissible?: boolean
  /** Callback ejecutado al cerrar la alerta */
  onClose?: () => void
  /** Acciones adicionales (botones de reintentar, copiar, etc.) */
  actions?: ReactNode
  /** Si el contenido es largo, permitir colapsar/expandir los detalles @default true */
  collapsibleDetails?: boolean
  /** Estado inicial de los detalles expandidos @default false */
  defaultExpanded?: boolean
  /** Clase CSS adicional para el contenedor */
  className?: string
  /** Rol accesible ARIA @default 'alert' */
  role?: 'alert' | 'status'
}
