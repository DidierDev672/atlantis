import { Suspense, memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRocket } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { RocketProps } from '../../../../shared/rocket/types'
import { lazyWithFallback } from '../../application/lazy-with-fallback'

const LazyRocket = lazyWithFallback<RocketProps>(
  () => import('../../../../shared/rocket/organisms/Rocket').then((m) => m.Rocket),
  'Rocket en ServicioHabitacionRocketOverlay',
)

export interface ServicioHabitacionRocketOverlayProps {
  visible: boolean
  title: string
  description: string
  zIndexClass?: string
}

/**
 * Molécula compartida: Overlay perezoso (`React.lazy` + `React.memo`) adaptado al
 * presupuesto de hardware (`useDeviceResourceProfile`). Evita doble `backdrop-blur`
 * y desactiva animaciones continuas en equipos de bajos recursos.
 */
export const ServicioHabitacionRocketOverlay = memo(
  function ServicioHabitacionRocketOverlay({
    visible,
    title,
    description,
    zIndexClass = 'z-60',
  }: ServicioHabitacionRocketOverlayProps) {
    const {
      policy: { enableBackdropBlur, enableAnimations, tier },
    } = useDeviceResourceProfile()

    const useLightweightBadge = !enableAnimations || tier === 'ultra-light'

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={enableAnimations ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={enableAnimations ? { opacity: 0 } : undefined}
            transition={{ duration: 0.22 }}
            className={`fixed inset-0 ${zIndexClass} flex flex-col items-center justify-center bg-black/75 p-4 text-center select-none ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
          >
            <motion.div
              initial={enableAnimations ? { scale: 0.94, y: 12 } : false}
              animate={{ scale: 1, y: 0 }}
              exit={enableAnimations ? { scale: 0.94, y: 12 } : undefined}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              {useLightweightBadge ? (
                <div className="bg-panel border-line/60 text-primary grid size-20 place-items-center rounded-3xl border shadow-xl">
                  <FontAwesomeIcon
                    icon={faRocket}
                    className="size-8"
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <div className="bg-panel border-line/60 relative rounded-3xl border p-3 shadow-xl">
                  <Suspense fallback={<div className="size-28" aria-hidden="true" />}>
                    <LazyRocket
                      launch={enableAnimations}
                      autoLaunch={enableAnimations}
                      loop={false}
                      interactive={false}
                      size="md"
                      showStars={tier === 'full'}
                      showPad={true}
                    />
                  </Suspense>
                </div>
              )}

              <div className="mt-5 max-w-sm space-y-1.5">
                <h3 className="font-sans text-lg font-bold tracking-wide text-white">
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-white/80">
                  {description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  },
)

export default ServicioHabitacionRocketOverlay
