import { motion } from 'motion/react'
import { NEPTUNE_PALETTE } from '../lib/colors'

interface NeptuneAtmosphereGlowProps {
  animated?: boolean
}

/**
 * Átomo: Halo y Corona Atmosférica de Neptuno.
 * Emite un resplandor azul eléctrico y cian glacial (#6081FF, #89F3FF) con pulsación continua.
 */
export function NeptuneAtmosphereGlow({ animated = true }: NeptuneAtmosphereGlowProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[18%] rounded-full select-none"
      animate={
        animated
          ? {
              scale: [1, 1.05, 1],
              opacity: [0.75, 0.95, 0.75],
            }
          : undefined
      }
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        background: `radial-gradient(circle, 
          transparent 58%, 
          ${NEPTUNE_PALETTE.electricBlue}44 72%, 
          ${NEPTUNE_PALETTE.luminousCyan}28 84%, 
          transparent 96%)`,
        filter: 'blur(3px)',
      }}
    />
  )
}

