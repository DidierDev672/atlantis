import type { FormEvent, ReactNode } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faCompass } from '@fortawesome/free-solid-svg-icons'
import { PlutoGlobe } from './PlutoGlobe'
import { PLUTO_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface PlutoFormProps {
  /** Título principal del formulario. */
  title?: string
  /** Descripción o instrucciones para el usuario. */
  description?: string
  /** Callback invocado al enviar el formulario. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  /** Texto del botón principal de envío. @default 'Guardar Registro' */
  submitLabel?: string
  /** Deshabilita el botón de envío y formulario. */
  disabled?: boolean
  /** Muestra estado de carga en el botón de envío. */
  loading?: boolean
  /** Si es true, ocupa el 100% del contenedor padre. @default true */
  fullWidth?: boolean
  /** Campos o controles anidados (PlutoInputField, PlutoDropdownField, etc.). */
  children?: ReactNode
  /** Clases CSS adicionales para el formulario. */
  className?: string
}

/**
 * Molécula: Contenedor de Formulario Plutoniano con cabecera temática y botón de acción.
 *
 * Implementa la paleta de colores oficial:
 * - #594588 (Púrpura místico de Plutón)
 * - #2E1C48 (Violeta profundo de Kuiper)
 * - #3A4481 (Índigo de neblina atmosférica)
 * - #E8D7B7 (Arena de nitrógeno pálido)
 * - #F1F0D7 (Glaciar Corazón luminoso)
 * - #403C34 (Marrón sombra de tolinas)
 */
export function PlutoForm({
  title = 'Formulario Plutoniano',
  description = 'Complete los campos obligatorios para procesar la información.',
  onSubmit,
  submitLabel = 'Guardar Registro',
  disabled = false,
  loading = false,
  fullWidth = true,
  children,
  className,
}: PlutoFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!disabled && !loading) {
      onSubmit?.(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-panel p-6 shadow-sm transition-all duration-300',
        'border-line hover:border-ink-soft/40',
        fullWidth ? 'w-full' : 'max-w-xl',
        className
      )}
      style={{
        background: `radial-gradient(circle at 92% 12%, rgba(89,69,136,0.06) 0%, rgba(46,28,72,0.02) 40%, transparent 70%)`,
        boxShadow: `0 4px 24px -2px rgba(46,28,72,0.08)`,
      }}
    >
      {/* Borde superior púrpura místico */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${PLUTO_PALETTE.kuiperViolet} 0%, ${PLUTO_PALETTE.mysticPurple} 50%, ${PLUTO_PALETTE.nitrogenSand} 100%)`,
        }}
      />

      {/* Cabecera temática con Plutón y su corazón glaciar */}
      <div className="flex items-center gap-4 border-b border-line pb-4 mb-6">
        <PlutoGlobe size="small" animated />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-bold tracking-tight font-sans truncate"
              style={{ color: PLUTO_PALETTE.kuiperViolet }}
            >
              {title}
            </h3>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${PLUTO_PALETTE.mysticPurple}22`,
                color: PLUTO_PALETTE.mysticPurple,
              }}
            >
              <FontAwesomeIcon icon={faCompass} className="size-2.5" />
              Kuiper Core
            </span>
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Campos de entrada y controles */}
      <div className="space-y-4">{children}</div>

      {/* Pie de acción con botón temático */}
      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-line/60">
        <motion.button
          type="submit"
          disabled={disabled || loading}
          whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
          whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 outline-none',
            disabled || loading
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:shadow-md'
          )}
          style={{
            background: `linear-gradient(135deg, ${PLUTO_PALETTE.mysticPurple} 0%, ${PLUTO_PALETTE.kuiperViolet} 100%)`,
            boxShadow: `0 2px 10px -1px ${PLUTO_PALETTE.mysticPurple}55`,
          }}
        >
          <FontAwesomeIcon
            icon={faCheck}
            className={cn('size-3.5', loading && 'animate-spin')}
          />
          <span>{loading ? 'Procesando…' : submitLabel}</span>
        </motion.button>
      </div>
    </form>
  )
}

