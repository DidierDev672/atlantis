import { motion } from 'motion/react'
import { PLUTO_PALETTE } from '../lib/colors'

interface PlutoHeartGlacierProps {
  animated?: boolean
}

/**
 * Átomo: El Corazón Glaciar de Plutón (Tombaugh Regio & Sputnik Planitia).
 *
 * El rasgo más célebre de Plutón: una gigantesca cuenca de hielo de nitrógeno
 * con forma de corazón descubierta por New Horizons, con celdas de convección activas.
 */
export function PlutoHeartGlacier({ animated = true }: PlutoHeartGlacierProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[34%] top-[30%] select-none"
      style={{
        width: '46%',
        height: '46%',
      }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="size-full overflow-visible"
        animate={
          animated
            ? {
                scale: [1, 1.04, 1],
                opacity: [0.92, 1, 0.92],
              }
            : undefined
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <defs>
          <radialGradient id="pluto-heart-grad" cx="44%" cy="42%" r="55%">
            <stop offset="0%" stopColor={PLUTO_PALETTE.heartGlacier} stopOpacity="0.98" />
            <stop offset="55%" stopColor={PLUTO_PALETTE.heartGlacier} stopOpacity="0.9" />
            <stop offset="85%" stopColor={PLUTO_PALETTE.nitrogenSand} stopOpacity="0.8" />
            <stop offset="100%" stopColor={PLUTO_PALETTE.mysticPurple} stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Silueta asimétrica del Corazón de Plutón (lóbulo occidental Sputnik Planitia más amplio) */}
        <path
          d="M 50 24 
             C 34 6, 6 16, 6 42 
             C 6 66, 32 82, 50 94 
             C 68 82, 94 66, 94 44 
             C 94 20, 66 8, 50 24 Z"
          fill="url(#pluto-heart-grad)"
          filter="drop-shadow(0 0 4px rgba(241,240,215,0.45))"
        />

        {/* Celdas poligonales de convección térmica de nitrógeno en Sputnik Planitia */}
        <circle cx="36" cy="46" r="10" fill="none" stroke={PLUTO_PALETTE.nitrogenSand} strokeWidth="0.75" strokeOpacity="0.45" />
        <circle cx="28" cy="58" r="8" fill="none" stroke={PLUTO_PALETTE.nitrogenSand} strokeWidth="0.75" strokeOpacity="0.4" />
        <circle cx="44" cy="62" r="9" fill="none" stroke={PLUTO_PALETTE.nitrogenSand} strokeWidth="0.75" strokeOpacity="0.4" />
      </motion.svg>
    </div>
  )
}

