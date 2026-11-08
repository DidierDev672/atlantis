import { useId } from 'react'
import { motion } from 'motion/react'
import { SATURN_PALETTE } from '../lib/colors'

interface SaturnRingsBackProps {
  animated?: boolean
}

/**
 * Átomo: Sección Posterior de los Anillos de Saturno (Back Rings).
 * Se renderiza detrás del globo planetario (z-index bajo).
 * Incluye la perspectiva elíptica, la División de Cassini y la sombra
 * que el planeta proyecta sobre los anillos traseros (#4E493F).
 */
export function SaturnRingsBack({ animated = true }: SaturnRingsBackProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `saturn-rings-back-clip-${uid}`
  const ringGradId = `saturn-ring-back-grad-${uid}`
  const shadowGradId = `saturn-ring-shadow-grad-${uid}`

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[68%] z-0 select-none flex items-center justify-center"
    >
      <motion.svg
        viewBox="0 0 400 220"
        className="w-full h-full overflow-visible"
        animate={
          animated
            ? {
                rotate: [-18, -16, -18],
              }
            : undefined
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <defs>
          {/* Clip para renderizar únicamente la mitad trasera (y <= 110) */}
          <clipPath id={clipId}>
            <rect x="0" y="0" width="400" height="110" />
          </clipPath>

          {/* Gradiente radial concéntrico para los anillos */}
          <radialGradient id={ringGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="38%" stopColor="transparent" stopOpacity="0" />
            {/* Anillo C (tenue / crepé) */}
            <stop offset="39%" stopColor={SATURN_PALETTE.mutedSlate} stopOpacity="0.35" />
            <stop offset="46%" stopColor={SATURN_PALETTE.warmSand} stopOpacity="0.6" />
            {/* Anillo B (brillante / dorado) */}
            <stop offset="48%" stopColor={SATURN_PALETTE.goldenOchre} stopOpacity="0.95" />
            <stop offset="64%" stopColor={SATURN_PALETTE.warmSand} stopOpacity="0.9" />
            <stop offset="68%" stopColor={SATURN_PALETTE.paleCream} stopOpacity="0.85" />
            {/* División de Cassini (espacio oscuro) */}
            <stop offset="69%" stopColor={SATURN_PALETTE.deepUmber} stopOpacity="0.95" />
            <stop offset="72%" stopColor={SATURN_PALETTE.deepUmber} stopOpacity="0.9" />
            {/* Anillo A (exterior) */}
            <stop offset="73%" stopColor={SATURN_PALETTE.mutedSlate} stopOpacity="0.85" />
            <stop offset="84%" stopColor={SATURN_PALETTE.paleCream} stopOpacity="0.75" />
            <stop offset="88%" stopColor={SATURN_PALETTE.mutedSlate} stopOpacity="0.4" />
            <stop offset="92%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Sombra del globo proyectada sobre los anillos posteriores */}
          <linearGradient id={shadowGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="45%" stopColor={SATURN_PALETTE.deepUmber} stopOpacity="0.85" />
            <stop offset="80%" stopColor={SATURN_PALETTE.deepUmber} stopOpacity="0.95" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {/* Anillos principales traseros */}
          <ellipse
            cx="200"
            cy="110"
            rx="180"
            ry="54"
            fill={`url(#${ringGradId})`}
          />

          {/* Sombra planetaria sobre los anillos traseros (hacia el este) */}
          <ellipse
            cx="225"
            cy="90"
            rx="45"
            ry="24"
            fill={`url(#${shadowGradId})`}
            transform="rotate(10 225 90)"
          />
        </g>
      </motion.svg>
    </div>
  )
}

