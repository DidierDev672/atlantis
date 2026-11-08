import { motion } from 'motion/react'
import { JUPITER_PALETTE } from '../lib/colors'

export interface JupiterGreatRedSpotProps {
  animated?: boolean
}

/**
 * Átomo: La legendaria Gran Mancha Roja (Great Red Spot) de Júpiter.
 * La mayor tormenta anticiclónica del Sistema Solar, modelada en el hemisferio sur
 * con terracota (#D26F37), núcleo en ámbar dorado (#FEAC4D) y borde en marrón profundo (#82614D).
 */
export function JupiterGreatRedSpot({ animated = true }: JupiterGreatRedSpotProps) {
  return (
    <motion.div
      aria-label="Gran Mancha Roja de Júpiter"
      className="absolute z-10 pointer-events-none"
      style={{
        left: '52%',
        top: '63%',
        width: '32%',
        height: '19%',
        transform: 'translate(-50%, -50%)',
      }}
      animate={
        animated
          ? {
              scale: [1, 1.04, 0.98, 1],
              rotate: [0, -3, 2, 0],
              x: ['0%', '4%', '-3%', '0%'],
            }
          : { scale: 1, rotate: 0 }
      }
      transition={{
        duration: 9,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Sombra de turbulencia alrededor de la mancha */}
      <div
        className="absolute -inset-1 rounded-full opacity-60 blur-[1px]"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${JUPITER_PALETTE.darkBrown} 0%, transparent 75%)`,
        }}
      />

      {/* Óvalo exterior de la Gran Mancha Roja */}
      <div
        className="relative w-full h-full rounded-[50%_45%_52%_48%]"
        style={{
          background: `radial-gradient(ellipse at 42% 38%, 
            ${JUPITER_PALETTE.amberGold} 0%, 
            ${JUPITER_PALETTE.terracotta} 55%, 
            ${JUPITER_PALETTE.darkBrown} 100%)`,
          boxShadow: `0 0 4px ${JUPITER_PALETTE.terracotta}99, inset 0 0 3px ${JUPITER_PALETTE.darkBrown}dd`,
        }}
      >
        {/* Vórtice interior y núcleo concéntrico */}
        <motion.div
          className="absolute inset-[18%] rounded-[48%_52%_46%_54%]"
          style={{
            background: `radial-gradient(circle at 45% 42%, 
              ${JUPITER_PALETTE.amberGold} 0%, 
              ${JUPITER_PALETTE.terracotta} 70%, 
              transparent 100%)`,
          }}
          animate={
            animated
              ? {
                  rotate: [0, -360],
                }
              : undefined
          }
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Ojo del ciclón */}
        <div
          className="absolute left-[38%] top-[34%] size-1.5 rounded-full"
          style={{
            backgroundColor: JUPITER_PALETTE.lightCream,
            opacity: 0.8,
            boxShadow: `0 0 2px ${JUPITER_PALETTE.amberGold}`,
          }}
        />
      </div>
    </motion.div>
  )
}

