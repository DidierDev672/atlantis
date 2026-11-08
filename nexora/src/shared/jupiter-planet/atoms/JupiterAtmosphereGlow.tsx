import { motion } from 'motion/react'
import { JUPITER_PALETTE } from '../lib/colors'

export interface JupiterAtmosphereGlowProps {
  px: number
  animated?: boolean
  active?: boolean
}

/**
 * Átomo: Halo y corona atmosférica difusa de Júpiter con tonalidades de ámbar dorado (#FEAC4D)
 * y terracota (#D26F37).
 */
export function JupiterAtmosphereGlow({
  px,
  animated = true,
  active = false,
}: JupiterAtmosphereGlowProps) {
  const intensity = active ? 0.95 : 0.65

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[18%] rounded-full"
      style={{
        background: `radial-gradient(circle, rgba(254,172,77,0) 58%, ${JUPITER_PALETTE.amberGold}aa 74%, ${JUPITER_PALETTE.terracotta}66 85%, rgba(210,111,55,0) 100%)`,
        filter: `blur(${Math.max(2, px * 0.045)}px)`,
      }}
      animate={
        animated
          ? {
              scale: [1, 1.07, 1],
              opacity: [intensity, Math.min(1, intensity + 0.28), intensity],
            }
          : { scale: 1, opacity: intensity }
      }
      transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

