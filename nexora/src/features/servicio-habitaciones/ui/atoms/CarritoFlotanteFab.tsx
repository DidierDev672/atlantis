import { memo } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'

export interface CarritoFlotanteFabProps {
  totalArticulos: number
  onClick: () => void
  className?: string
}

/**
 * Átomo: Botón superior del carrito con insignia dinámica del número de productos agregados.
 * Envuelto en `React.memo` y adaptado al perfil de hardware sin `AnimatePresence mode="popLayout"`.
 */
export const CarritoFlotanteFab = memo(function CarritoFlotanteFab({
  totalArticulos,
  onClick,
  className = '',
}: CarritoFlotanteFabProps) {
  const {
    policy: { enableAnimations, tier },
  } = useDeviceResourceProfile()

  const canAnimate = enableAnimations && tier !== 'ultra-light'
  const baseClassName = `bg-primary shadow-primary/25 hover:bg-primary/95 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-3.5 py-2.5 text-white shadow-lg ring-1 ring-white/20 transition-colors ${className}`

  if (!canAnimate) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Abrir carrito (${totalArticulos} productos agregados)`}
        title="Ver productos agregados al carrito"
        style={{ contain: 'layout style paint' }}
        className={baseClassName}
      >
        <span className="relative flex size-4 items-center justify-center">
          <FontAwesomeIcon icon={faCartShopping} className="size-4" />
        </span>

        <span className="text-primary inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-black shadow-xs">
          {totalArticulos}
        </span>
      </button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.96 }}
      aria-label={`Abrir carrito (${totalArticulos} productos agregados)`}
      title="Ver productos agregados al carrito"
      style={{ contain: 'layout style paint' }}
      className={baseClassName}
    >
      <span className="relative flex size-4 items-center justify-center">
        <FontAwesomeIcon icon={faCartShopping} className="size-4" />
      </span>

      <motion.span
        key={tier === 'full' ? totalArticulos : 'static-count'}
        initial={tier === 'full' ? { scale: 0.85, opacity: 0.7 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="text-primary inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-black shadow-xs"
      >
        {totalArticulos}
      </motion.span>
    </motion.button>
  )
})
