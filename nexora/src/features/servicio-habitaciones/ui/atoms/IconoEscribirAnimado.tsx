import { memo, useCallback, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'

export interface IconoEscribirAnimadoProps {
  className?: string
}

/**
 * Átomo: Ícono animado de edición para cabeceras.
 * Adaptado a `useDeviceResourceProfile` y `prefers-reduced-motion`, sin bucles
 * `repeat: Infinity` en hover.
 */
export const IconoEscribirAnimado = memo(function IconoEscribirAnimado({
  className = '',
}: IconoEscribirAnimadoProps) {
  const [isWriting, setIsWriting] = useState(false)
  const {
    policy: { enableAnimations, tier },
  } = useDeviceResourceProfile()
  const reducedMotion = useReducedMotion() ?? false
  const canAnimate = enableAnimations && !reducedMotion && tier !== 'ultra-light'
  const hoverRepeat = tier === 'full' ? 1 : 0

  const handleMouseEnter = useCallback(() => {
    if (canAnimate) setIsWriting(true)
  }, [canAnimate])

  const handleMouseLeave = useCallback(() => {
    setIsWriting(false)
  }, [])

  if (!canAnimate) {
    return (
      <div
        aria-hidden="true"
        className={`bg-primary/10 text-primary relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl ${className}`}
      >
        <FontAwesomeIcon icon={faPenToSquare} className="size-4" aria-hidden="true" />
      </div>
    )
  }

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      aria-hidden="true"
      className={`bg-primary/10 text-primary hover:bg-primary/20 relative grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl transition-colors duration-200 ${className}`}
    >
      <motion.span
        className="relative z-10 inline-flex items-center justify-center"
        animate={
          isWriting
            ? {
                x: [-1.5, 1.5, -0.5, 2, 0],
                y: [0.5, -1, 0.5, -0.5, 0],
                rotate: [0, -11, 5, -9, 0],
              }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={
          isWriting
            ? {
                duration: 0.7,
                repeat: hoverRepeat,
                repeatDelay: 0.15,
                ease: 'easeInOut',
              }
            : { duration: 0.2, ease: 'easeOut' }
        }
      >
        <FontAwesomeIcon
          icon={faPenToSquare}
          className="size-4"
          aria-hidden="true"
        />
      </motion.span>

      {/* Trazo de tinta animado de izquierda a derecha durante el hover */}
      <motion.span
        className="bg-primary/80 pointer-events-none absolute right-2.5 bottom-1.5 left-2.5 h-0.5 origin-left rounded-full"
        initial={false}
        animate={
          isWriting
            ? {
                scaleX: [0, 0.6, 1, 1],
                opacity: [0, 1, 1, 0.25],
              }
            : {
                scaleX: 0,
                opacity: 0,
              }
        }
        transition={
          isWriting
            ? {
                duration: 0.7,
                repeat: hoverRepeat,
                repeatDelay: 0.15,
                ease: 'easeInOut',
              }
            : { duration: 0.18, ease: 'easeOut' }
        }
      />
    </motion.div>
  )
})
