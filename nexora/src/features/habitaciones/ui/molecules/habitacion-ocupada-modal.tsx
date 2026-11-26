import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { HabitacionOcupadaModel } from '../../domain/habitacion-ocupada'
import { HabitacionOcupadaTabla } from './habitacion-ocupada-tabla'

export interface HabitacionOcupadaModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  model: HabitacionOcupadaModel
}

/**
 * Modal de advertencia cuando una habitación está ocupada.
 * Adaptado a hardware/VRAM: elimina el doble `backdrop-blur-2xl`/`blur-3xl`
 * y respeta `enableBackdropBlur` y `enableAnimations`.
 */
export const HabitacionOcupadaModal = memo(function HabitacionOcupadaModal({
  isOpen,
  onClose,
  onBack,
  model,
}: HabitacionOcupadaModalProps) {
  const { policy } = useDeviceResourceProfile()

  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isOpen, onClose])

  if (typeof document === 'undefined') return null
  if (!isOpen && !policy.enableAnimations) return null

  const backdropClass = policy.enableBackdropBlur
    ? 'fixed inset-0 cursor-pointer bg-stone-950/75 backdrop-blur-xs'
    : 'fixed inset-0 cursor-pointer bg-stone-950/85'

  const panelClass = `relative z-10 my-auto max-h-[92vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-3xl border border-rose-500/30 bg-panel p-5 ring-1 ring-white/10 sm:p-8 ${
    policy.enableBackdropBlur ? 'shadow-xl' : 'shadow-md'
  }`

  return createPortal(
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className={backdropClass}
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-ocupada-title"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={panelClass}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="border-line bg-canvas/80 text-ink-muted hover:bg-panel hover:text-ink absolute top-5 right-5 z-30 grid size-8.5 cursor-pointer place-items-center rounded-full border shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
                title="Cerrar aviso (Esc)"
                aria-label="Cerrar modal"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="pointer-events-none size-4"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="space-y-2 pr-6 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 font-mono text-xs font-black tracking-wider text-rose-700 uppercase dark:text-rose-300">
                    <span className="size-2 rotate-45 rounded-xs bg-rose-600 shadow-xs" />
                    Habitación {model.roomNumber} · OCUPADA
                  </span>
                </div>

                <h2
                  id="modal-ocupada-title"
                  className="text-ink text-2xl font-black tracking-tight sm:text-3xl"
                >
                  Habitación actualmente ocupada
                </h2>
                <p className="text-ink-muted text-xs leading-relaxed sm:text-sm">
                  Tranquilo(a), tu inventario está protegido. Esta habitación ya
                  cuenta con huéspedes alojados en este momento. Por políticas
                  de confort y seguridad,{' '}
                  <strong className="text-ink font-semibold">
                    no es posible asignar más huéspedes
                  </strong>{' '}
                  mientras la estancia permanezca activa.
                </p>
              </div>

              <HabitacionOcupadaTabla model={model} showDetailedGuests={true} />

              <div className="border-line/60 flex flex-col-reverse items-center justify-end gap-3 border-t pt-3 sm:flex-row">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBack()
                  }}
                  className="border-line bg-canvas/80 text-ink-muted hover:border-primary/40 hover:bg-panel hover:text-ink inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors sm:w-auto"
                  title="Volver y seleccionar otra habitación disponible"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="pointer-events-none size-4"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  <span>Cambiar de habitación</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-500/50 bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-700 sm:w-auto"
                >
                  <span>Entendido / Consultar Habitación</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="pointer-events-none size-4"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body
  )
})
