import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useId,
  type ComponentType,
  type FormEvent,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEraser,
  faPaperPlane,
  faSpinner,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Drawer } from '../../../../shared/ui/Drawer'
import {
  StatusCodeAlert,
  validateStatusCode,
} from '../../../../shared/lib/status-code-validator'
import type { LoadingProps } from '../../../../shared/loading'
import { CampanaHotelAnimada } from '../atoms/CampanaHotelAnimada'
import { SeccionCargaImagen } from '../molecules/SeccionCargaImagen'
import { ServicioHabitacionCamposGrid } from '../molecules/ServicioHabitacionCamposGrid'
import type { ServicioHabitacionGuardadoOverlayProps } from '../molecules/ServicioHabitacionGuardadoOverlay'
import { useFormularioServicioHabitacion } from '../../application/use-formulario-servicio-habitacion'

const LazySharedLoading = lazy<ComponentType<LoadingProps>>(async () => {
  try {
    const mod = await import('../../../../shared/loading')
    return { default: mod.Loading }
  } catch (error) {
    console.error('Error al cargar Loading en RegistrarCategoriaDrawer:', error)
    const Fallback: ComponentType<LoadingProps> = () => null
    return { default: Fallback }
  }
})

const LazyServicioHabitacionGuardadoOverlay = lazy<
  ComponentType<ServicioHabitacionGuardadoOverlayProps>
>(async () => {
  try {
    const mod = await import('../molecules/ServicioHabitacionGuardadoOverlay')
    return { default: mod.ServicioHabitacionGuardadoOverlay }
  } catch (error) {
    console.error('Error al cargar ServicioHabitacionGuardadoOverlay:', error)
    const Fallback: ComponentType<ServicioHabitacionGuardadoOverlayProps> = () => null
    return { default: Fallback }
  }
})

export interface RegistrarCategoriaDrawerProps {
  isOpen: boolean
  onClose: () => void
  onCategoriaGuardada?: () => void
}

