import { motion } from 'motion/react'
import { PLUTO_PALETTE } from '../lib/colors'

interface PlutoCthulhuMaculaProps {
  animated?: boolean
}

/**
 * Átomo: Región Oscura de Cthulhu Macula ("La Ballena") y Montes Glaciares.
 *
 * Franja ecuatorial oscura compuesta por tolinas ancestrales (#2E1C48, #403C34),
 * flanqueada por las cordilleras de hielo de agua Montes Hillary y Montes Norgay.
 */
export function PlutoCthulhuMacula({ animated = true }: PlutoCthulhuMaculaProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[4%] top-[56%] select-none"
      style={{
        width: '42%',
        height: '32%',
      }}
    >
      <motion.div
        className="size-full rounded-full opacity-85"
        animate={
          animated
            ? {
                x: ['-4%', '4%', '-4%'],
              }
            : undefined
        }
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(ellipse at 40% 50%, 
            ${PLUTO_PALETTE.kuiperViolet} 0%, 
            ${PLUTO_PALETTE.tholinUmber} 60%, 
            transparent 100%)`,
        }}
      >
        {/* Picos montañosos de hielo de agua (Montes Norgay) */}
        <div
          className="absolute right-[12%] top-[18%] size-[18%] rotate-45 opacity-60"
          style={{
            background: `linear-gradient(135deg, ${PLUTO_PALETTE.heartGlacier} 0%, ${PLUTO_PALETTE.tholinUmber} 100%)`,
          }}
        />
        <div
          className="absolute right-[28%] top-[34%] size-[14%] rotate-45 opacity-55"
          style={{
            background: `linear-gradient(135deg, ${PLUTO_PALETTE.heartGlacier} 0%, ${PLUTO_PALETTE.kuiperViolet} 100%)`,
          }}
        />
      </motion.div>
    </div>
  )
}

