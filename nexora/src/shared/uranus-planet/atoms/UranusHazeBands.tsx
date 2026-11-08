import { motion } from 'motion/react'
import { URANUS_PALETTE, URANUS_GRADIENTS } from '../lib/colors'

interface UranusHazeBandsProps {
  animated?: boolean
}

/**
 * Átomo: Bandas Atmosféricas y Neblina de Metano de Urano.
 *
 * Muestra el gradiente cian-aguamarina característico del gigante de hielo,
 * con una inclinación axial pronunciada de ~98° y desplazamiento convectivo lento.
 */
export function UranusHazeBands({ animated = true }: UranusHazeBandsProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full select-none"
      style={{
        background: URANUS_GRADIENTS.surface,
      }}
    >
      {/* Capa de neblina de metano inclinada con rotación diferencial */}
      <motion.div
        className="absolute inset-0 opacity-75"
        animate={
          animated
            ? {
                x: ['-10%', '10%', '-10%'],
              }
            : undefined
        }
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `repeating-linear-gradient(
            82deg,
            ${URANUS_PALETTE.deepTeal} 0%,
            ${URANUS_PALETTE.deepTeal} 6%,
            ${URANUS_PALETTE.cyanBlue} 7%,
            ${URANUS_PALETTE.cyanBlue} 18%,
            ${URANUS_PALETTE.glacialAqua} 19%,
            ${URANUS_PALETTE.glacialAqua} 32%,
            ${URANUS_PALETTE.paleCyanIce} 34%,
            ${URANUS_PALETTE.paleCyanIce} 46%,
            ${URANUS_PALETTE.frostedMint} 48%,
            ${URANUS_PALETTE.frostedMint} 56%,
            ${URANUS_PALETTE.paleCyanIce} 58%,
            ${URANUS_PALETTE.paleCyanIce} 68%,
            ${URANUS_PALETTE.glacialAqua} 70%,
            ${URANUS_PALETTE.glacialAqua} 82%,
            ${URANUS_PALETTE.deepTeal} 84%,
            ${URANUS_PALETTE.slateNavy} 100%
          )`,
          mixBlendMode: 'soft-light',
        }}
      />
    </div>
  )
}

