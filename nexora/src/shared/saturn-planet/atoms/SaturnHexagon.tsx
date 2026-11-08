import { motion } from 'motion/react'
import { SATURN_PALETTE } from '../lib/colors'

interface SaturnHexagonProps {
  animated?: boolean
}

/**
 * Átomo: El Gran Hexágono Polar Norte de Saturno.
 * Fenómeno meteorológico único en el polo norte descubierto por las misiones Voyager y Cassini.
 * Vórtice de seis lados con rotación lenta y pulso de densidad atmosférica.
 */
export function SaturnHexagon({ animated = true }: SaturnHexagonProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[4%] -translate-x-1/2 select-none"
      style={{
        width: '28%',
        height: '14%',
      }}
    >
      <motion.svg
        viewBox="0 0 100 86"
        className="size-full overflow-visible"
        animate={
          animated
            ? {
                rotate: [0, 360],
              }
            : undefined
        }
        transition={{
          duration: 90,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Hexágono exterior */}
        <polygon
          points="50,2 93,25 93,71 50,84 7,71 7,25"
          fill={`${SATURN_PALETTE.mutedSlate}66`}
          stroke={SATURN_PALETTE.goldenOchre}
          strokeWidth="3"
          strokeOpacity="0.8"
        />

        {/* Ojo central del vórtice polar */}
        <circle
          cx="50"
          cy="48"
          r="14"
          fill={SATURN_PALETTE.deepUmber}
          opacity="0.85"
        />
        <circle
          cx="50"
          cy="48"
          r="6"
          fill={SATURN_PALETTE.goldenOchre}
          opacity="0.9"
        />
      </motion.svg>
    </div>
  )
}

