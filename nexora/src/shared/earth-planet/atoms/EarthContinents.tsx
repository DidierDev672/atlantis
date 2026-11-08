import { motion } from 'motion/react'
import { EARTH_PALETTE } from '../lib/colors'

interface EarthContinentsProps {
  animated?: boolean
}

/**
 * Átomo: Masas continentales de la Tierra en rotación (#978C67)
 * rodeadas de plataformas costeras (#546D93) sobre cuencas oceánicas (#172842).
 */
export function EarthContinents({ animated = true }: EarthContinentsProps) {
  return (
    <motion.div
      className="absolute inset-0 w-[200%] h-full"
      style={{
        background: `linear-gradient(to right, ${EARTH_PALETTE.oceanDeep} 0%, ${EARTH_PALETTE.oceanShallow} 35%, ${EARTH_PALETTE.oceanDeep} 100%)`,
      }}
      animate={
        animated
          ? {
              x: ['0%', '-50%'],
            }
          : { x: '0%' }
      }
      transition={{
        duration: 38,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {/* Siluetas vectoriales continentales de América, Eurasia, África y Oceanía */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Plataformas costeras submarinas (halo de plataforma) */}
        <path
          d="M 40,40 Q 60,30 90,50 T 110,120 Q 90,160 50,150 Z"
          fill={EARTH_PALETTE.oceanShallow}
          opacity="0.85"
        />
        <path
          d="M 180,35 Q 260,20 320,55 T 300,135 Q 230,160 170,120 Z"
          fill={EARTH_PALETTE.oceanShallow}
          opacity="0.85"
        />

        {/* Continente 1: Masa occidental (América estilizada) */}
        <path
          d="M 45,45 Q 65,35 85,55 T 100,110 Q 80,150 55,140 Z"
          fill={EARTH_PALETTE.continent}
        />
        {/* Relieve montañoso interior */}
        <path
          d="M 52,50 Q 62,65 72,105 T 65,135"
          fill="none"
          stroke={EARTH_PALETTE.nightShadow}
          strokeWidth="3"
          opacity="0.35"
        />

        {/* Continente 2: Masa oriental (Eurasia y África estilizada) */}
        <path
          d="M 190,40 Q 250,25 310,50 T 290,125 Q 220,150 180,110 Z"
          fill={EARTH_PALETTE.continent}
        />
        {/* Cuencas y mesetas interiores */}
        <circle cx="240" cy="75" r="14" fill={EARTH_PALETTE.oceanShallow} opacity="0.6" />
        <ellipse cx="230" cy="110" rx="22" ry="14" fill={EARTH_PALETTE.nightShadow} opacity="0.25" />

        {/* Continente 3: Isla / masa menor (Oceanía) */}
        <ellipse cx="340" cy="140" rx="18" ry="10" fill={EARTH_PALETTE.continent} />
        <circle cx="130" cy="145" r="6" fill={EARTH_PALETTE.continent} />
      </svg>
    </motion.div>
  )
}
