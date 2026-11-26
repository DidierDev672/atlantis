import { Suspense, lazy, memo, type ComponentType } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRocket } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { RocketProps } from '../../../../shared/rocket/types'
import { HabitacionesErrorBoundary } from '../molecules/habitaciones-error-boundary'

const LazyRocket = lazy<ComponentType<RocketProps>>(async () => {
  try {
    const mod = await import('../../../../shared/rocket/organisms/Rocket')
    return { default: mod.Rocket }
  } catch (err) {
    console.error('Error al cargar Rocket:', err)
    const Fallback: ComponentType<RocketProps> = () => null
    return { default: Fallback }
  }
})

export interface HabitacionRegistroRocketOverlayProps {
  visible: boolean
  roomNumber: string
  hasTarifa?: boolean
}

/**
 * Organismo: Overlay adaptativo de guardado con Rocket en `full`/`balanced`
 * o ícono estático ligero en `ultra-light`/sin animaciones ni doble blur.
 */
export const HabitacionRegistroRocketOverlay = memo(
  function HabitacionRegistroRocketOverlay({
    visible,
    roomNumber,
    hasTarifa = false,
  }: HabitacionRegistroRocketOverlayProps) {
    const { policy } = useDeviceResourceProfile()
    if (!visible && !policy.enableAnimations) return null

    const title = roomNumber
      ? `Registrando habitación ${roomNumber}`
      : 'Registrando habitación…'
    const subtitle = hasTarifa
      ? 'Guardando datos de la habitación y vinculando su tarifa en el sistema…'
      : 'Guardando datos de la habitación y preparando su lugar en el inventario…'

    const useLightMode = !policy.enableAnimations || policy.tier === 'ultra-light'
    const backdropClass = policy.enableBackdropBlur
      ? 'fixed inset-0 z-70 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs'
      : 'fixed inset-0 z-70 flex items-center justify-center bg-slate-950/80 p-4'

    const cardNode = (
      <div
        className={`border-line/70 bg-panel flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border p-6 text-center ${
          policy.enableBackdropBlur ? 'shadow-xl' : 'shadow-md'
        }`}
      >
        <HabitacionesErrorBoundary fallbackMessage={title}>
          {useLightMode ? (
            <span className="bg-primary/10 text-primary grid size-16 place-items-center rounded-2xl">
              <FontAwesomeIcon
                icon={faRocket}
                className="size-7"
                aria-hidden="true"
              />
            </span>
          ) : (
            <Suspense
              fallback={
                <div className="bg-line/40 size-36 rounded-2xl" />
              }
            >
              <LazyRocket
                loop
                size="lg"
                interactive={false}
                className="border-line/60 bg-canvas/85 border shadow-inner"
              />
            </Suspense>
          )}
        </HabitacionesErrorBoundary>

        <div className="space-y-1">
          <p className="text-ink text-sm font-bold">{title}</p>
          <p className="text-ink-muted text-xs leading-relaxed">{subtitle}</p>
        </div>
      </div>
    )

    if (!policy.enableAnimations) {
      return (
        <div role="status" aria-live="polite" className={backdropClass}>
          {cardNode}
        </div>
      )
    }

    return (
      <MotionConfig reducedMotion="user">
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
              className={backdropClass}
            >
              {cardNode}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </MotionConfig>
    )
  }
)

export default HabitacionRegistroRocketOverlay
