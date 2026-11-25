import { memo, useMemo } from 'react'
import { motion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBowlFood, faFireFlameCurved } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'

export interface PlatoAlimentosAnimadoProps {
  className?: string
}

const STEAM_PATHS = [
  { id: 's1', xOffset: '-translate-x-2', delay: 0 },
  { id: 's2', xOffset: 'translate-x-0', delay: 0.2 },
  { id: 's3', xOffset: 'translate-x-2', delay: 0.4 },
]

/**
 * Átomo: Icono animado de plato de alimentos con FontAwesome.
 * Adaptado al perfil de hardware: sin `blur-[0.5px]` ni bucles `repeat: Infinity` en hover.
 */
export const PlatoAlimentosAnimado = memo(function PlatoAlimentosAnimado({
  className = '',
}: PlatoAlimentosAnimadoProps) {
  const {
    policy: { enableAnimations, tier },
  } = useDeviceResourceProfile()

  const hoverRepeat = enableAnimations && tier === 'full' ? 2 : 0

  const { containerVariants, steamVariants, bowlVariants, flameVariants } =
    useMemo<{
      containerVariants: Variants
      steamVariants: Variants
      bowlVariants: Variants
      flameVariants: Variants
    }>(
      () => ({
        containerVariants: {
          rest: { scale: 1 },
          hover: enableAnimations
            ? { scale: 1.06, transition: { duration: 0.2, ease: 'easeOut' } }
            : { scale: 1 },
        },
        steamVariants: {
          rest: { opacity: 0, y: 4, scale: 0.7, transition: { duration: 0.15 } },
          hover: (delay: number) =>
            enableAnimations && tier !== 'ultra-light'
              ? {
                  opacity: [0, 0.85, 0],
                  y: [4, -10],
                  scale: [0.7, 1.1, 0.85],
                  transition: {
                    duration: 0.9,
                    repeat: hoverRepeat,
                    delay,
                    ease: 'easeOut',
                  },
                }
              : { opacity: 0 },
        },
        bowlVariants: {
          rest: { y: 0, rotate: 0, transition: { duration: 0.2 } },
          hover:
            enableAnimations && tier !== 'ultra-light'
              ? {
                  y: [0, -2, 0, -1.5, 0],
                  rotate: [0, -4, 4, -2, 0],
                  transition: {
                    duration: 0.75,
                    repeat: hoverRepeat,
                    ease: 'easeInOut',
                  },
                }
              : { y: 0, rotate: 0 },
        },
        flameVariants: {
          rest: { opacity: 0, scale: 0.6, transition: { duration: 0.15 } },
          hover:
            enableAnimations && tier !== 'ultra-light'
              ? {
                  opacity: [0.65, 1, 0.65],
                  scale: [0.9, 1.08, 0.9],
                  transition: {
                    duration: 0.65,
                    repeat: hoverRepeat,
                    ease: 'easeInOut',
                  },
                }
              : { opacity: 0 },
        },
      }),
      [enableAnimations, hoverRepeat, tier],
    )

  return (
    <motion.div
      variants={containerVariants}
      initial="rest"
      animate="rest"
      whileHover={enableAnimations ? 'hover' : undefined}
      aria-hidden="true"
      title="Preparando platillo"
      className={`relative grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors duration-300 hover:border-amber-500/40 hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 ${className}`}
    >
      <div className="pointer-events-none absolute -top-2 inset-x-0 flex justify-center">
        {STEAM_PATHS.map((steam) => (
          <motion.span
            key={steam.id}
            custom={steam.delay}
            variants={steamVariants}
            className={`absolute h-2.5 w-1 rounded-full bg-amber-500/70 ${steam.xOffset}`}
          />
        ))}
      </div>

      <motion.div
        variants={bowlVariants}
        className="relative z-10 flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faBowlFood} className="size-5" />
      </motion.div>

      <motion.span
        variants={flameVariants}
        className="pointer-events-none absolute bottom-1 text-orange-500"
      >
        <FontAwesomeIcon icon={faFireFlameCurved} className="size-2.5" />
      </motion.span>
    </motion.div>
  )
})
