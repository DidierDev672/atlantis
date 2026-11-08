import { motion } from 'motion/react'
import { SATURN_PALETTE, SATURN_GRADIENTS } from '../lib/colors'

interface SaturnBandsProps {
  animated?: boolean
}

/**
 * Átomo: Bandas Gaseosas y Sombra de los Anillos en Saturno.
 *
 * Reproduce las capas de amoníaco y niebla fotoquímica de Saturno:
 * - Región polar norte y sur (#6E6660)
 * - Bandas templadas y tropicales (#D9BD9F, #D3C7AF)
 * - Zona ecuatorial dorada (#D29F37)
 * - Sombra proyectada por los anillos sobre el disco (#4E493F)
 */
export function SaturnBands({ animated = true }: SaturnBandsProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full select-none"
      style={{
        background: SATURN_GRADIENTS.surface,
      }}
    >
      {/* Capa de bandas dinámicas con desplazamiento diferencial */}
      <motion.div
        className="absolute inset-0 opacity-80"
        animate={
          animated
            ? {
                x: ['-12%', '12%', '-12%'],
              }
            : undefined
        }
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `repeating-linear-gradient(
            180deg,
            ${SATURN_PALETTE.mutedSlate} 0%,
            ${SATURN_PALETTE.mutedSlate} 4%,
            ${SATURN_PALETTE.paleCream} 5%,
            ${SATURN_PALETTE.paleCream} 12%,
            ${SATURN_PALETTE.warmSand} 13%,
            ${SATURN_PALETTE.warmSand} 22%,
            ${SATURN_PALETTE.goldenOchre} 24%,
            ${SATURN_PALETTE.goldenOchre} 36%,
            ${SATURN_PALETTE.paleCream} 38%,
            ${SATURN_PALETTE.paleCream} 48%,
            ${SATURN_PALETTE.warmSand} 50%,
            ${SATURN_PALETTE.warmSand} 64%,
            ${SATURN_PALETTE.mutedSlate} 66%,
            ${SATURN_PALETTE.mutedSlate} 78%,
            ${SATURN_PALETTE.deepUmber} 80%,
            ${SATURN_PALETTE.deepUmber} 100%
          )`,
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Sombra de los anillos proyectada sobre el disco planetario */}
      <div
        className="absolute inset-x-0 h-[10%] top-[42%] opacity-65"
        style={{
          background: `linear-gradient(180deg, 
            transparent 0%, 
            ${SATURN_PALETTE.deepUmber} 40%, 
            ${SATURN_PALETTE.deepUmber} 80%, 
            transparent 100%)`,
          transform: 'rotate(-4deg) scale(1.15)',
        }}
      />

      {/* Vórtices tenues en latitudes medias */}
      <div
        className="absolute inset-x-0 top-[28%] h-[6%] opacity-40"
        style={{
          background: `radial-gradient(ellipse at 40% 50%, ${SATURN_PALETTE.paleCream} 0%, transparent 60%)`,
        }}
      />
    </div>
  )
}

