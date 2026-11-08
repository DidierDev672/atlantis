import type { FormEvent, ReactNode } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faCompass } from '@fortawesome/free-solid-svg-icons'
import { UranusGlobe } from './UranusGlobe'
import { URANUS_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface UranusFormProps {
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
  /** Campos o controles anidados (UranusInputField, UranusDropdownField, etc.). */
  children?: ReactNode
  /** Clases CSS adicionales para el formulario. */
  className?: string
}

/**
 * Molécula: Contenedor de Formulario Uraniano con cabecera temática y botón de acción.
 *
 * Implementa la paleta de colores oficial:
 * - #355B6D (Cian petróleo profundo)
 * - #218193 (Cian brillante metánico)
 * - #79A4A9 (Aguamarina glacial)
 * - #A5BEBD (Hielo cian suave)
 * - #D1D9CE (Menta escarchada)
 * - #EAECDF (Crema glacial pálido)
 * - #D0C1AC (Arena mineral)
 * - #384555 (Azul pizarra profundo)
 */
export function UranusForm({
  title = 'Formulario Uraniano',
  description = 'Complete los campos obligatorios para procesar la información.',
  onSubmit,
  submitLabel = 'Guardar Registro',
  disabled = false,
  loading = false,
  fullWidth = true,
  children,
  className,
}: UranusFormProps) {
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
        background: `radial-gradient(circle at 92% 12%, rgba(33,129,147,0.06) 0%, rgba(53,91,109,0.02) 40%, transparent 70%)`,
        boxShadow: `0 4px 24px -2px rgba(53,91,109,0.08)`,
      }}
    >
      {/* Borde superior áureo-cian */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${URANUS_PALETTE.slateNavy} 0%, ${URANUS_PALETTE.cyanBlue} 50%, ${URANUS_PALETTE.glacialAqua} 100%)`,
        }}
      />

      {/* Cabecera temática con Urano y sus anillos verticales */}
      <div className="flex items-center gap-4 border-b border-line pb-4 mb-6">
        <UranusGlobe size="small" animated />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-bold tracking-tight font-sans truncate"
              style={{ color: URANUS_PALETTE.slateNavy }}
            >
              {title}
            </h3>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${URANUS_PALETTE.cyanBlue}22`,
                color: URANUS_PALETTE.slateNavy,
              }}
            >
              <FontAwesomeIcon icon={faCompass} className="size-2.5" />
              Uranian Core
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
            background: `linear-gradient(135deg, ${URANUS_PALETTE.cyanBlue} 0%, ${URANUS_PALETTE.deepTeal} 100%)`,
            boxShadow: `0 2px 10px -1px ${URANUS_PALETTE.cyanBlue}55`,
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

