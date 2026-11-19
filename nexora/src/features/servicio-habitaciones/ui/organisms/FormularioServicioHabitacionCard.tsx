import {
  Suspense,
  lazy,
  memo,
  useCallback,
  type ComponentType,
  type FormEvent,
} from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEraser, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { fadeIn } from '../../../../design-tokens/motion'
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
    console.error('Error al cargar Loading de /shared/loading:', error)
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

/**
 * Organismo de formulario para el registro y alta de servicios gastronómicos / categorías.
 * Descompuesto bajo Atomic Design con `React.memo`, `React.lazy` para el overlay de guardado
 * y el indicador de carga de catálogos, sin `backdrop-blur`, y manejo defensivo `try/catch`.
 */
export const FormularioServicioHabitacionCard = memo(
  function FormularioServicioHabitacionCard() {
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
    } = useFormularioServicioHabitacion()

    const handleFormSubmit = useCallback(
      async (e: FormEvent<HTMLFormElement>) => {
        try {
          await handleSubmit(e)
        } catch (error) {
          console.error('Error al enviar formulario de servicio a la habitación:', error)
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
        console.error('Error al limpiar el formulario de servicio:', error)
      }
    }, [limpiarFormulario])

    const handleDismissFeedback = useCallback(() => {
      setFeedback(null)
    }, [setFeedback])

    return (
      <>
        {saving && (
          <Suspense fallback={null}>
            <LazyServicioHabitacionGuardadoOverlay visible />
          </Suspense>
        )}

        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="border-line bg-panel w-full rounded-3xl border p-6 shadow-xs sm:p-8"
        >
          {/* Cabecera con microinteracción visual */}
          <div className="border-line flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CampanaHotelAnimada />
              <div>
                <h2 className="text-ink font-serif text-xl font-bold tracking-tight sm:text-2xl">
                  Registro de Servicios a la Habitación
                </h2>
                <p className="text-ink-muted text-xs leading-relaxed">
                  Asigna la ubicación de sede y edificio, ingresa la orden con precisión y añade la
                  fotografía del servicio.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <StatusCodeAlert
              validation={feedback}
              dismissible
              onClose={handleDismissFeedback}
            />
          </div>

          {/* Indicador liviano sin backdrop-blur-xs mientras cargan catálogos */}
          {isLoadingEndpoints && (
            <div className="border-line bg-canvas mt-4 flex items-center justify-center rounded-2xl border p-3 shadow-2xs">
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
                  label="Consultando y balanceando catálogos de sedes, subsedes y edificios (/headquarters, /sub-headquarters, /building)…"
                  delay={0}
                  minDuration={250}
                />
              </Suspense>
            </div>
          )}

          {/* Formulario de Registro */}
          <form onSubmit={(e) => void handleFormSubmit(e)} noValidate className="mt-6 space-y-6">
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

            <div className="pt-2">
              <SeccionCargaImagen
                key={resetKey}
                imageFile={imagenArchivo}
                imagePreview={imagenPreview}
                onImageChange={handleImageChange}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleLimpiarClick}
                disabled={saving}
                className="border-line bg-canvas text-ink hover:bg-panel hover:border-primary/40 inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-5 py-3 text-xs font-bold shadow-2xs transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faEraser} className="size-3.5" />
                <span>Limpiar formulario</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-7 py-3 text-xs font-bold text-white shadow-xs transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="size-3.5" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} className="size-3.5" />
                    <span>Guardar y emitir orden de servicio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </>
    )
  },
)
