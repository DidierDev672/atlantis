import { motion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBowlFood, faFireFlameCurved } from '@fortawesome/free-solid-svg-icons'

export interface PlatoAlimentosAnimadoProps {
  className?: string
}

const STEAM_PATHS = [
  { id: 's1', xOffset: '-translate-x-2', delay: 0 },
  { id: 's2', xOffset: 'translate-x-0', delay: 0.2 },
  { id: 's3', xOffset: 'translate-x-2', delay: 0.4 },
]

const containerVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.06,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

const steamVariants: Variants = {
  rest: {
    opacity: 0,
    y: 4,
    scale: 0.7,
    transition: { duration: 0.15 },
  },
  hover: (delay: number) => ({
    opacity: [0, 0.85, 0],
    y: [4, -10],
    scale: [0.7, 1.1, 0.85],
    transition: {
      duration: 1.05,
      repeat: Infinity,
      delay,
      ease: 'easeOut',
    },
  }),
}

const bowlVariants: Variants = {
  rest: {
    y: 0,
    rotate: 0,
    transition: { duration: 0.2 },
  },
  hover: {
    y: [0, -2, 0, -1.5, 0],
    rotate: [0, -4, 4, -2, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const flameVariants: Variants = {
  rest: {
    opacity: 0,
    scale: 0.6,
    transition: { duration: 0.15 },
  },
  hover: {
    opacity: [0.65, 1, 0.65],
    scale: [0.9, 1.08, 0.9],
    transition: {
      duration: 0.7,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * Átomo: Icono animado de plato de alimentos con FontAwesome.
 * La animación de cocción (vapor, movimiento suave y llama cálida) se reproduce únicamente en estado hover.
 */
export function PlatoAlimentosAnimado({
  className = '',
}: PlatoAlimentosAnimadoProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="rest"
      animate="rest"
      whileHover="hover"
      aria-hidden="true"
      title="Preparando platillo"
      className={`relative grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors duration-300 hover:border-amber-500/40 hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 ${className}`}
    >
      {/* Vapor ascendente únicamente en hover */}
      <div className="pointer-events-none absolute -top-2 inset-x-0 flex justify-center">
        {STEAM_PATHS.map((steam) => (
          <motion.span
            key={steam.id}
            custom={steam.delay}
            variants={steamVariants}
            className={`absolute h-2.5 w-1 rounded-full bg-amber-500/70 blur-[0.5px] ${steam.xOffset}`}
          />
        ))}
      </div>

      {/* Plato de alimento FontAwesome con movimiento de cocción únicamente en hover */}
      <motion.div
        variants={bowlVariants}
        className="relative z-10 flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faBowlFood} className="size-5" />
      </motion.div>

      {/* Brasa/fuego cálido debajo del plato únicamente en hover */}
      <motion.span
        variants={flameVariants}
        className="pointer-events-none absolute bottom-1 text-orange-500"
      >
        <FontAwesomeIcon icon={faFireFlameCurved} className="size-2.5" />
      </motion.span>
    </motion.div>
  )
}
