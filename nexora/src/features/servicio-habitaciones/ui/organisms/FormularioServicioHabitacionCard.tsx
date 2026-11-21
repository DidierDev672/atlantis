import {
  Suspense,
  memo,
  useCallback,
  useRef,
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
import { lazyWithFallback } from '../../application/lazy-with-fallback'
import { useFormularioServicioHabitacion } from '../../application/use-formulario-servicio-habitacion'
import { FORMULARIO_FIELD_IDS } from '../../domain/menu-categoria'
import { CampanaHotelAnimada } from '../atoms/CampanaHotelAnimada'
import { SeccionCargaImagen } from '../molecules/SeccionCargaImagen'
import { ServicioHabitacionCamposGrid } from '../molecules/ServicioHabitacionCamposGrid'
import type { ServicioHabitacionGuardadoOverlayProps } from '../molecules/ServicioHabitacionGuardadoOverlay'

const LazySharedLoading = lazyWithFallback<LoadingProps>(
  () => import('../../../../shared/loading').then((m) => m.Loading),
  'Loading de /shared/loading',
)

const LazyServicioHabitacionGuardadoOverlay =
  lazyWithFallback<ServicioHabitacionGuardadoOverlayProps>(
    () =>
      import('../molecules/ServicioHabitacionGuardadoOverlay').then(
        (m) => m.ServicioHabitacionGuardadoOverlay,
      ),
    'ServicioHabitacionGuardadoOverlay',
  )

export interface FormularioServicioHabitacionCardProps {
  onCategoriaGuardada?: () => void
}

/**
 * Organismo de formulario para el registro de categorías del menú de Room Service.
 * Descompuesto bajo Atomic Design con `React.memo`, `React.lazy`, validación por campo
 * con foco/scroll al primer error y manejo defensivo `try/catch`.
 */
export const FormularioServicioHabitacionCard = memo(
  function FormularioServicioHabitacionCard({
    onCategoriaGuardada,
  }: FormularioServicioHabitacionCardProps) {
    const alertContainerRef = useRef<HTMLDivElement>(null)

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
      locationFieldsDisabled,
      handleToggleManualLocation,
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
      fieldErrors,
      handleSubmit,
      limpiarFormulario,
      resetKey,
      isLoadingEndpoints,
    } = useFormularioServicioHabitacion({ onCategoriaGuardada })

    const scrollAndFocusValidation = useCallback(
      (firstInvalidKey: keyof typeof FORMULARIO_FIELD_IDS | null) => {
        try {
          alertContainerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          })
          if (firstInvalidKey) {
            const targetId = FORMULARIO_FIELD_IDS[firstInvalidKey]
            const element = document.getElementById(targetId)
            element?.focus({ preventScroll: true })
          }
        } catch (scrollError) {
          console.error('Error al enfocar campo inválido:', scrollError)
        }
      },
      [],
    )

    const handleFormSubmit = useCallback(
      (e: FormEvent<HTMLFormElement>) => {
        void (async () => {
          try {
            const result = await handleSubmit(e)
            if (!result.isValid) {
              scrollAndFocusValidation(result.firstInvalidKey)
            }
          } catch (error) {
            console.error('Error al enviar formulario de categoría:', error)
            setFeedback({
              ...validateStatusCode(500),
              title: 'Error inesperado al registrar',
              message:
                'No pudimos completar el envío del formulario. Inténtalo de nuevo.',
            })
            scrollAndFocusValidation(null)
          }
        })()
      },
      [handleSubmit, scrollAndFocusValidation, setFeedback],
    )

    const handleLimpiarClick = useCallback(() => {
      try {
        limpiarFormulario()
      } catch (error) {
        console.error('Error al limpiar el formulario de categoría:', error)
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
          className="border-line bg-panel w-full rounded-3xl border p-6 font-sans shadow-xs sm:p-8"
        >
          {/* Cabecera con microinteracción visual */}
          <div className="border-line flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CampanaHotelAnimada />
              <div>
                <h2 className="text-ink font-sans text-xl font-bold tracking-tight sm:text-2xl">
                  Nueva Categoría de Menú
                </h2>
                <p className="text-ink-muted text-xs">
                  Completa el nombre, descripción e imagen.
                </p>
              </div>
            </div>
          </div>

          <div ref={alertContainerRef} className="mt-5">
            <StatusCodeAlert
              validation={feedback}
              dismissible
              onClose={handleDismissFeedback}
            />
          </div>

          {/* Indicador liviano sin backdrop-blur ni rutas técnicas expuestas */}
          {isLoadingEndpoints && (
            <div className="border-line bg-canvas mt-4 flex items-center justify-center rounded-2xl border p-3 shadow-2xs">
              <Suspense
                fallback={
                  <span className="text-ink-muted text-xs font-medium">
                    Cargando ubicación…
                  </span>
                }
              >
                <LazySharedLoading
                  visible={true}
                  variant="inline"
                  size="sm"
                  label="Cargando ubicación…"
                  delay={0}
                  minDuration={250}
                />
              </Suspense>
            </div>
          )}

          {/* Formulario de Registro */}
          <form onSubmit={handleFormSubmit} noValidate className="mt-6 space-y-6">
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
              locationFieldsDisabled={locationFieldsDisabled}
              onToggleManualLocation={handleToggleManualLocation}
              nombreServicio={nombreServicio}
              onNombreServicioChange={setNombreServicio}
              descripcion={descripcion}
              onDescripcionChange={setDescripcion}
              errors={fieldErrors}
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
                <span>Limpiar</span>
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
                    <span>Guardar categoría</span>
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
