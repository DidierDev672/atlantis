import { Suspense, memo } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRocket } from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { RocketProps } from '../../../../shared/rocket/types'
import { lazyWithFallback } from '../../application/lazy-with-fallback'
import { DEFAULT_HOTEL_NAME } from '../../domain/login'

const LazyRocket = lazyWithFallback<RocketProps>(
  () =>
    import('../../../../shared/rocket/organisms/Rocket').then((m) => m.Rocket),
  'Rocket en LoginLoadingOverlay'
)

export interface LoginLoadingOverlayProps {
  visible: boolean
  hotelName: string
}

/**
 * Molécula: Overlay perezoso durante la verificación de credenciales.
 * Evita doble `backdrop-blur` y desactiva `Rocket` animado en perfiles de bajos recursos.
 */
export const LoginLoadingOverlay = memo(function LoginLoadingOverlay({
  visible,
  hotelName,
}: LoginLoadingOverlayProps) {
  const {
    policy: { enableBackdropBlur, enableAnimations, tier },
  } = useDeviceResourceProfile()

  if (!visible) return null

  const useStaticBadge = !enableAnimations || tier === 'ultra-light'
  const titleText =
    hotelName !== DEFAULT_HOTEL_NAME
      ? `Despegando hacia ${hotelName}…`
      : 'Iniciando despegue hacia tu hotel…'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`bg-canvas/85 fixed inset-0 z-50 flex items-center justify-center p-4 ${
        enableBackdropBlur ? 'backdrop-blur-xs' : ''
      }`}
    >
      <motion.div
        variants={useStaticBadge ? undefined : fadeUp}
        initial={useStaticBadge ? false : 'hidden'}
        animate="visible"
        className="border-line bg-panel flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border p-6 text-center shadow-xl sm:p-8"
      >
        {useStaticBadge ? (
          <div className="border-line bg-canvas text-primary grid size-20 place-items-center rounded-3xl border">
            <FontAwesomeIcon
              icon={faRocket}
              className="size-8"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <Suspense fallback={<div className="size-28" aria-hidden="true" />}>
              <LazyRocket
                size="md"
                autoLaunch
                loop={false}
                interactive={false}
                showStars={tier === 'full'}
                timing={{ ignitionMs: 600, ascentMs: 1400 }}
                className="ring-primary/20 bg-canvas/60 ring-1"
              />
            </Suspense>
          </div>
        )}

        <div className="space-y-1.5">
          <h3 className="text-ink text-lg font-bold">{titleText}</h3>
          <p className="text-ink-muted text-sm">
            Verificando credenciales y preparando el panel en segundo plano.
          </p>
        </div>
      </motion.div>
    </div>
  )
})
