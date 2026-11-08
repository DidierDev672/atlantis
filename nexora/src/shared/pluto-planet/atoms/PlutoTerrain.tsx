import { motion } from 'motion/react'
import { PLUTO_PALETTE, PLUTO_GRADIENTS } from '../lib/colors'

interface PlutoTerrainProps {
  animated?: boolean
}

/**
 * Átomo: Terreno Geológico y Cráteres Ancestrales de Plutón.
 *
 * Muestra las tierras altas de tolinas, cañones glaciares y llanuras
 * ricas en hielo de nitrógeno, metano y monóxido de carbono.
 */
export function PlutoTerrain({ animated = true }: PlutoTerrainProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full select-none"
      style={{
        background: PLUTO_GRADIENTS.surface,
      }}
    >
      {/* Capa de textura geológica y fallas tectónicas de hielo */}
      <motion.div
        className="absolute inset-0 opacity-70"
        animate={
          animated
            ? {
                x: ['-8%', '8%', '-8%'],
              }
            : undefined
        }
        transition={{
          duration: 34,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(ellipse at 35% 65%, 
            ${PLUTO_PALETTE.nitrogenSand}44 0%, 
            ${PLUTO_PALETTE.mysticPurple}66 40%, 
            ${PLUTO_PALETTE.tholinUmber}88 80%, 
            transparent 100%)`,
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Cráteres tenues en el hemisferio superior */}
      <div
        className="absolute top-[18%] left-[28%] size-[14%] rounded-full opacity-40 border"
        style={{
          borderColor: `${PLUTO_PALETTE.nitrogenSand}88`,
          background: `radial-gradient(circle, ${PLUTO_PALETTE.tholinUmber} 0%, transparent 80%)`,
        }}
      />
      <div
        className="absolute top-[26%] left-[64%] size-[9%] rounded-full opacity-35 border"
        style={{
          borderColor: `${PLUTO_PALETTE.nitrogenSand}66`,
          background: `radial-gradient(circle, ${PLUTO_PALETTE.tholinUmber} 0%, transparent 80%)`,
        }}
      />
    </div>
  )
}

