import { memo, useMemo } from 'react'
import { motion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'

export interface CarritoSupermercadoAnimadoProps {
  className?: string
}

const SPEED_LINES = [
  { id: 'l1', top: 'top-3', width: 'w-2.5', delay: 0 },
  { id: 'l2', top: 'top-5', width: 'w-3.5', delay: 0.12 },
  { id: 'l3', top: 'top-7', width: 'w-2', delay: 0.24 },
]

/**
 * Átomo: Icono de carrito de supermercado adaptado al perfil de GPU sin `repeat: Infinity`.
 */
export const CarritoSupermercadoAnimado = memo(
  function CarritoSupermercadoAnimado({
    className = '',
  }: CarritoSupermercadoAnimadoProps) {
    const {
      policy: { enableAnimations, tier },
    } = useDeviceResourceProfile()

    const hoverRepeat = enableAnimations && tier === 'full' ? 1 : 0

    const { cartRollVariants, speedStreakVariants } = useMemo<{
      cartRollVariants: Variants
      speedStreakVariants: Variants
    }>(
      () => ({
        cartRollVariants: {
          rest: { x: 0, y: 0, rotate: 0, transition: { duration: 0.25, ease: 'easeOut' } },
          hover:
            enableAnimations && tier !== 'ultra-light'
              ? {
                  x: [-2, 6, 4, 8, 0],
                  y: [0, -1.5, 0, -1, 0],
                  rotate: [0, -8, -4, -10, 0],
                  transition: {
                    duration: 0.8,
                    repeat: hoverRepeat,
                    ease: 'easeInOut',
                  },
                }
              : { x: 0, y: 0, rotate: 0 },
        },
        speedStreakVariants: {
          rest: { opacity: 0, x: 4, transition: { duration: 0.15 } },
          hover: (delay: number) =>
            enableAnimations && tier !== 'ultra-light'
              ? {
                  opacity: [0, 0.85, 0],
                  x: [6, -12],
                  transition: {
                    duration: 0.5,
                    repeat: hoverRepeat,
                    delay,
                    ease: 'easeOut',
                  },
                }
              : { opacity: 0 },
        },
      }),
      [enableAnimations, hoverRepeat, tier],
    )

    return (
      <motion.div
        initial="rest"
        animate="rest"
        whileHover={enableAnimations ? 'hover' : undefined}
        aria-hidden="true"
        className={`bg-primary/10 text-primary relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl transition-colors duration-200 hover:bg-primary/15 ${className}`}
      >
        {SPEED_LINES.map((line) => (
          <motion.span
            key={line.id}
            custom={line.delay}
            variants={speedStreakVariants}
            className={`bg-primary/50 pointer-events-none absolute left-1.5 h-0.5 rounded-full ${line.top} ${line.width}`}
          />
        ))}

        <motion.div
          variants={cartRollVariants}
          className="relative z-10 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faCartShopping} className="size-4" />
        </motion.div>
      </motion.div>
    )
  },
)
