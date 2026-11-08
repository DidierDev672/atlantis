import { motion } from 'motion/react'
import { URANUS_PALETTE } from '../lib/colors'

interface UranusAtmosphereGlowProps {
  animated?: boolean
}

/**
 * Átomo: Halo y Corona Atmosférica de Urano.
 * Emite un resplandor cian metánico (#218193, #79A4A9) con pulsación suave.
 */
export function UranusAtmosphereGlow({ animated = true }: UranusAtmosphereGlowProps) {
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
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        background: `radial-gradient(circle, 
          transparent 58%, 
          ${URANUS_PALETTE.cyanBlue}44 72%, 
          ${URANUS_PALETTE.glacialAqua}26 84%, 
          transparent 96%)`,
        filter: 'blur(3px)',
      }}
    />
  )
}