const RegistrarCategoriaDrawerInner = memo(function RegistrarCategoriaDrawerInner({
  onClose,
  onCategoriaGuardada,
}: {
  onClose: () => void
  onCategoriaGuardada?: () => void
}) {
  const {
    order,
    setOrder,
    sedeId,
    handleSedeChange,
    sedeOptions,
    loadingSedes,
    subSedeId,
    handleSubSedeChange,
    subSedeOptions,
    loadingSubSedes,
    edificioId,
    handleEdificioChange,
    edificioOptions,
    loadingEdificios,
    nombreServicio,
    setNombreServicio,
    descripcion,
    setDescripcion,
    imagenArchivo,
    imagenPreview,
    handleImageChange,
    saving,
    feedback,
    setFeedback,
    handleSubmit,
    limpiarFormulario,
    resetKey,
    isLoadingEndpoints,
  } = useFormularioServicioHabitacion({ onCategoriaGuardada })

  const formId = useId()

  const handleSafeClose = useCallback(() => {
    try {
      if (!saving) onClose()
    } catch (error) {
      console.error('Error al cerrar drawer de registro de categoría:', error)
    }
  }, [onClose, saving])

  const handleFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      try {
        await handleSubmit(e)
      } catch (error) {
        console.error('Error al enviar formulario de nueva categoría:', error)
        setFeedback({
          ...validateStatusCode(500),
          title: 'Error inesperado al registrar',
          message: 'No pudimos completar el envío del formulario. Inténtalo de nuevo.',
        })
      }
    },
    [handleSubmit, setFeedback],
  )

  const handleLimpiarClick = useCallback(() => {
    try {
      limpiarFormulario()
    } catch (error) {
      console.error('Error al limpiar formulario de categoría:', error)
    }
  }, [limpiarFormulario])

  const handleDismissFeedback = useCallback(() => {
    setFeedback(null)
  }, [setFeedback])

  return (
    <Drawer
      isOpen
      onClose={handleSafeClose}
      closeOnBackdropClick={!saving}
      closeOnEscape={!saving}
      position="right"
      size="lg"
      iconElement={<CampanaHotelAnimada />}
      title="Registrar Categoría de Servicio"
      description="Asigna sede, edificio, orden e imagen sin salir del catálogo de categorías."
      footer={
        <div className="flex flex-col-reverse items-center justify-between gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleLimpiarClick}
            disabled={saving}
            className="border-line bg-canvas text-ink hover:bg-panel hover:border-primary/40 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <FontAwesomeIcon icon={faEraser} className="size-3.5" aria-hidden="true" />
            <span>Limpiar</span>
          </button>

          <div className="flex w-full flex-col-reverse items-center gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={saving}
              className="border-line bg-panel text-ink hover:bg-canvas inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 sm:w-auto"
            >
              <FontAwesomeIcon icon={faXmark} className="size-3.5" aria-hidden="true" />
              <span>Cancelar</span>
            </button>

            <button
              type="submit"
              form={formId}
              disabled={saving}
              aria-busy={saving}
              className="bg-primary hover:bg-primary/90 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="size-3.5" />
                  <span>Guardando…</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="size-3.5" />
                  <span>Guardar categoría</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="relative space-y-5">
        {saving && (
          <Suspense fallback={null}>
            <LazyServicioHabitacionGuardadoOverlay visible />
          </Suspense>
        )}

        <StatusCodeAlert
          validation={feedback}
          dismissible
          onClose={handleDismissFeedback}
          actions={
            feedback?.isValid ? (
              <button
                type="button"
                onClick={handleSafeClose}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-400/50 bg-white/85 px-3 py-1.5 text-xs font-bold text-emerald-900 transition-colors hover:bg-white dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-100"
              >
                <span>Terminar y cerrar</span>
              </button>
            ) : undefined
          }
        />

        {isLoadingEndpoints && (
          <div className="border-line bg-canvas flex items-center justify-center rounded-2xl border p-3 shadow-2xs">
            <Suspense
              fallback={
                <span className="text-ink-muted text-xs font-medium">
                  Consultando sedes, subsedes y edificios…
                </span>
              }
            >
              <LazySharedLoading
                visible={true}
                variant="inline"
                size="sm"
                label="Consultando catálogos de sedes, subsedes y edificios…"
                delay={0}
                minDuration={250}
              />
            </Suspense>
          </div>
        )}

        <form
          id={formId}
          onSubmit={(e) => void handleFormSubmit(e)}
          noValidate
          className="space-y-5"
        >
          <ServicioHabitacionCamposGrid
            order={order}
            onOrderChange={setOrder}
            sedeId={sedeId}
            onSedeChange={handleSedeChange}
            sedeOptions={sedeOptions}
            loadingSedes={loadingSedes}
            subSedeId={subSedeId}
            onSubSedeChange={handleSubSedeChange}
            subSedeOptions={subSedeOptions}
            loadingSubSedes={loadingSubSedes}
            edificioId={edificioId}
            onEdificioChange={handleEdificioChange}
            edificioOptions={edificioOptions}
            loadingEdificios={loadingEdificios}
            nombreServicio={nombreServicio}
            onNombreServicioChange={setNombreServicio}
            descripcion={descripcion}
            onDescripcionChange={setDescripcion}
          />

          <SeccionCargaImagen
            key={resetKey}
            imageFile={imagenArchivo}
            imagePreview={imagenPreview}
            onImageChange={handleImageChange}
          />
        </form>
      </div>
    </Drawer>
  )
})

/**
 * Organismo: Drawer lateral para registrar una nueva categoría de servicio a la habitación
 * directamente desde la pestaña Categorías sin abandonar el listado.
 */
export const RegistrarCategoriaDrawer = memo(function RegistrarCategoriaDrawer({
  isOpen,
  onClose,
  onCategoriaGuardada,
}: RegistrarCategoriaDrawerProps) {
  if (!isOpen) return null

  return (
    <RegistrarCategoriaDrawerInner
      onClose={onClose}
      onCategoriaGuardada={onCategoriaGuardada}
    />
  )
})
