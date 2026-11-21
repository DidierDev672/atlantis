import { Suspense, memo } from 'react'
import { motion } from 'motion/react'
import type { RocketProps } from '../../../../shared/rocket/types'
import { lazyWithFallback } from '../../application/lazy-with-fallback'

const LazyRocket = lazyWithFallback<RocketProps>(
  () => import('../../../../shared/rocket/organisms/Rocket').then((m) => m.Rocket),
  'Rocket en ServicioHabitacionGuardadoOverlay',
)

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
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 text-center font-sans select-none"
      >
        <motion.div
          initial={{ scale: 0.94, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="border-line/60 bg-panel relative rounded-3xl border p-3 shadow-2xl">
            <Suspense fallback={<div className="size-32" aria-hidden="true" />}>
              <LazyRocket
                launch={true}
                autoLaunch={true}
                interactive={false}
                size="md"
                showStars={false}
                showPad={true}
              />
            </Suspense>
          </div>

          <div className="mt-5 max-w-sm space-y-1.5">
            <h3 className="font-sans text-lg font-bold tracking-wide text-white">
              Registrando Categoría
            </h3>
            <p className="text-xs leading-relaxed text-white/80">
              Guardando la categoría del menú, por favor espera un momento…
            </p>
          </div>
        </motion.div>
      </motion.div>
    )
  },
)
