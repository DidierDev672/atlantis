import { Suspense, lazy, memo, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { RocketProps } from '../../../../shared/rocket/types'

const LazyRocket = lazy<ComponentType<RocketProps>>(async () => {
  try {
    const mod = await import('../../../../shared/rocket/organisms/Rocket')
    return { default: mod.Rocket }
  } catch (error) {
    console.error('Error cargando Rocket:', error)
    const Fallback: ComponentType<RocketProps> = () => null
    return { default: Fallback }
  }
})

export interface CuentaCheckoutRocketOverlayProps {
  visible: boolean
  guestName: string
}

/**
 * Molécula: Overlay perezoso con `Rocket` mientras se construye el payload
 * y se envía a `POST /stay/{stay_id}/checkout`.
 */
export const CuentaCheckoutRocketOverlay = memo(
  function CuentaCheckoutRocketOverlay({
    visible,
    guestName,
  }: CuentaCheckoutRocketOverlayProps) {
    const {
      policy: { enableBackdropBlur, enableAnimations, tier },
    } = useDeviceResourceProfile()

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            role="status"
            aria-live="polite"
            className={`fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
            initial={enableAnimations ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={enableAnimations ? { opacity: 0 } : undefined}
          >
            <motion.div
              initial={
                enableAnimations ? { opacity: 0, scale: 0.95, y: 12 } : false
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                enableAnimations
                  ? { opacity: 0, scale: 0.95, y: 12 }
                  : undefined
              }
              className="bg-panel border-line flex w-full max-w-sm flex-col items-center rounded-3xl border p-8 text-center shadow-2xl"
            >
              <Suspense
                fallback={
                  <div className="bg-line/35 size-24 rounded-2xl" />
                }
              >
                <LazyRocket
                  size="md"
                  autoLaunch={enableAnimations}
                  loop={tier === 'full'}
                  showStars={tier === 'full'}
                  interactive={false}
                  timing={{ ignitionMs: 550, ascentMs: 1300 }}
                  className="ring-primary/20 bg-canvas/60 shadow-xl ring-1"
                />
              </Suspense>

              <div className="mt-5 space-y-1.5">
                <h4 className="text-ink text-lg font-bold">
                  Procesando pago y check-out…
                </h4>
                <p className="text-ink-muted text-xs leading-relaxed">
                  Preparando la liquidación de{' '}
                  <span className="text-ink font-semibold">{guestName}</span> y
                  registrando la salida de forma segura.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
