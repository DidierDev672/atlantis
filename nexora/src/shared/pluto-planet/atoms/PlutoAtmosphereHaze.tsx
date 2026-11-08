import { motion } from 'motion/react'
import { PLUTO_PALETTE } from '../lib/colors'

interface PlutoAtmosphereHazeProps {
  animated?: boolean
}

/**
 * Átomo: Neblina Atmosférica Azul Estratificada de Plutón.
 * Descubierta por la sonda New Horizons: un halo azul índigo estratificado
 * en múltiples capas que se eleva más de 200 km sobre el horizonte de Plutón.
 */
export function PlutoAtmosphereHaze({ animated = true }: PlutoAtmosphereHazeProps) {
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
          ${PLUTO_PALETTE.hazeIndigo}44 72%, 
          ${PLUTO_PALETTE.mysticPurple}26 84%, 
          transparent 96%)`,
        filter: 'blur(3px)',
      }}
    />
  )
}

