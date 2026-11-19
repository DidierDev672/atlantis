import { memo } from 'react'
import { motion } from 'motion/react'
import { Rocket } from '../../../../shared/rocket/organisms/Rocket'

export interface ServicioHabitacionGuardadoOverlayProps {
  visible: boolean
}

/**
 * Molécula: Overlay modal con animación Rocket durante `POST /menu-category`.
 * Se carga perezosamente con `React.lazy` únicamente cuando `saving === true`
 * y prescinde de `backdrop-blur-md` / `backdrop-blur-xl` para evitar sobrecarga de GPU.
 */
export const ServicioHabitacionGuardadoOverlay = memo(
  function ServicioHabitacionGuardadoOverlay({
    visible,
  }: ServicioHabitacionGuardadoOverlayProps) {
    if (!visible) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 text-center select-none"
      >
        <motion.div
          initial={{ scale: 0.94, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="border-line/60 bg-panel relative rounded-3xl border p-3 shadow-2xl">
            <Rocket
              launch={true}
              autoLaunch={true}
              interactive={false}
              size="md"
              showStars={false}
              showPad={true}
            />
          </div>

          <div className="mt-5 max-w-sm space-y-1.5">
            <h3 className="font-serif text-lg font-bold tracking-wide text-white">
              Despachando Orden de Servicio
            </h3>
            <p className="text-xs leading-relaxed text-white/80">
              Registrando la categoría de servicio, por favor espera un momento…
            </p>
          </div>
        </motion.div>
      </motion.div>
    )
  },
)
