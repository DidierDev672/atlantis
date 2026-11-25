import {
  Suspense,
  lazy,
  memo,
  useCallback,
  type ComponentType,
} from 'react'
import { MotionConfig } from 'motion/react'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { useEdificioRegistro } from '../../application/use-edificio-registro'
import type { EdificioInput } from '../../domain/edificio'
import { Loader } from '../atoms/loader'
import { Modal } from '../atoms/modal'
import type { EdificioFormProps } from '../molecules/edificio-form'

const LazyEdificioForm = lazy<ComponentType<EdificioFormProps>>(async () => {
  try {
    const mod = await import('../molecules/edificio-form')
    return { default: mod.EdificioForm }
  } catch (error) {
    console.error('Error al cargar EdificioForm en modal:', error)
    const Fallback: ComponentType<EdificioFormProps> = () => null
    return { default: Fallback }
  }
})

export interface EdificioRegistroModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const EdificioRegistroModalInner = memo(function EdificioRegistroModalInner({
  onClose,
  onSuccess,
}: Omit<EdificioRegistroModalProps, 'open'>) {
  const { policy } = useDeviceResourceProfile()

  const handleRegistrationSuccess = useCallback(() => {
    try {
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error al finalizar registro de edificio:', error)
    }
  }, [onClose, onSuccess])

  const {
    sedes,
    sedesLoading,
    subSedes,
    subSedesLoading,
    autoSedeId,
    autoSubSedeId,
    locationVersion,
    isUbicacionBloqueada,
    detectedHeadquarter,
    detectedSubHeadquarter,
    locationValidation,
    submitting,
    submitError,
    handleSedeChange,
    handleToggleEdicionManual,
    handleSubmit,
    clearFormFeedback,
  } = useEdificioRegistro({ open: true, onSuccess: handleRegistrationSuccess })

  const handleClose = useCallback(() => {
    try {
      if (submitting) return
      clearFormFeedback()
      onClose()
    } catch (error) {
      console.error('Error al cerrar modal de edificio:', error)
    }
  }, [clearFormFeedback, onClose, submitting])

  const handleSedeSelect = useCallback(
    (sedeId: string) => {
      void handleSedeChange(sedeId).catch((error) => {
        console.error('Error al consultar sub-sedes en modal:', error)
      })
    },
    [handleSedeChange]
  )

  const handleManualToggle = useCallback(() => {
    void handleToggleEdicionManual().catch((error) => {
      console.error('Error al alternar edición manual en modal:', error)
    })
  }, [handleToggleEdicionManual])

  const handleFormSubmit = useCallback(
    (values: EdificioInput) => {
      void handleSubmit(values).catch((error) => {
        console.error('Error al enviar formulario de edificio:', error)
      })
    },
    [handleSubmit]
  )

  return (
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      <Modal
        isOpen
        onClose={handleClose}
        title="Crear edificio"
        className="max-w-xl"
      >
        <Suspense
          fallback={
            <div className="flex min-h-56 items-center justify-center">
              <Loader label="Preparando formulario…" />
            </div>
          }
        >
          <LazyEdificioForm
            sedes={sedes}
            sedesLoading={sedesLoading}
            subSedes={subSedes}
            subSedesLoading={subSedesLoading}
            autoSedeId={autoSedeId}
            autoSubSedeId={autoSubSedeId}
            locationVersion={locationVersion}
            isUbicacionBloqueada={isUbicacionBloqueada}
            detectedHeadquarter={detectedHeadquarter}
            detectedSubHeadquarter={detectedSubHeadquarter}
            locationValidation={locationValidation}
            submitting={submitting}
            submitError={submitError}
            onSedeChange={handleSedeSelect}
            onToggleEdicionManual={handleManualToggle}
            onSubmit={handleFormSubmit}
          />
        </Suspense>
      </Modal>

      <Loader
        overlay
        disableBlur
        visible={submitting}
        size={40}
        label="Creando edificio…"
      >
        <span className="text-ink-soft max-w-xs text-center text-xs leading-relaxed">
          Un momento: le estamos dando forma y pisos a tu nuevo edificio.
        </span>
      </Loader>
    </MotionConfig>
  )
})

/**
 * Organismo: Modal de registro de edificios desmontado cuando `open` es `false`
 * para mantener cero consumo de RAM/VRAM en reposo.
 */
export const EdificioRegistroModal = memo(function EdificioRegistroModal({
  open,
  onClose,
  onSuccess,
}: EdificioRegistroModalProps) {
  if (!open) return null
  return (
    <EdificioRegistroModalInner onClose={onClose} onSuccess={onSuccess} />
  )
})
