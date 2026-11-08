import { useId } from 'react'
import { motion } from 'motion/react'
import { URANUS_PALETTE } from '../lib/colors'

interface UranusVerticalRingsProps {
  layer?: 'back' | 'front' | 'all'
  animated?: boolean
}

/**
 * Átomo: Sistema de Anillos Verticales de Urano (The Tilted Rings).
 *
 * A diferencia de los otros gigantes, los anillos de Urano están orientados
 * casi verticalmente (~84° a 98°) debido a su inclinación axial extrema de 97.8°.
 * Incluye el prominente Anillo Épsilon (ε) y anillos de polvo (#79A4A9, #D0C1AC, #218193).
 */
export function UranusVerticalRings({
  layer = 'all',
  animated = true,
}: UranusVerticalRingsProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `uranus-rings-clip-${layer}-${uid}`
  const gradId = `uranus-rings-grad-${uid}`

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[55%] select-none flex items-center justify-center"
      style={{
        zIndex: layer === 'back' ? 0 : layer === 'front' ? 20 : 10,
      }}
    >
      <motion.svg
        viewBox="0 0 400 400"
        className="size-full overflow-visible"
        animate={
          animated
            ? {
                rotate: [84, 87, 84],
              }
            : undefined
        }
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <defs>
          {/* Clips para oclusión 3D */}
          <clipPath id={clipId}>
            {layer === 'back' ? (
              <rect x="0" y="0" width="400" height="200" />
            ) : layer === 'front' ? (
              <rect x="0" y="200" width="400" height="200" />
            ) : (
              <rect x="0" y="0" width="400" height="400" />
            )}
          </clipPath>

          {/* Gradiente radial para los anillos finos y oscuros de Urano */}
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="42%" stopColor="transparent" stopOpacity="0" />
            {/* Anillos interiores tenues de polvo */}
            <stop offset="44%" stopColor={URANUS_PALETTE.mineralSand} stopOpacity="0.3" />
            <stop offset="50%" stopColor={URANUS_PALETTE.glacialAqua} stopOpacity="0.5" />
            <stop offset="52%" stopColor="transparent" stopOpacity="0" />
            {/* Anillo Épsilon (ε) brillante y delgado */}
            <stop offset="58%" stopColor={URANUS_PALETTE.cyanBlue} stopOpacity="0.9" />
            <stop offset="63%" stopColor={URANUS_PALETTE.paleCyanIce} stopOpacity="0.85" />
            <stop offset="66%" stopColor={URANUS_PALETTE.glacialAqua} stopOpacity="0.6" />
            {/* Anillo exterior tenue */}
            <stop offset="70%" stopColor={URANUS_PALETTE.mineralSand} stopOpacity="0.35" />
            <stop offset="74%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g clipPath={layer !== 'all' ? `url(#${clipId})` : undefined}>
          {/* Anillos rotados verticalmente a 84° */}
          <g transform="rotate(84 200 200)">
            <ellipse
              cx="200"
              cy="200"
              rx="155"
              ry="34"
              fill={`url(#${gradId})`}
            />

            {/* Hilo brillante del Anillo Épsilon */}
            <ellipse
              cx="200"
              cy="200"
              rx="148"
              ry="32"
              fill="none"
              stroke={URANUS_PALETTE.paleCyanIce}
              strokeWidth="0.8"
              strokeOpacity="0.75"
            />
          </g>
        </g>
      </motion.svg>
    </div>
  )
}

