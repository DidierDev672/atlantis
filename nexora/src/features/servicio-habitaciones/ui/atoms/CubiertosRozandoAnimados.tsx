import { motion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'

export interface CubiertosRozandoAnimadosProps {
  className?: string
}

const forkVariants: Variants = {
  rest: {
    x: 0,
    y: 0,
    rotate: 0,
    transition: { duration: 0.24, ease: 'easeOut' },
  },
  hover: {
    x: [0, 2, 1.5, 2.2, 0],
    y: [0, -1.5, 1, -1.5, 0],
    rotate: [0, 20, 14, 22, 0],
    transition: {
      duration: 0.68,
      ease: 'easeInOut',
    },
  },
}

const knifeVariants: Variants = {
  rest: {
    x: 0,
    y: 0,
    rotate: 0,
    transition: { duration: 0.24, ease: 'easeOut' },
  },
  hover: {
    x: [0, -2, -1.5, -2.2, 0],
    y: [0, 1, -1.5, 1, 0],
    rotate: [0, -20, -14, -22, 0],
    transition: {
      duration: 0.68,
      ease: 'easeInOut',
    },
  },
}

const glintVariants: Variants = {
  rest: {
    opacity: 0,
    scale: 0,
    transition: { duration: 0.15 },
  },
  hover: {
    opacity: [0, 0.95, 0.15, 0.9, 0],
    scale: [0.4, 1.35, 0.7, 1.25, 0],
    transition: {
      duration: 0.68,
      times: [0, 0.28, 0.5, 0.74, 1],
      ease: 'easeOut',
    },
  },
}

/**
 * Átomo: Icono de cubiertos FontAwesome (`faUtensils`) segmentado en tenedor
 * y cuchillo que se inclinan y rozan entre sí en estado `hover`.
 */
export function CubiertosRozandoAnimados({
  className = '',
}: CubiertosRozandoAnimadosProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block size-3.5 shrink-0 ${className}`}
    >
      {/* Tenedor (mitad izquierda de faUtensils) */}
      <motion.span
        variants={forkVariants}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: 'inset(-25% 44% -25% -25%)',
          transformOrigin: '25% 85%',
        }}
      >
        <FontAwesomeIcon icon={faUtensils} className="size-3.5" />
      </motion.span>

      {/* Cuchillo (mitad derecha de faUtensils) */}
      <motion.span
        variants={knifeVariants}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: 'inset(-25% -25% -25% 56%)',
          transformOrigin: '80% 85%',
        }}
      >
        <FontAwesomeIcon icon={faUtensils} className="size-3.5" />
      </motion.span>

      {/* Destello sutil en el punto de roce */}
      <motion.span
        variants={glintVariants}
        className="bg-primary pointer-events-none absolute top-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full"
      />
    </span>
  )
}
