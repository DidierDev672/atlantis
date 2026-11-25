import { memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faRotateRight,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { Loading } from '../../../../shared/loading'
import { Input } from '../../../../shared/ui/Input'
import { HotelEdificioAnimado } from '../atoms/HotelEdificioAnimado'
import { useModalRecepciones } from '../../application/use-modal-recepciones'
import type { RecepcionSeleccionada } from '../../domain/estadias-recepcion'
import { RecepcionEstanciaCard } from './RecepcionEstanciaCard'

export type {
  RawStayApi,
  RoomDetailApi,
  ReserveDetailApi,
  PersonDetailApi,
  RecepcionSeleccionada,
} from '../../domain/estadias-recepcion'

interface ModalSeleccionarRecepcionProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (recepcion: RecepcionSeleccionada) => void
  selectedId?: string
}

/**
 * Modal de selección de estancias/recepciones con eliminación de consultas N+1,
 * balanceo de cargas (`api-load-balancer`), validación HTTP (`status-code-validator`)
 * e indicador `/shared/loading`.
 */
export const ModalSeleccionarRecepcion = memo(function ModalSeleccionarRecepcion({
  isOpen,
  onClose,
  onSelect,
  selectedId,
}: ModalSeleccionarRecepcionProps) {
  const {
    policy: { enableBackdropBlur, enableAnimations, tier },
  } = useDeviceResourceProfile()
  const {
    filtradas,
    loading,
    feedback,
    cerrarFeedback,
    busqueda,
    setBusqueda,
    recargar,
  } = useModalRecepciones(isOpen)

  const [selectedRecepcion, setSelectedRecepcion] =
    useState<RecepcionSeleccionada | null>(null)

  const activeSelectedRecepcion = isOpen ? selectedRecepcion : null

  const handleSelectCard = (r: RecepcionSeleccionada) => {
    setSelectedRecepcion(null)
    onSelect(r)
    onClose()
  }

  const handleConfirmar = () => {
    if (activeSelectedRecepcion) {
      onSelect(activeSelectedRecepcion)
      setSelectedRecepcion(null)
      onClose()
    }
  }

  // Efecto de profundidad en pantalla de fondo (#root) solo cuando el perfil de GPU permite animaciones
  useEffect(() => {
    if (!isOpen) return
    const prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const allowRootScale = enableAnimations && tier !== 'ultra-light'
    const rootEl = allowRootScale ? document.getElementById('root') : null
    if (!rootEl) {
      return () => {
        document.body.style.overflow = prevBodyOverflow
      }
    }

    const prevTransition = rootEl.style.transition
    const prevTransform = rootEl.style.transform
    const prevBorderRadius = rootEl.style.borderRadius
    const prevTransformOrigin = rootEl.style.transformOrigin
    const prevOverflow = rootEl.style.overflow
    const prevBodyBg = document.body.style.backgroundColor

    rootEl.style.transition =
      'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.4s cubic-bezier(0.32, 0.72, 0, 1)'
    rootEl.style.transformOrigin = 'center center'
    rootEl.style.transform = 'scale(0.93)'
    rootEl.style.borderRadius = '24px'
    rootEl.style.overflow = 'hidden'
    document.body.style.backgroundColor = '#000000'

    return () => {
      rootEl.style.transition = prevTransition
      rootEl.style.transform = prevTransform
      rootEl.style.borderRadius = prevBorderRadius
      rootEl.style.transformOrigin = prevTransformOrigin
      rootEl.style.overflow = prevOverflow
      document.body.style.overflow = prevBodyOverflow
      document.body.style.backgroundColor = prevBodyBg
    }
  }, [enableAnimations, isOpen, tier])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-recepciones-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            key="backdrop-recepciones"
            initial={enableAnimations ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={enableAnimations ? { opacity: 0 } : undefined}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className={`fixed inset-0 bg-black/60 transition-opacity ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
            aria-hidden="true"
          />

          <motion.div
            key="modal-recepciones-content"
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.8 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 280,
              mass: 0.85,
            }}
            onClick={(e) => e.stopPropagation()}
            className="border-line bg-panel relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border p-6 shadow-2xl transition-all sm:p-8"
          >
            <div className="bg-line/80 mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full" />

            {/* Header */}
            <div className="border-line flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <HotelEdificioAnimado size="md" />
                  <h3
                    id="modal-recepciones-title"
                    className="text-ink font-serif text-lg font-bold"
                  >
                    Recepciones Registradas
                  </h3>
                </div>
                <p className="text-ink-muted mt-1 text-xs">
                  Selecciona la estancia activa que recibirá el servicio de habitación.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void recargar()}
                  disabled={loading}
                  className="text-ink-soft hover:bg-canvas hover:text-ink grid size-8 cursor-pointer place-items-center rounded-xl transition-colors disabled:opacity-50"
                  title="Actualizar estancias"
                  aria-label="Actualizar estancias"
                >
                  <FontAwesomeIcon
                    icon={faRotateRight}
                    className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-ink-soft hover:bg-canvas hover:text-ink grid size-8 cursor-pointer place-items-center rounded-xl transition-colors"
                  aria-label="Cerrar modal"
                >
                  <FontAwesomeIcon icon={faXmark} className="size-4" />
                </button>
              </div>
            </div>

            {/* Validación empática HTTP con StatusCodeAlert */}
            {feedback && (
              <div className="mt-4">
                <StatusCodeAlert
                  validation={feedback}
                  dismissible
                  onClose={cerrarFeedback}
                  actions={
                    <button
                      type="button"
                      onClick={() => void recargar()}
                      disabled={loading}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:border-primary/40 disabled:opacity-60"
                    >
                      <FontAwesomeIcon icon={faRotateRight} className="size-3" />
                      <span>Reintentar</span>
                    </button>
                  }
                />
              </div>
            )}

            {/* Buscador */}
            <div className="mt-4 shrink-0">
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por huésped, documento, teléfono, habitación o piso..."
                aria-label="Buscar estancias"
                icon={<FontAwesomeIcon icon={faMagnifyingGlass} className="size-3.5" />}
                action={
                  busqueda ? (
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      aria-label="Limpiar búsqueda"
                      className="text-ink-soft hover:text-ink grid size-6 cursor-pointer place-items-center rounded-lg"
                    >
                      <FontAwesomeIcon icon={faXmark} className="size-3" />
                    </button>
                  ) : undefined
                }
                autoFocus
              />
            </div>

            {/* Listado o indicador /shared/loading */}
            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-line/60 bg-canvas/40 py-8">
                  <Loading
                    visible={true}
                    variant="block"
                    size="md"
                    label="Cargando estancias, habitaciones y huéspedes…"
                    delay={0}
                    minDuration={300}
                  />
                </div>
              ) : filtradas.length === 0 ? (
                <div className="text-ink-muted py-12 text-center text-xs">
                  No encontramos estancias activas que coincidan con "{busqueda}".
                </div>
              ) : (
                filtradas.map((r) => {
                  const isSelected = activeSelectedRecepcion
                    ? activeSelectedRecepcion.id === r.id
                    : selectedId === r.id
                  return (
                    <RecepcionEstanciaCard
                      key={r.id}
                      recepcion={r}
                      isSelected={isSelected}
                      onSelect={handleSelectCard}
                    />
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-line mt-4 flex shrink-0 flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-ink-muted text-xs">
                {activeSelectedRecepcion ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                    <span>Estancia seleccionada:</span>
                    <strong className="text-ink font-semibold">
                      {activeSelectedRecepcion.habitacionNombre} ·{' '}
                      {activeSelectedRecepcion.huespedNombre}
                    </strong>
                  </span>
                ) : (
                  <span className="text-ink-soft">
                    Ninguna estancia seleccionada. Marca la recepción que deseas elegir.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="border-line bg-panel text-ink hover:bg-canvas cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!activeSelectedRecepcion}
                  onClick={handleConfirmar}
                  className="bg-primary hover:bg-primary/90 cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirmar selección
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})
