import type { ReactNode, ChangeEvent, FormEvent } from 'react'

export type SaturnDataType = 'text' | 'number' | 'date'

export type SaturnVariant =
  | 'input'
  | 'dropdown'
  | 'date-picker'
  | 'card'
  | 'form'
  | 'planet'
  | 'badge'
  | 'icon'

export type SaturnPlanetSize = 'tiny' | 'small' | 'medium' | 'large' | 'hero'

export const SATURN_SIZE_PX: Record<SaturnPlanetSize, number> = {
  tiny: 36,
  small: 60,
  medium: 100,
  large: 150,
  hero: 220,
}

export interface SaturnDropdownOption {
  value: string
  label: string
  icon?: string
  description?: string
  disabled?: boolean
}

export interface SaturnCardMeta {
  metric?: string | number
  unit?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  badge?: string
}

export interface SaturnPlanetProps {
  /** Tamaño personalizado en píxeles (anula el valor estándar de size). */
  customPx?: number

  /**
   * Tipo de dato admitido:
   * - 'text': Para cadenas alfanuméricas, nombres, descripciones
   * - 'number': Para cantidades, montos, métricas numéricas
   * - 'date': Para fechas, calendarios y fechas de estadía
   */
  dataType?: SaturnDataType

  /**
   * Variante de presentación visual y funcional del componente:
   * - 'input': Campo de entrada con el planeta Saturno y sus anillos reactivos
   * - 'dropdown': Selector desplegable temático con opciones saturnianas y FontAwesome
   * - 'date-picker': Selector de fecha interactivo con calendario flotante
   * - 'card': Tarjeta contenedora / Dashboard card con Saturno integrado
   * - 'form': Tarjeta contenedora de formulario con cabecera y atmósfera saturniana
   * - 'planet' | 'icon' | 'badge': Globo del planeta con anillos o insignia independiente
   */
  variant?: SaturnVariant

  /** Tamaño del planeta en píxeles o escala semántica. @default 'medium' */
  size?: SaturnPlanetSize

  /** Etiqueta descriptiva del campo, selector o tarjeta. */
  label?: string

  /** Subtítulo o descripción de ayuda. */
  helperText?: string

  /** Mensaje de error para estados de validación fallidos. */
  error?: string

  /** Valor actual del campo (soporta string, number o fecha en formato YYYY-MM-DD). */
  value?: string | number

  /** Valor por defecto no controlado. */
  defaultValue?: string | number

  /** Callback invocado al modificar el valor del input o selector. */
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void

  /** Callback directo con el valor tipado. */
  onValueChange?: (val: string | number) => void

  /** Placeholder del campo de entrada o selector. */
  placeholder?: string

  /** Habilita animaciones continuas de bandas, rotación e inclinación orbital. @default true */
  animated?: boolean

  /** Si es true, el componente está desactivado. */
  disabled?: boolean

  /** Si es true, el campo es obligatorio. */
  required?: boolean

  /** Si es true, ocupa el 100% del contenedor padre. @default true */
  fullWidth?: boolean

  /** Opciones para la variante 'dropdown'. */
  options?: SaturnDropdownOption[]

  /** Callback para la variante 'form' al enviar el formulario. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void

  /** Texto del botón de acción en 'form' o 'card'. */
  submitLabel?: string

  /** Metadatos para la variante 'card' (métrica, tendencia, badge). */
  cardMeta?: SaturnCardMeta

  /** Título principal de la tarjeta o cabecera de formulario. */
  title?: string

  /** Descripción o texto secundario en 'card' o 'form'. */
  description?: string

  /** Elementos hijos personalizados (ideal para 'card', 'form' o contenido superpuesto). */
  children?: ReactNode

  /** Clases CSS adicionales para el contenedor principal. */
  className?: string

  /** Clases CSS adicionales para el control de entrada. */
  inputClassName?: string
}

