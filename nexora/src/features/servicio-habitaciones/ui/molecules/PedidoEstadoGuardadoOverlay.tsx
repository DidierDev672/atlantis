import { Suspense, lazy, memo, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { RocketProps } from '../../../../shared/rocket/types'

const LazyRocket = lazy<ComponentType<RocketProps>>(async () => {
  try {
    const mod = await import('../../../../shared/rocket/organisms/Rocket')
    return { default: mod.Rocket }
  } catch (error) {
    console.error('Error loading Rocket organism:', error)
    const Fallback: ComponentType<RocketProps> = () => null
    return { default: Fallback }
  }
})

export interface PedidoEstadoGuardadoOverlayProps {
  visible: boolean
}

/**
 * Molécula: Overlay modal animado con Rocket mientras se construye y envía el payload
 * de actualización de estado hacia `PUT /service-requests/{id}`.
 */
export const PedidoEstadoGuardadoOverlay = memo(
  function PedidoEstadoGuardadoOverlay({
    visible,
  }: PedidoEstadoGuardadoOverlayProps) {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/75 p-4 text-center backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="flex flex-col items-center"
            >
              <div className="bg-panel/90 relative rounded-3xl border border-white/20 p-3 shadow-2xl backdrop-blur-xl">
                <Suspense fallback={<div className="size-32" aria-hidden="true" />}>
                  <LazyRocket
                    launch={true}
                    autoLaunch={true}
                    interactive={false}
                    size="md"
                    showStars={true}
                    showPad={true}
                  />
                </Suspense>
              </div>

              <div className="mt-5 max-w-sm space-y-1.5">
                <h3 className="font-sans text-lg font-bold tracking-wide text-white">
                  Guardando Estado del Pedido
                </h3>
                <p className="text-xs leading-relaxed text-white/80">
                  Construyendo y enviando la actualización a cocina, por favor espera un momento…
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  },
)
