import { motion } from 'motion/react'
import { NEPTUNE_PALETTE } from '../lib/colors'

interface NeptuneScooterCloudsProps {
  animated?: boolean
}

/**
 * Átomo: Cirros de Metano y Nube "Scooter" de Neptuno.
 *
 * Muestra la famosa nube blanca "Scooter" que orbita a velocidades hipersónicas
 * y los penachos de cirros de hielo de metano de gran altitud (#89F3FF).
 */
export function NeptuneScooterClouds({ animated = true }: NeptuneScooterCloudsProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full select-none"
    >
      {/* Nube "Scooter" (Cuerpo blanco-cian rápido a 42°S) */}
      <motion.div
        className="absolute top-[68%] left-[55%] h-[5%] w-[16%] rounded-full opacity-90"
        animate={
          animated
            ? {
                x: ['-40%', '60%', '-40%'],
                scale: [0.95, 1.15, 0.95],
                opacity: [0.75, 1, 0.75],
              }
            : undefined
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(ellipse at center, ${NEPTUNE_PALETTE.luminousCyan} 0%, transparent 85%)`,
          filter: 'blur(0.8px)',
          boxShadow: `0 0 6px 1px ${NEPTUNE_PALETTE.luminousCyan}88`,
        }}
      />

      {/* Racha ecuatorial de cirros (vientos supersónicos) */}
      <motion.div
        className="absolute top-[32%] left-[10%] h-[3%] w-[35%] rounded-full opacity-70"
        animate={
          animated
            ? {
                x: ['-25%', '30%', '-25%'],
                opacity: [0.55, 0.85, 0.55],
              }
            : undefined
        }
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `linear-gradient(90deg, transparent, ${NEPTUNE_PALETTE.luminousCyan}, ${NEPTUNE_PALETTE.electricBlue}, transparent)`,
          filter: 'blur(1px)',
        }}
      />

      {/* Racha templada norte */}
      <motion.div
        className="absolute top-[20%] left-[45%] h-[3%] w-[25%] rounded-full opacity-65"
        animate={
          animated
            ? {
                x: ['20%', '-25%', '20%'],
                opacity: [0.45, 0.75, 0.45],
              }
            : undefined
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `linear-gradient(90deg, transparent, ${NEPTUNE_PALETTE.luminousCyan}, transparent)`,
          filter: 'blur(0.8px)',
        }}
      />
    </div>
  )
}

