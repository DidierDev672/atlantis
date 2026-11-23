import { Suspense, lazy, memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HabitacionesErrorBoundary } from '../molecules/habitaciones-error-boundary'

const LazyRocket = lazy(() =>
  import('../../../../shared/rocket/organisms/Rocket').then((m) => ({
    default: m.Rocket,
  }))
)

export interface HabitacionRegistroRocketOverlayProps {
  visible: boolean
  roomNumber: string
  hasTarifa?: boolean
}

/**
 * Organismo: Overlay de lanzamiento con Rocket mientras se registra la habitación.
 */
export const HabitacionRegistroRocketOverlay = memo(
  function HabitacionRegistroRocketOverlay({
    visible,
    roomNumber,
    hasTarifa = false,
  }: HabitacionRegistroRocketOverlayProps) {
    const title = roomNumber
      ? `Registrando habitación ${roomNumber}`
      : 'Registrando habitación…'
    const subtitle = hasTarifa
      ? 'Guardando datos de la habitación y vinculando su tarifa en el sistema…'
      : 'Guardando datos de la habitación y preparando su lugar en el inventario…'

    return (
      <AnimatePresence>
        {visible ? (
          <motion.div
            key="habitacion-registro-rocket-overlay"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22 }}
              className="border-line/70 bg-panel/95 flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border p-6 text-center shadow-2xl"
            >
              <HabitacionesErrorBoundary fallbackMessage={title}>
                <Suspense
                  fallback={
                    <div className="bg-line/40 size-36 animate-pulse rounded-2xl" />
                  }
                >
                  <LazyRocket
                    loop
                    size="lg"
                    interactive={false}
                    className="border-line/60 bg-canvas/85 border shadow-inner"
                  />
                </Suspense>
              </HabitacionesErrorBoundary>

              <div className="space-y-1">
                <p className="text-ink text-sm font-bold">{title}</p>
                <p className="text-ink-muted text-xs leading-relaxed">
                  {subtitle}
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    )
  }
)

export default HabitacionRegistroRocketOverlay
