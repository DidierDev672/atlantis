import { motion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

export interface BasuraAbiertaAnimadaProps {
  className?: string
}

const lidVariants: Variants = {
  rest: {
    y: 0,
    rotate: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  hover: {
    y: -2.5,
    rotate: -28,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 18,
    },
  },
}

const binVariants: Variants = {
  rest: {
    scaleY: 1,
    transition: { duration: 0.2 },
  },
  hover: {
    scaleY: [1, 0.94, 1],
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

/**
 * Átomo: Icono de papelera FontAwesome (`faTrash`) cuya tapa se abre suavemente
 * cuando el botón padre o contenedor entra en estado `hover`.
 */
export function BasuraAbiertaAnimada({
  className = '',
}: BasuraAbiertaAnimadaProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block size-3.5 shrink-0 ${className}`}
    >
      {/* Cuerpo de la basura */}
      <motion.span
        variants={binVariants}
        className="absolute inset-0 flex items-center justify-center"
        style={{ clipPath: 'inset(23.5% 0 0 0)' }}
      >
        <FontAwesomeIcon icon={faTrash} className="size-3.5" />
      </motion.span>

      {/* Tapa superior articulada desde la bisagra izquierda */}
      <motion.span
        variants={lidVariants}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: 'inset(-15% 0 76.5% 0)',
          transformOrigin: '15% 20%',
        }}
      >
        <FontAwesomeIcon icon={faTrash} className="size-3.5" />
      </motion.span>
    </span>
  )
}
