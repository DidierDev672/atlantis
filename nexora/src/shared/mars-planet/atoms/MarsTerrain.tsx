import { motion } from 'motion/react'
import { MARS_PALETTE } from '../lib/colors'

interface MarsTerrainProps {
  animated?: boolean
}

/**
 * Átomo: Relieve geológico marciano que incluye cañones, tierras altas de Tharsis,
 * planicies de regolito y cráteres modelados con la paleta de 5 tonos marcianos.
 */
export function MarsTerrain({ animated = true }: MarsTerrainProps) {
  return (
    <motion.div
      className="absolute inset-0 w-[200%] h-full"
      style={{
        background: `radial-gradient(ellipse at 20% 40%, ${MARS_PALETTE.ochre} 0%, transparent 40%),
                     radial-gradient(ellipse at 70% 30%, ${MARS_PALETTE.crimson} 0%, transparent 50%),
                     radial-gradient(circle at 45% 65%, ${MARS_PALETTE.deepRed} 0%, transparent 35%),
                     radial-gradient(ellipse at 85% 70%, ${MARS_PALETTE.ochre} 0%, transparent 45%),
                     linear-gradient(to right, ${MARS_PALETTE.rust} 0%, ${MARS_PALETTE.crimson} 50%, ${MARS_PALETTE.rust} 100%)`,
      }}
      animate={
        animated
          ? {
              x: ['0%', '-50%'],
            }
          : { x: '0%' }
      }
      transition={{
        duration: 35,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {/* Detalles de cañones (Valles Marineris) y cráteres */}
      <svg
        className="absolute inset-0 w-full h-full opacity-60"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Cañón longitudinal */}
        <path
          d="M 30,95 Q 80,115 140,100 T 250,110 T 370,95"
          fill="none"
          stroke={MARS_PALETTE.deepRed}
          strokeWidth="6"
          strokeLinecap="round"
          filter="blur(1px)"
        />
        <path
          d="M 32,96 Q 80,116 140,101 T 250,111 T 370,96"
          fill="none"
          stroke={MARS_PALETTE.ochre}
          strokeWidth="2"
        />

        {/* Cráteres volcánicos */}
        <circle cx="95" cy="55" r="14" fill={MARS_PALETTE.deepRed} opacity="0.75" />
        <circle cx="93" cy="53" r="12" fill={MARS_PALETTE.crimson} />
        <circle cx="91" cy="51" r="5" fill={MARS_PALETTE.sand} opacity="0.6" />

        <circle cx="280" cy="140" r="18" fill={MARS_PALETTE.deepRed} opacity="0.75" />
        <circle cx="278" cy="138" r="15" fill={MARS_PALETTE.crimson} />
        <circle cx="275" cy="135" r="6" fill={MARS_PALETTE.sand} opacity="0.5" />

        {/* Tierras altas y dunas */}
        <ellipse cx="190" cy="60" rx="35" ry="12" fill={MARS_PALETTE.sand} opacity="0.35" />
        <ellipse cx="340" cy="50" rx="40" ry="14" fill={MARS_PALETTE.ochre} opacity="0.45" />
      </svg>
    </motion.div>
  )
}
