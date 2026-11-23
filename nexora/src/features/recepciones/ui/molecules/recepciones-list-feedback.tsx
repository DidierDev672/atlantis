import { memo } from 'react'
import { motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
import type { StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator'

export interface RecepcionesValidationBannerProps {
  validationResult: StatusCodeValidationResult | null
  isDemoFallback: boolean
  onReload: () => void
}

export const RecepcionesValidationBanner = memo(
  function RecepcionesValidationBanner({
    validationResult,
    isDemoFallback,
    onReload,
  }: RecepcionesValidationBannerProps) {
    const hasValidationError = Boolean(
      validationResult && !validationResult.isValid
    )

    if (hasValidationError && validationResult) {
      return (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          role="alert"
          className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-900 shadow-xs sm:flex-row sm:items-center dark:text-amber-200"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-700 sm:mt-0 dark:text-amber-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <div>
              <h4 className="text-sm font-bold">
                {validationResult.title || 'Aviso del servicio de recepciones'} (Código HTTP{' '}
                {validationResult.status})
              </h4>
              <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                {validationResult.message ||
                  'La consulta se completó con un código no estándar.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReload}
            className="shrink-0 cursor-pointer rounded-xl bg-amber-600/20 px-3.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-600/30 dark:text-amber-200"
          >
            Reintentar consulta
          </button>
        </motion.div>
      )
    }

    if (isDemoFallback) {
      return (
        <div className="border-line bg-canvas text-ink-muted flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs">
          <span className="flex items-center gap-2">
            <span className="bg-primary/60 size-2 rounded-full" />
            Mostrando datos estructurados
          </span>
          <button
            type="button"
            onClick={onReload}
            className="text-primary cursor-pointer font-semibold hover:underline"
          >
            Actualizar ahora
          </button>
        </div>
      )
    }

    return null
  }
)

export interface RecepcionesEmptyStateProps {
  searchQuery: string
  onClearFilters: () => void
}

export const RecepcionesEmptyState = memo(function RecepcionesEmptyState({
  searchQuery,
  onClearFilters,
}: RecepcionesEmptyStateProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="border-line bg-panel/60 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center"
    >
      <span className="bg-primary/10 text-primary mb-3 grid size-14 place-items-center rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </span>
      <h3 className="text-ink text-base font-bold">
        Sin recepciones que coincidan
      </h3>
      <p className="text-ink-muted mt-1 max-w-sm text-xs">
        {searchQuery
          ? `No encontramos estancias con el término "${searchQuery}". Prueba ajustando tus filtros.`
          : 'Aún no se registran estancias en este momento.'}
      </p>
      {searchQuery && (
        <button
          type="button"
          onClick={onClearFilters}
          className="border-line bg-canvas text-primary hover:bg-line/40 mt-4 cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition"
        >
          Limpiar filtros
        </button>
      )}
    </motion.div>
  )
})
