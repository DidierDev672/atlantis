import { memo } from 'react'
import { motion } from 'motion/react'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { DEFAULT_HOTEL_LOGO } from '../../../tema/application/tema-store'

export interface LoginLogoProps {
  hotelLogo: string | null
  hotelName: string
  showSparkles?: boolean
}

/**
 * Átomo: Logo del hotel homogéneo sin fondo ni halo difuminado,
 * adaptado al perfil de GPU (`useDeviceResourceProfile`) sin bucles infinitos.
 */
export const LoginLogo = memo(function LoginLogo({
  hotelLogo,
  hotelName,
  showSparkles = false,
}: LoginLogoProps) {
  const {
    policy: { enableAnimations, tier },
  } = useDeviceResourceProfile()

  const canAnimate = enableAnimations && tier !== 'ultra-light'
  const logoSrc = hotelLogo || DEFAULT_HOTEL_LOGO
  const imgClass = hotelLogo
    ? 'size-full object-cover'
    : 'size-full object-contain'

  const logoFrame = (
    <img
      src={logoSrc}
      alt={hotelName || 'Logo del proyecto'}
      decoding="async"
      className={imgClass}
    />
  )

  return (
    <div className="relative mx-auto mb-5 flex size-20 items-center justify-center">
      {showSparkles && tier === 'full' && enableAnimations && (
        <>
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-primary/70 absolute -top-2 -left-1"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path d="M12 2l2.9 6.26 6.6.8-4.9 4.5 1.3 6.44L12 16.9 6.1 20l1.3-6.44L2.5 9.06l6.6-.8L12 2z" />
            </svg>
          </motion.span>
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-secondary/70 absolute top-4 -right-1"
          >
            <svg viewBox="0 0 24 24" className="size-3" fill="currentColor">
              <path d="M12 2l2.9 6.26 6.6.8-4.9 4.5 1.3 6.44L12 16.9 6.1 20l1.3-6.44L2.5 9.06l6.6-.8L12 2z" />
            </svg>
          </motion.span>
        </>
      )}

      {canAnimate && tier === 'full' ? (
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.8, repeat: 1, ease: 'easeInOut' }}
          className="text-primary grid size-16 place-items-center overflow-hidden rounded-2xl bg-transparent"
        >
          {logoFrame}
        </motion.div>
      ) : (
        <div
          aria-hidden="true"
          className="text-primary grid size-16 place-items-center overflow-hidden rounded-2xl bg-transparent"
        >
          {logoFrame}
        </div>
      )}
    </div>
  )
})
