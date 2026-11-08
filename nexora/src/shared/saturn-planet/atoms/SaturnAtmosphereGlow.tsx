import { motion } from 'motion/react'
import { SATURN_PALETTE } from '../lib/colors'

interface SaturnAtmosphereGlowProps {
  animated?: boolean
}

/**
 * Átomo: Halo y Corona Atmosférica de Saturno.
 * Emite un resplandor áureo y crema (#D29F37, #D9BD9F) con pulsación continua.
 */
export function SaturnAtmosphereGlow({ animated = true }: SaturnAtmosphereGlowProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[18%] rounded-full select-none"
      animate={
        animated
          ? {
              scale: [1, 1.04, 1],
              opacity: [0.75, 0.95, 0.75],
            }
          : undefined
      }
      transition={{
        duration: 5.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        background: `radial-gradient(circle, 
          transparent 58%, 
          ${SATURN_PALETTE.goldenOchre}40 70%, 
          ${SATURN_PALETTE.warmSand}25 82%, 
          transparent 96%)`,
        filter: 'blur(3px)',
      }}
    />
  )
}

