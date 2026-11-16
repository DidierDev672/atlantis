import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping } from '@fortawesome/free-solid-svg-icons'

export interface CarritoFlotanteFabProps {
  totalArticulos: number
  onClick: () => void
  className?: string
}

/**
 * Átomo: Botón superior del carrito con insignia dinámica del número de productos agregados.
 */
export function CarritoFlotanteFab({
  totalArticulos,
  onClick,
  className = '',
}: CarritoFlotanteFabProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.96 }}
      aria-label={`Abrir carrito (${totalArticulos} productos agregados)`}
      title="Ver productos agregados al carrito"
      className={`bg-primary shadow-primary/25 hover:bg-primary/95 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-3.5 py-2.5 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md transition-colors ${className}`}
    >
      <span className="relative flex size-4 items-center justify-center">
        <FontAwesomeIcon icon={faCartShopping} className="size-4" />
      </span>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={totalArticulos}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="text-primary inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-black shadow-xs"
        >
          {totalArticulos}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

