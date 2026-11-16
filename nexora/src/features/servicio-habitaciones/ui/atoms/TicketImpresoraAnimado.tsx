import { motion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faReceipt } from '@fortawesome/free-solid-svg-icons'

export interface TicketImpresoraAnimadoProps {
  className?: string
}

const receiptVariants: Variants = {
  rest: {
    y: 0,
    scaleY: 1,
    rotate: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
  hover: {
    y: [0, -10, -5.5, -2, 0],
    scaleY: [1, 0.86, 1.04, 0.98, 1],
    rotate: [0, -2.5, 2, -1, 0],
    opacity: [1, 0.2, 0.9, 1, 1],
    transition: {
      duration: 0.72,
      times: [0, 0.18, 0.48, 0.76, 1],
      ease: 'easeOut',
    },
  },
}

const slotVariants: Variants = {
  rest: {
    opacity: 0,
    scaleX: 0.4,
    transition: { duration: 0.18 },
  },
  hover: {
    opacity: [0, 0.95, 0.95, 0],
    scaleX: [0.4, 1, 1, 0.5],
    transition: {
      duration: 0.72,
      times: [0, 0.15, 0.8, 1],
      ease: 'easeOut',
    },
  },
}

const thermalBeamVariants: Variants = {
  rest: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15 },
  },
  hover: {
    opacity: [0, 0.9, 0.85, 0],
    y: [-6, 5, -2, 6],
    transition: {
      duration: 0.68,
      times: [0, 0.25, 0.75, 1],
      ease: 'easeInOut',
    },
  },
}

/**
 * Átomo: Icono de recibo FontAwesome (`faReceipt`) con efecto de impresión
 * térmica al pasar el cursor (`hover`) sobre el contenedor padre.
 */
export function TicketImpresoraAnimado({
  className = '',
}: TicketImpresoraAnimadoProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex size-6 items-center justify-center overflow-hidden ${className}`}
    >
      {/* Ranura superior de salida del papel térmico */}
      <motion.span
        variants={slotVariants}
        className="bg-primary/70 pointer-events-none absolute top-0.5 left-1/2 h-[1.5px] w-5 -translate-x-1/2 rounded-full"
      />

      {/* Haz de cabezal térmico recorriendo el ticket */}
      <motion.span
        variants={thermalBeamVariants}
        className="bg-primary pointer-events-none absolute left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full"
      />

      {/* Comanda / Ticket imprimiéndose paso a paso */}
      <motion.span
        variants={receiptVariants}
        className="inline-flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faReceipt} className="size-4" />
      </motion.span>
    </span>
  )
}
