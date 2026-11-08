import type { ReactNode, ChangeEvent } from 'react'

export type MarsDataType = 'text' | 'number' | 'date'

export type MarsVariant =
  | 'input'
  | 'textarea'
  | 'date-picker'
  | 'dashboard'
  | 'form'
  | 'badge'
  | 'planet'
  | 'icon'

export type MarsPlanetSize = 'tiny' | 'small' | 'medium' | 'large' | 'hero'

export const MARS_SIZE_PX: Record<MarsPlanetSize, number> = {
  tiny: 36,
  small: 60,
  medium: 100,
  large: 150,
  hero: 210,
}

export interface MarsPlanetProps {
  /**
   * Tamaño personalizado en píxeles (anula el valor estándar de size).
   */
  customPx?: number
  /**
   * Tipo de dato admitido:
   * - 'text': Para cadenas alfanuméricas, nombres, descripciones
   * - 'number': Para cantidades, montos, métricas numéricas
   * - 'date': Para fechas, calendarios y fechas de estadía
   */
  dataType?: MarsDataType

  /**
   * Variante de presentación visual y funcional del componente:
   * - 'input': Campo de entrada en línea con Marte como ícono/indicador interactivo
   * - 'textarea': Área multilínea con atmósfera marciana y contador
   * - 'date-picker': Selector de fecha sincronizado con el ciclo de Marte
   * - 'dashboard': Widget métrico tipo KPI con el planeta animado y estadísticas
   * - 'form': Tarjeta contenedora de formulario con temática marciana
   */
  variant?: MarsVariant

  /**
   * Tamaño del planeta en píxeles o escala semántica.
   * @default 'medium'
   */
  size?: MarsPlanetSize

  /**
   * Etiqueta descriptiva del campo o widget.
   */
  label?: string

  /**
   * Subtítulo o descripción psicológica de ayuda.
   */
  helperText?: string

  /**
   * Mensaje de error para estados de validación fallidos.
   */
  error?: string

  /**
   * Valor actual del campo (soporta string, number o fecha en formato YYYY-MM-DD).
   */
  value?: string | number

  /**
   * Valor por defecto no controlado.
   */
  defaultValue?: string | number

  /**
   * Callback invocado al modificar el valor del campo.
   */
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void

  /**
   * Callback directo con el valor tipado.
   */
  onValueChange?: (val: string | number) => void

  /**
   * Placeholder del campo de entrada.
   */
  placeholder?: string

  /**
   * Habilita animaciones continuas de rotación, polvo y respiración atmosférica.
   * @default true
   */
  animated?: boolean

  /**
   * Si es true, el campo es de solo lectura o desactivado.
   */
  disabled?: boolean

  /**
   * Si es true, el campo es obligatorio.
   */
  required?: boolean

  /**
   * Filas iniciales cuando se usa variant="textarea".
   * @default 4
   */
  rows?: number

  /**
   * Si es true, ocupa el 100% del contenedor.
   * @default true
   */
  fullWidth?: boolean

  /**
   * Datos adicionales para la variante 'dashboard' (ej. tendencia, unidad, subtítulo).
   */
  dashboardMeta?: {
    unit?: string
    trend?: {
      direction: 'up' | 'down' | 'neutral'
      label: string
    }
    badge?: string
  }

  /**
   * Elementos hijos personalizados (ideal para la variante 'form' o contenido superpuesto).
   */
  children?: ReactNode

  /**
   * Clases CSS adicionales para el contenedor principal.
   */
  className?: string

  /**
   * Clases CSS adicionales para el input/textarea.
   */
  inputClassName?: string
}
