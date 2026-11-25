import { memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
import type { RoomTariffFeedback } from '../../domain/room-tariff'
import { Button } from '../atoms/button'
import { TarifaFeedbackBanner } from './tarifa-feedback-banner'

export const HabitacionCatalogLoadBanner = memo(
  function HabitacionCatalogLoadBanner({
    message,
    loading,
    onRetry,
  }: {
    message: string
    loading: boolean
    onRetry: () => void
  }) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p role="status" className="text-sm font-medium text-black">
          {message}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={onRetry}
          disabled={loading}
        >
          Reintentar
        </Button>
      </motion.div>
    )
  }
)

export const HabitacionRegistroSuccess = memo(
  function HabitacionRegistroSuccess({
    numero,
    tarifaNombre,
    tarifaFeedback,
    successMessage,
    onReset,
  }: {
    numero: string
    tarifaNombre?: string
    tarifaFeedback?: RoomTariffFeedback | null
    successMessage?: string | null
    onReset: () => void
  }) {
    return (
      <div className="space-y-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-12 text-center"
        >
          <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-7"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </span>
          <div className="space-y-1">
            <h3 className="text-ink text-xl font-bold">
              ¡La habitación {numero} ya tiene casa!
            </h3>
            {successMessage ? (
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {successMessage}
              </p>
            ) : null}
            <p className="text-ink-muted text-sm leading-relaxed">
              Quedó registrada con su piso, su edificio, su tipo
              {tarifaNombre ? `, su tarifa «${tarifaNombre}»` : ''} y su estado.
              A partir de ahora puedes encontrarla y gestionarla cuando quieras.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onReset}>
            Registrar otra habitación
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {tarifaFeedback ? (
            <TarifaFeedbackBanner feedback={tarifaFeedback} />
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)
