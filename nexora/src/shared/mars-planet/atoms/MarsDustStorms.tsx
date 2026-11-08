import { motion } from 'motion/react'
import { MARS_PALETTE } from '../lib/colors'

interface MarsDustStormsProps {
  animated?: boolean
}

/**
 * Átomo: Tormentas de polvo de arena marciana (#F2D091) y partículas de óxido (#F2935C)
 * que se desplazan a diferentes velocidades sobre la superficie.
 */
export function MarsDustStorms({ animated = true }: MarsDustStormsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Capa de polvo rápido en el ecuador */}
      <motion.div
        className="absolute top-[38%] left-0 w-[200%] h-[24%]"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${MARS_PALETTE.sand}55 0%, transparent 60%),
                       radial-gradient(ellipse at 80% 50%, ${MARS_PALETTE.rust}66 0%, transparent 55%)`,
          filter: 'blur(3px)',
        }}
        animate={
          animated
            ? {
                x: ['0%', '-50%'],
              }
            : { x: '0%' }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Capa de polvo meridional más tenue */}
      <motion.div
        className="absolute bottom-[20%] left-0 w-[200%] h-[18%]"
        style={{
          background: `radial-gradient(ellipse at 40% 50%, ${MARS_PALETTE.sand}44 0%, transparent 50%),
                       radial-gradient(ellipse at 90% 50%, ${MARS_PALETTE.rust}55 0%, transparent 60%)`,
          filter: 'blur(4px)',
        }}
        animate={
          animated
            ? {
                x: ['-50%', '0%'],
              }
            : { x: '0%' }
        }
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}
