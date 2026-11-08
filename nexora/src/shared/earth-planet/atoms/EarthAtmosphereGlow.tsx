import { motion } from 'motion/react'
import { EARTH_PALETTE } from '../lib/colors'

interface EarthAtmosphereGlowProps {
  px: number
  animated?: boolean
  active?: boolean
}

/**
 * Átomo: Halo atmosférico difuso de la Tierra (dispersión Rayleigh)
 * en tonos azules de hidrosfera (#546D93) y luz clara (#D5D3C4).
 */
export function EarthAtmosphereGlow({
  px,
  animated = true,
  active = false,
}: EarthAtmosphereGlowProps) {
  const intensity = active ? 0.9 : 0.65

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[15%] rounded-full"
      style={{
        background: `radial-gradient(circle, rgba(84,109,147,0) 60%, ${EARTH_PALETTE.oceanShallow}aa 76%, ${EARTH_PALETTE.cloudIce}55 88%, rgba(213,211,196,0) 100%)`,
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
      transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
