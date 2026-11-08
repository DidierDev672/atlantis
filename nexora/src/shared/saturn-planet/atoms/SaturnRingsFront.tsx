import { useId } from 'react'
import { motion } from 'motion/react'
import { SATURN_PALETTE } from '../lib/colors'

interface SaturnRingsFrontProps {
  animated?: boolean
}

/**
 * Átomo: Sección Frontal de los Anillos de Saturno (Front Rings).
 * Se renderiza por delante del globo planetario (z-index superior).
 * Completa la perspectiva 3D realista pasando por delante del ecuador.
 */
export function SaturnRingsFront({ animated = true }: SaturnRingsFrontProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `saturn-rings-front-clip-${uid}`
  const ringGradId = `saturn-ring-front-grad-${uid}`

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[68%] z-20 select-none flex items-center justify-center"
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
          {/* Clip para renderizar únicamente la mitad frontal (y >= 110) */}
          <clipPath id={clipId}>
            <rect x="0" y="110" width="400" height="110" />
          </clipPath>

          {/* Gradiente concéntrico idéntico al trasero para continuidad perfecta */}
          <radialGradient id={ringGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="38%" stopColor="transparent" stopOpacity="0" />
            {/* Anillo C */}
            <stop offset="39%" stopColor={SATURN_PALETTE.mutedSlate} stopOpacity="0.35" />
            <stop offset="46%" stopColor={SATURN_PALETTE.warmSand} stopOpacity="0.6" />
            {/* Anillo B */}
            <stop offset="48%" stopColor={SATURN_PALETTE.goldenOchre} stopOpacity="0.95" />
            <stop offset="64%" stopColor={SATURN_PALETTE.warmSand} stopOpacity="0.9" />
            <stop offset="68%" stopColor={SATURN_PALETTE.paleCream} stopOpacity="0.85" />
            {/* División de Cassini */}
            <stop offset="69%" stopColor={SATURN_PALETTE.deepUmber} stopOpacity="0.95" />
            <stop offset="72%" stopColor={SATURN_PALETTE.deepUmber} stopOpacity="0.9" />
            {/* Anillo A */}
            <stop offset="73%" stopColor={SATURN_PALETTE.mutedSlate} stopOpacity="0.85" />
            <stop offset="84%" stopColor={SATURN_PALETTE.paleCream} stopOpacity="0.75" />
            <stop offset="88%" stopColor={SATURN_PALETTE.mutedSlate} stopOpacity="0.4" />
            <stop offset="92%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {/* Anillos frontales pasando sobre el disco de Saturno */}
          <ellipse
            cx="200"
            cy="110"
            rx="180"
            ry="54"
            fill={`url(#${ringGradId})`}
          />
        </g>
      </motion.svg>
    </div>
  )
}

