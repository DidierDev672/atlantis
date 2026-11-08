import { motion } from 'motion/react'
import { NEPTUNE_PALETTE } from '../lib/colors'

interface NeptuneGreatDarkSpotProps {
  animated?: boolean
}

/**
 * Átomo: La Gran Mancha Oscura de Neptuno (The Great Dark Spot).
 * Enorme tormenta anticiclónica del tamaño de la Tierra descubierta por la sonda Voyager 2,
 * acompañada de nubes cirro brillantes de metano (#89F3FF) en sus bordes exteriores.
 */
export function NeptuneGreatDarkSpot({ animated = true }: NeptuneGreatDarkSpotProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[26%] top-[56%] select-none"
      style={{
        width: '32%',
        height: '18%',
      }}
    >
      {/* Vórtice principal oscuro */}
      <motion.div
        className="size-full rounded-[50%/60%] shadow-inner"
        animate={
          animated
            ? {
                scale: [1, 1.05, 1],
                rotate: [-2, 2, -2],
              }
            : undefined
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(ellipse at 45% 45%, 
            ${NEPTUNE_PALETTE.abyssalNavy} 0%, 
            ${NEPTUNE_PALETTE.royalCobalt} 70%, 
            transparent 100%)`,
          boxShadow: `inset 0 0 8px 1px ${NEPTUNE_PALETTE.abyssalNavy}`,
        }}
      >
        {/* Nube compañera cirro de metano blanco-cian en el borde sur */}
        <motion.div
          className="absolute -bottom-[12%] right-[10%] h-[35%] w-[65%] rounded-full opacity-85"
          animate={
            animated
              ? {
                  x: ['-10%', '15%', '-10%'],
                  opacity: [0.7, 0.95, 0.7],
                }
              : undefined
          }
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${NEPTUNE_PALETTE.luminousCyan}, transparent)`,
            filter: 'blur(0.8px)',
          }}
        />

        {/* Nube cirro secundaria superior */}
        <div
          className="absolute -top-[10%] left-[15%] h-[25%] w-[45%] rounded-full opacity-70"
          style={{
            background: `linear-gradient(90deg, transparent, ${NEPTUNE_PALETTE.luminousCyan}, transparent)`,
            filter: 'blur(0.6px)',
          }}
        />
      </motion.div>
    </div>
  )
}

