import { Suspense, lazy, memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { PostStage } from '../../../../shared/loading'

const LazyRocket = lazy(() =>
  import('../../../../shared/rocket/organisms/Rocket').then((m) => ({
    default: m.Rocket,
  }))
)

export interface CobroRocketOverlayProps {
  visible: boolean
  stage: PostStage
}

/**
 * Molécula: Overlay perezoso con animación `Rocket` mientras se construye el payload
 * del folio (`GET /stay/reception/{room_id}`) y se transmite a `POST /folios`.
 */
export const CobroRocketOverlay = memo(function CobroRocketOverlay({
  visible,
  stage,
}: CobroRocketOverlayProps) {
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
              enableAnimations ? { opacity: 0, scale: 0.95, y: 12 } : undefined
            }
            className="bg-panel border-line flex w-full max-w-sm flex-col items-center rounded-3xl border p-8 text-center shadow-2xl"
          >
            <Suspense
              fallback={
                <div className="bg-line/35 size-24 animate-pulse rounded-2xl" />
              }
            >
              <LazyRocket
                size="md"
                autoLaunch={enableAnimations}
                loop={tier === 'full'}
                showStars={tier === 'full'}
                interactive={false}
                timing={{ ignitionMs: 600, ascentMs: 1400 }}
                className="ring-primary/20 bg-canvas/60 shadow-xl ring-1"
              />
            </Suspense>

            <div className="mt-5 space-y-1.5">
              <h4 className="text-ink text-lg font-bold">
                {stage === 'preparing'
                  ? 'Preparando folio de cobro…'
                  : stage === 'transmitting'
                    ? 'Registrando pago en /folios…'
                    : '¡Pago y folio confirmados!'}
              </h4>
              <p className="text-ink-muted text-xs leading-relaxed">
                Vinculando estadía y enviando el payload balanceado a POST
                /folios.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default CobroRocketOverlay
