import { motion } from 'motion/react'
import { MARS_PALETTE } from '../lib/colors'

interface MarsAtmosphereGlowProps {
  px: number
  animated?: boolean
  active?: boolean
}

/**
 * Átomo: Halo atmosférico difuso de Marte con tonalidades de óxido de hierro (#F2935C)
 * y arenas calientes (#F2D091).
 */
export function MarsAtmosphereGlow({
  px,
  animated = true,
  active = false,
}: MarsAtmosphereGlowProps) {
  const intensity = active ? 0.9 : 0.65

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[15%] rounded-full"
      style={{
        background: `radial-gradient(circle, rgba(242,147,92,0) 60%, ${MARS_PALETTE.rust}99 76%, ${MARS_PALETTE.sand}55 86%, rgba(242,208,145,0) 100%)`,
        filter: `blur(${Math.max(2, px * 0.04)}px)`,
      }}
      animate={
        animated
          ? {
              scale: [1, 1.06, 1],
              opacity: [intensity, Math.min(1, intensity + 0.25), intensity],
            }
          : { scale: 1, opacity: intensity }
      }
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
