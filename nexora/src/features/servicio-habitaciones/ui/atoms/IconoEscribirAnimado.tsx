import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'

export interface IconoEscribirAnimadoProps {
  className?: string
}

/**
 * Átomo: Ícono animado de edición para cabeceras.
 * Al hacer hover simula el trazo de escritura (oscilación del lápiz y línea
 * de tinta trazándose de izquierda a derecha), respetando `prefers-reduced-motion`.
 */
export function IconoEscribirAnimado({
  className = '',
}: IconoEscribirAnimadoProps) {
  const [isWriting, setIsWriting] = useState(false)
  const reducedMotion = useReducedMotion() ?? false

  return (
    <motion.div
      onMouseEnter={() => setIsWriting(true)}
      onMouseLeave={() => setIsWriting(false)}
      whileHover={reducedMotion ? undefined : { scale: 1.06 }}
      whileTap={reducedMotion ? undefined : { scale: 0.94 }}
      aria-hidden="true"
      className={`bg-primary/10 text-primary hover:bg-primary/20 relative grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl transition-colors duration-200 ${className}`}
    >
      <motion.span
        className="relative z-10 inline-flex items-center justify-center"
        animate={
          isWriting && !reducedMotion
            ? {
                x: [-1.5, 1.5, -0.5, 2, 0],
                y: [0.5, -1, 0.5, -0.5, 0],
                rotate: [0, -11, 5, -9, 0],
              }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={
          isWriting && !reducedMotion
            ? {
                duration: 0.75,
                repeat: Infinity,
                repeatDelay: 0.2,
                ease: 'easeInOut',
              }
            : { duration: 0.2, ease: 'easeOut' }
        }
      >
        <FontAwesomeIcon
          icon={faPenToSquare}
          className="size-4"
          aria-hidden="true"
        />
      </motion.span>

      {/* Trazo de tinta animado de izquierda a derecha durante el hover */}
      <motion.span
        className="bg-primary/80 pointer-events-none absolute right-2.5 bottom-1.5 left-2.5 h-0.5 origin-left rounded-full"
        initial={false}
        animate={
          isWriting && !reducedMotion
            ? {
                scaleX: [0, 0.6, 1, 1],
                opacity: [0, 1, 1, 0.25],
              }
            : {
                scaleX: 0,
                opacity: 0,
              }
        }
        transition={
          isWriting && !reducedMotion
            ? {
                duration: 0.75,
                repeat: Infinity,
                repeatDelay: 0.2,
                ease: 'easeInOut',
              }
            : { duration: 0.18, ease: 'easeOut' }
        }
      />
    </motion.div>
  )
}
