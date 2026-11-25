import { memo, useMemo } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGavel } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'

export interface MartilloJuezAnimadoProps {
  className?: string
}

/**
 * Átomo: Icono de mazo/martillo de juez (`faGavel` de FontAwesome).
 * Adaptado al perfil de hardware (`useDeviceResourceProfile`) y `prefers-reduced-motion`,
 * sin bucles infinitos (`repeat: Infinity`) en hover.
 */
export const MartilloJuezAnimado = memo(function MartilloJuezAnimado({
  className = '',
}: MartilloJuezAnimadoProps) {
  const {
    policy: { enableAnimations, tier },
  } = useDeviceResourceProfile()
  const reducedMotion = useReducedMotion() ?? false
  const canAnimate = enableAnimations && !reducedMotion && tier !== 'ultra-light'
  const hoverRepeat = tier === 'full' ? 1 : 0

  const gavelStrikeVariants = useMemo<Variants>(
    () => ({
      rest: {
        rotate: 0,
        y: 0,
        transition: { duration: 0.2, ease: 'easeOut' },
      },
      hover: {
        rotate: [0, 24, -36, 14, -32, 0],
        y: [0, -3, 2, -1.5, 2, 0],
        transition: {
          duration: 0.9,
          repeat: hoverRepeat,
          repeatDelay: 0.25,
          times: [0, 0.2, 0.38, 0.55, 0.72, 1],
          ease: 'easeInOut',
        },
      },
    }),
    [hoverRepeat],
  )

  const impactWaveVariants = useMemo<Variants>(
    () => ({
      rest: {
        opacity: 0,
        scale: 0.6,
        transition: { duration: 0.15 },
      },
      hover: {
        opacity: [0, 0, 0.8, 0, 0.7, 0],
        scale: [0.6, 0.6, 1.35, 0.7, 1.25, 0.6],
        transition: {
          duration: 0.9,
          repeat: hoverRepeat,
          repeatDelay: 0.25,
          times: [0, 0.32, 0.42, 0.56, 0.74, 1],
          ease: 'easeOut',
        },
      },
    }),
    [hoverRepeat],
  )

  if (!canAnimate) {
    return (
      <div
        aria-hidden="true"
        className={`border-primary/20 bg-primary/10 text-primary relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl border ${className}`}
      >
        <span className="bg-primary/35 pointer-events-none absolute bottom-1.5 left-2 h-0.5 w-3.5 rounded-full" />
        <FontAwesomeIcon icon={faGavel} className="relative z-10 size-4" />
      </div>
    )
  }

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      aria-hidden="true"
      className={`border-primary/20 bg-primary/10 text-primary hover:border-primary/40 hover:bg-primary/15 relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl border transition-colors duration-200 ${className}`}
    >
      <motion.span
        variants={impactWaveVariants}
        className="border-primary/55 pointer-events-none absolute bottom-1.5 left-2 size-4 rounded-full border"
      />

      <span className="bg-primary/35 pointer-events-none absolute bottom-1.5 left-2 h-0.5 w-3.5 rounded-full" />

      <motion.div
        variants={gavelStrikeVariants}
        style={{ originX: 0.85, originY: 0.85 }}
        className="relative z-10 flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faGavel} className="size-4" />
      </motion.div>
    </motion.div>
  )
})
