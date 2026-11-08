import type { FormEvent, ReactNode } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faRing } from '@fortawesome/free-solid-svg-icons'
import { SaturnGlobe } from './SaturnGlobe'
import { SATURN_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface SaturnFormProps {
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
  /** Campos o controles anidados (SaturnInputField, SaturnDropdownField, etc.). */
  children?: ReactNode
  /** Clases CSS adicionales para el formulario. */
  className?: string
}

/**
 * Molécula: Contenedor de Formulario Saturniano con cabecera anillada y botón de acción.
 *
 * Implementa la paleta de colores oficial:
 * - #6E6660 (Gris pardo cenizo)
 * - #D3C7AF (Crema amoniacal suave)
 * - #D9BD9F (Arena cálida saturniana)
 * - #4E493F (Marrón sombra profundo)
 * - #D29F37 (Ocre dorado saturniano)
 */
export function SaturnForm({
  title = 'Formulario Saturniano',
  description = 'Complete los campos obligatorios para procesar la información.',
  onSubmit,
  submitLabel = 'Guardar Registro',
  disabled = false,
  loading = false,
  fullWidth = true,
  children,
  className,
}: SaturnFormProps) {
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
        background: `radial-gradient(circle at 92% 12%, rgba(210,159,55,0.06) 0%, rgba(78,73,63,0.02) 40%, transparent 70%)`,
        boxShadow: `0 4px 24px -2px rgba(78,73,63,0.08)`,
      }}
    >
      {/* Borde superior áureo */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${SATURN_PALETTE.deepUmber} 0%, ${SATURN_PALETTE.goldenOchre} 50%, ${SATURN_PALETTE.warmSand} 100%)`,
        }}
      />

      {/* Cabecera temática con Saturno y sus anillos */}
      <div className="flex items-center gap-4 border-b border-line pb-4 mb-6">
        <SaturnGlobe size="small" animated />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-bold tracking-tight font-sans truncate"
              style={{ color: SATURN_PALETTE.deepUmber }}
            >
              {title}
            </h3>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${SATURN_PALETTE.goldenOchre}22`,
                color: SATURN_PALETTE.deepUmber,
              }}
            >
              <FontAwesomeIcon icon={faRing} className="size-2.5" />
              Saturn Core
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
            background: `linear-gradient(135deg, ${SATURN_PALETTE.goldenOchre} 0%, ${SATURN_PALETTE.deepUmber} 100%)`,
            boxShadow: `0 2px 10px -1px ${SATURN_PALETTE.goldenOchre}55`,
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

