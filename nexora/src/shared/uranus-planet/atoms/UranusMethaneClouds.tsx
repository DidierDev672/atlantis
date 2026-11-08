import { motion } from 'motion/react'
import { URANUS_PALETTE } from '../lib/colors'

interface UranusMethaneCloudsProps {
  animated?: boolean
}

/**
 * Átomo: Cirros de Metano de Gran Altitud en Urano.
 * Nubes brillantes de cristales de hielo de metano detectadas por Hubble y Keck,
 * que se desplazan a altas velocidades en la alta atmósfera.
 */
export function UranusMethaneClouds({ animated = true }: UranusMethaneCloudsProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full select-none"
    >
      {/* Cirro de metano 1 (Banda ecuatorial alta) */}
      <motion.div
        className="absolute top-[38%] left-[12%] h-[4%] w-[24%] rounded-full opacity-70"
        animate={
          animated
            ? {
                x: ['-20%', '35%', '-20%'],
                opacity: [0.55, 0.85, 0.55],
              }
            : undefined
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `linear-gradient(90deg, transparent, ${URANUS_PALETTE.glacialCream}, transparent)`,
          filter: 'blur(1px)',
        }}
      />

      {/* Cirro de metano 2 (Banda media templada) */}
      <motion.div
        className="absolute top-[52%] left-[40%] h-[3.5%] w-[32%] rounded-full opacity-60"
        animate={
          animated
            ? {
                x: ['25%', '-30%', '25%'],
                opacity: [0.45, 0.75, 0.45],
              }
            : undefined
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `linear-gradient(90deg, transparent, ${URANUS_PALETTE.frostedMint}, transparent)`,
          filter: 'blur(1.2px)',
        }}
      />

      {/* Foco brillante aislado en latitud polar */}
      <motion.div
        className="absolute top-[24%] left-[62%] size-[6%] rounded-full opacity-65"
        animate={
          animated
            ? {
                scale: [0.9, 1.25, 0.9],
                opacity: [0.5, 0.8, 0.5],
              }
            : undefined
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle, ${URANUS_PALETTE.glacialCream} 0%, transparent 80%)`,
        }}
      />
    </div>
  )
}

