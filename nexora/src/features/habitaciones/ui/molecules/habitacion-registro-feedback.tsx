import { memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
import type { RoomTariffFeedback } from '../../domain/room-tariff'
import { Button } from '../atoms/button'
import { HabitacionPlanetAlert } from '../atoms/habitacion-planet-alert'
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
        <p role="status" className="text-sm font-medium text-ink">
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
    onReset,
  }: {
    numero: string
    tarifaNombre?: string
    tarifaFeedback?: RoomTariffFeedback | null
    successMessage?: string | null
    onReset: () => void
  }) {
    const hasTariffError = tarifaFeedback?.type === 'error'

    return (
      <div className="space-y-6">
        <HabitacionPlanetAlert
          variant="success"
          planet="earth"
          role="status"
          autoHideDurationMs={hasTariffError ? undefined : 2000}
          onAutoHide={hasTariffError ? undefined : onReset}
          title={`¡La habitación ${numero} ya tiene casa!`}
          message={`Quedó registrada con su piso, su edificio, su tipo${
            tarifaNombre ? `, su tarifa «${tarifaNombre}»` : ''
          } y su estado. A partir de ahora puedes encontrarla y gestionarla cuando quieras.`}
          actions={
            <Button type="button" variant="secondary" onClick={onReset}>
              Registrar otra habitación
            </Button>
          }
        />

        <AnimatePresence mode="wait">
          {hasTariffError && tarifaFeedback ? (
            <TarifaFeedbackBanner feedback={tarifaFeedback} />
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)
