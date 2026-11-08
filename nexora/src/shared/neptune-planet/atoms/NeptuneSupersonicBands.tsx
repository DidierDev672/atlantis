import { motion } from 'motion/react'
import { NEPTUNE_PALETTE, NEPTUNE_GRADIENTS } from '../lib/colors'

interface NeptuneSupersonicBandsProps {
  animated?: boolean
}

/**
 * Átomo: Bandas Gaseosas Supersónicas de Neptuno.
 *
 * Muestra el manto azul profundo y los vientos más veloces del Sistema Solar (>2.100 km/h),
 * con cinturones de cian y cobalto en desplazamiento continuo.
 */
export function NeptuneSupersonicBands({ animated = true }: NeptuneSupersonicBandsProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full select-none"
      style={{
        background: NEPTUNE_GRADIENTS.surface,
      }}
    >
      {/* Capa de bandas dinámicas con desplazamiento continuo */}
      <motion.div
        className="absolute inset-0 opacity-80"
        animate={
          animated
            ? {
                x: ['-14%', '14%', '-14%'],
              }
            : undefined
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `repeating-linear-gradient(
            180deg,
            ${NEPTUNE_PALETTE.abyssalNavy} 0%,
            ${NEPTUNE_PALETTE.abyssalNavy} 4%,
            ${NEPTUNE_PALETTE.royalCobalt} 5%,
            ${NEPTUNE_PALETTE.royalCobalt} 14%,
            ${NEPTUNE_PALETTE.azureVivid} 15%,
            ${NEPTUNE_PALETTE.azureVivid} 28%,
            ${NEPTUNE_PALETTE.electricBlue} 30%,
            ${NEPTUNE_PALETTE.electricBlue} 44%,
            ${NEPTUNE_PALETTE.azureVivid} 46%,
            ${NEPTUNE_PALETTE.azureVivid} 60%,
            ${NEPTUNE_PALETTE.royalCobalt} 62%,
            ${NEPTUNE_PALETTE.royalCobalt} 76%,
            ${NEPTUNE_PALETTE.abyssalNavy} 78%,
            ${NEPTUNE_PALETTE.abyssalNavy} 100%
          )`,
          mixBlendMode: 'soft-light',
        }}
      />
    </div>
  )
}

