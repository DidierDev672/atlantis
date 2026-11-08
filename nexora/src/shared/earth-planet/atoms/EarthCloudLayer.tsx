import { motion } from 'motion/react'
import { EARTH_PALETTE } from '../lib/colors'

interface EarthCloudLayerProps {
  animated?: boolean
}

/**
 * Átomo: Capa de nubes dinámicas y borrascas espirales de la Tierra (#D5D3C4)
 * que flotan sobre los continentes con una velocidad orbital diferenciada.
 */
export function EarthCloudLayer({ animated = true }: EarthCloudLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0 w-[200%] h-full"
        animate={
          animated
            ? {
                x: ['0%', '-50%'],
              }
            : { x: '0%' }
        }
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full opacity-65"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Frente de nubes templadas del norte */}
          <path
            d="M 10,35 Q 70,55 130,30 T 250,45 T 380,30"
            fill="none"
            stroke={EARTH_PALETTE.cloudIce}
            strokeWidth="8"
            strokeLinecap="round"
            filter="blur(2px)"
          />
          <path
            d="M 30,50 Q 90,65 150,45 T 270,60"
            fill="none"
            stroke={EARTH_PALETTE.cloudIce}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Ciclón espiral tropical */}
          <circle cx="160" cy="85" r="12" fill={EARTH_PALETTE.cloudIce} opacity="0.6" filter="blur(2px)" />
          <path
            d="M 148,85 Q 160,70 172,85 T 160,98"
            fill="none"
            stroke={EARTH_PALETTE.cloudIce}
            strokeWidth="3"
          />

          {/* Frente de nubes del hemisferio sur */}
          <path
            d="M 20,150 Q 100,135 180,155 T 320,140 T 390,150"
            fill="none"
            stroke={EARTH_PALETTE.cloudIce}
            strokeWidth="9"
            strokeLinecap="round"
            filter="blur(2.5px)"
          />
        </svg>
      </motion.div>
    </div>
  )
}
