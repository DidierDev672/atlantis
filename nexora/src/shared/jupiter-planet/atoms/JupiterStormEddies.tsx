import { motion } from 'motion/react'
import { JUPITER_PALETTE } from '../lib/colors'

export interface JupiterStormEddiesProps {
  animated?: boolean
}

/**
 * Átomo: Remolinos, festones turbulentos y óvalos blancos ("String of Pearls") de Júpiter.
 * Aporta micro-turbulencias atmosféricas dinámicas sobre las bandas con la paleta joviana.
 */
export function JupiterStormEddies({ animated = true }: JupiterStormEddiesProps) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-5"
      animate={
        animated
          ? {
              opacity: [0.75, 0.95, 0.75],
            }
          : { opacity: 0.85 }
      }
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Festón turbulento en la Zona Ecuatorial Norte */}
        <path
          d="M 30,55 C 50,45 65,65 85,55 S 120,45 140,58"
          fill="none"
          stroke={JUPITER_PALETTE.amberGold}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Óvalos blancos (White Ovals) en el cinturón templado sur */}
        <ellipse
          cx="45"
          cy="158"
          rx="7"
          ry="3.5"
          fill={JUPITER_PALETTE.lightCream}
          opacity="0.75"
        />
        <ellipse
          cx="120"
          cy="155"
          rx="9"
          ry="4"
          fill={JUPITER_PALETTE.lightCream}
          opacity="0.8"
        />
        <ellipse
          cx="170"
          cy="160"
          rx="6"
          ry="3"
          fill={JUPITER_PALETTE.lightCream}
          opacity="0.7"
        />

        {/* Remolino en el Cinturón Ecuatorial Norte */}
        <ellipse
          cx="160"
          cy="75"
          rx="11"
          ry="5"
          fill={JUPITER_PALETTE.terracotta}
          opacity="0.65"
        />
        <ellipse
          cx="161"
          cy="75"
          rx="5"
          ry="2"
          fill={JUPITER_PALETTE.amberGold}
          opacity="0.85"
        />

        {/* Vórtice templado */}
        <circle
          cx="80"
          cy="132"
          r="4"
          fill={JUPITER_PALETTE.mutedOchre}
          opacity="0.55"
        />
      </svg>
    </motion.div>
  )
}

