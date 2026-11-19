import { motion, AnimatePresence } from 'motion/react'
import { Rocket } from '../../../../shared/rocket/organisms/Rocket'

export interface ProductoGuardadoOverlayProps {
  visible: boolean
}

/**
 * Molécula: Overlay modal animado con Rocket mientras se envía el producto a POST /item-menu.
 */
export function ProductoGuardadoOverlay({
  visible,
}: ProductoGuardadoOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 p-4 text-center backdrop-blur-md select-none"
        >
          <motion.div
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="flex flex-col items-center"
          >
            <div className="bg-panel relative rounded-3xl border border-white/20 p-3 shadow-2xl">
              <Rocket
                launch={true}
                autoLaunch={true}
                interactive={false}
                size="md"
                showStars={true}
                showPad={true}
              />
            </div>

            <div className="mt-5 max-w-sm space-y-1.5">
              <h3 className="font-serif text-lg font-bold tracking-wide text-white">
                Registrando Producto
              </h3>
              <p className="text-xs leading-relaxed text-white/80">
                Guardando el producto en el catálogo, por favor espera un momento…
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
