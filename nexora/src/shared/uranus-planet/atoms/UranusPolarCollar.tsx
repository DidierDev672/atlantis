import { motion } from 'motion/react'
import { URANUS_PALETTE } from '../lib/colors'

interface UranusPolarCollarProps {
  animated?: boolean
}

/**
 * Átomo: El Collar Polar de Urano (Polar Collar).
 * Estructura circumpolar brillante compuesta por partículas de niebla fotoquímica
 * condensada que rodea el polo iluminado por el Sol.
 */
export function UranusPolarCollar({ animated = true }: UranusPolarCollarProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-[8%] top-[14%] size-[36%] select-none"
    >
      <motion.div
        className="size-full rounded-full opacity-60"
        animate={
          animated
            ? {
                scale: [0.96, 1.04, 0.96],
                opacity: [0.5, 0.72, 0.5],
              }
            : undefined
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle, 
            ${URANUS_PALETTE.glacialCream}33 0%, 
            ${URANUS_PALETTE.frostedMint}55 45%, 
            ${URANUS_PALETTE.paleCyanIce}44 70%, 
            transparent 88%)`,
          filter: 'blur(1.5px)',
        }}
      />
    </div>
  )
}

