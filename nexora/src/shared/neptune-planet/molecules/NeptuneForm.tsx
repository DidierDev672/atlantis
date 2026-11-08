import type { FormEvent, ReactNode } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faCompass } from '@fortawesome/free-solid-svg-icons'
import { NeptuneGlobe } from './NeptuneGlobe'
import { NEPTUNE_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface NeptuneFormProps {
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
  /** Campos o controles anidados (NeptuneInputField, NeptuneDropdownField, etc.). */
  children?: ReactNode
  /** Clases CSS adicionales para el formulario. */
  className?: string
}

/**
 * Molécula: Contenedor de Formulario Neptuniano con cabecera temática y botón de acción.
 *
 * Implementa la paleta de colores oficial:
 * - #212354 (Azul abisal profundo)
 * - #3E54E8 (Azul cobalto real)
 * - #3E66F9 (Azul celeste intenso)
 * - #6081FF (Azul eléctrico aciano)
 * - #89F3FF (Cian glacial luminoso)
 */
export function NeptuneForm({
  title = 'Formulario Neptuniano',
  description = 'Complete los campos obligatorios para procesar la información.',
  onSubmit,
  submitLabel = 'Guardar Registro',
  disabled = false,
  loading = false,
  fullWidth = true,
  children,
  className,
}: NeptuneFormProps) {
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
        background: `radial-gradient(circle at 92% 12%, rgba(62,102,249,0.06) 0%, rgba(33,35,84,0.02) 40%, transparent 70%)`,
        boxShadow: `0 4px 24px -2px rgba(33,35,84,0.08)`,
      }}
    >
      {/* Borde superior celeste intenso */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${NEPTUNE_PALETTE.abyssalNavy} 0%, ${NEPTUNE_PALETTE.azureVivid} 50%, ${NEPTUNE_PALETTE.luminousCyan} 100%)`,
        }}
      />

      {/* Cabecera temática con Neptuno */}
      <div className="flex items-center gap-4 border-b border-line pb-4 mb-6">
        <NeptuneGlobe size="small" animated />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-bold tracking-tight font-sans truncate"
              style={{ color: NEPTUNE_PALETTE.abyssalNavy }}
            >
              {title}
            </h3>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${NEPTUNE_PALETTE.azureVivid}22`,
                color: NEPTUNE_PALETTE.azureVivid,
              }}
            >
              <FontAwesomeIcon icon={faCompass} className="size-2.5" />
              Neptunian Core
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
            background: `linear-gradient(135deg, ${NEPTUNE_PALETTE.azureVivid} 0%, ${NEPTUNE_PALETTE.abyssalNavy} 100%)`,
            boxShadow: `0 2px 10px -1px ${NEPTUNE_PALETTE.azureVivid}55`,
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

