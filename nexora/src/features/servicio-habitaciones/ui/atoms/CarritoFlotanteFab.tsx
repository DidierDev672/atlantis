import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping } from '@fortawesome/free-solid-svg-icons'

export interface CarritoFlotanteFabProps {
  totalArticulos: number
  onClick: () => void
}

/**
 * Átomo: Botón flotante del carrito con insignia dinámica del número de productos agregados.
 */
export function CarritoFlotanteFab({
  totalArticulos,
  onClick,
}: CarritoFlotanteFabProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Abrir carrito (${totalArticulos} productos agregados)`}
      title="Ver productos agregados al carrito"
      className="bg-primary shadow-primary/35 hover:bg-primary/95 fixed right-6 bottom-6 z-40 inline-flex cursor-pointer items-center gap-3 rounded-full px-4 py-3.5 text-white shadow-xl ring-2 ring-white/25 backdrop-blur-md transition-colors"
    >
      <span className="relative flex size-6 items-center justify-center">
        <FontAwesomeIcon icon={faCartShopping} className="size-5" />
      </span>

      <span className="hidden text-xs font-extrabold tracking-wide sm:inline">
        Carrito
      </span>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={totalArticulos}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="text-primary inline-flex min-w-6 items-center justify-center rounded-full bg-white px-2 py-0.5 text-xs font-black shadow-xs"
        >
          {totalArticulos}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

