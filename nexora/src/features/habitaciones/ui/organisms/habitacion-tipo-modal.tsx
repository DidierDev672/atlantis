import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { MotionConfig } from 'motion/react'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { RegistrarHabitacion } from '../../application/registrar-habitacion'
import type { Habitacion, HabitacionInput } from '../../domain/habitacion'
import { HabitacionApiError } from '../../domain/habitacion-error'
import { ApiHabitacionRepository } from '../../infrastructure/api-habitacion-repository'
import { Button } from '../atoms/button'
import { HabitacionPlanetAlert } from '../atoms/habitacion-planet-alert'
import { Loader } from '../atoms/loader'
import { Modal } from '../atoms/modal'
import { roomTypeErrorCopy } from '../lib/error-copy'
import type { HabitacionRegistroFormProps } from '../molecules/habitacion-registro-form'

const habitacionRepository = new ApiHabitacionRepository()

const LazyHabitacionRegistroForm = lazy<
  ComponentType<HabitacionRegistroFormProps>
>(async () => {
  try {
    const mod = await import('../molecules/habitacion-registro-form')
    return { default: mod.HabitacionRegistroForm }
  } catch (error) {
    console.error('Error al cargar HabitacionRegistroForm:', error)
    const Fallback: ComponentType<HabitacionRegistroFormProps> = () => null
    return { default: Fallback }
  }
})

export interface HabitacionTipoModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Organismo: Modal para registrar tipos de habitación mostrando el éxito con `PlanetAlert`.
 */
export const HabitacionTipoModal = memo(function HabitacionTipoModal({
  open,
  onClose,
  onSuccess,
}: HabitacionTipoModalProps) {
  const { policy } = useDeviceResourceProfile()
  const [submitting, setSubmitting] = useState(false)
  const [submittingName, setSubmittingName] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitErrorStatus, setSubmitErrorStatus] = useState<number | null>(null)
  const [success, setSuccess] = useState<Habitacion | null>(null)
  const submittingRef = useRef(false)

  const handleSubmit = useCallback(
    async (values: HabitacionInput) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)
      setSubmittingName(values.name.trim())
      setSubmitError(null)
      setSubmitErrorStatus(null)
      try {
        const habitacion = await RegistrarHabitacion(habitacionRepository)(values)
        setSuccess(habitacion)
        onSuccess?.()
      } catch (error) {
        const status = error instanceof HabitacionApiError ? error.status : 0
        setSubmitErrorStatus(status)
        setSubmitError(roomTypeErrorCopy(status))
      } finally {
        setSubmitting(false)
        setSubmittingName('')
        submittingRef.current = false
      }
    },
    [onSuccess]
  )

  const resetForm = useCallback(() => {
    setSuccess(null)
    setSubmitError(null)
    setSubmitErrorStatus(null)
  }, [])

  const handleClose = useCallback(() => {
    try {
      if (submitting) return
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error al cerrar modal de tipo de habitación:', error)
    }
  }, [onClose, resetForm, submitting])

  return (
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      <Modal
        isOpen={open}
        onClose={handleClose}
        title={success ? undefined : 'Datos de la habitación'}
        className="max-w-xl"
      >
        {open ? (
          success ? (
            <HabitacionPlanetAlert
              variant="success"
              planet="earth"
              role="status"
              autoHideDurationMs={2000}
              onAutoHide={handleClose}
              title={`¡«${success.name}» ya está lista!`}
              message={`Quedó registrada con capacidad para ${success.capacity} ${
                success.capacity === 1 ? 'persona' : 'personas'
              } y un precio base ya definido. Ya puedes elegirla como tipo de habitación.`}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Registrar otro tipo
                  </Button>
                  <Button type="button" onClick={handleClose}>
                    Listo
                  </Button>
                </div>
              }
            />
          ) : (
            <Suspense
              fallback={
                <div className="flex min-h-56 items-center justify-center">
                  <Loader label="Preparando formulario…" />
                </div>
              }
            >
              <LazyHabitacionRegistroForm
                submitting={submitting}
                submitError={submitError}
                submitErrorStatus={submitErrorStatus}
                onSubmit={(values) => void handleSubmit(values)}
              />
            </Suspense>
          )
        ) : null}
      </Modal>

      <Loader
        overlay
        visible={submitting}
        size={40}
        label={submittingName ? `Guardando «${submittingName}»…` : 'Guardando…'}
      >
        <span className="max-w-xs text-center text-xs leading-relaxed text-ink-soft">
          Un momento: ya le estamos buscando su lugar en tu hotel.
        </span>
      </Loader>
    </MotionConfig>
  )
})
