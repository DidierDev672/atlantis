import {
  Suspense,
  lazy,
  memo,
  useCallback,
  type ComponentType,
} from 'react'
import { MotionConfig } from 'motion/react'
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { Drawer } from '../../../../shared/ui/Drawer'
import { useEdificioRegistro } from '../../application/use-edificio-registro'
import type { EdificioInput } from '../../domain/edificio'
import { Loader } from '../atoms/loader'
import type { EdificioFormProps } from '../molecules/edificio-form'
import { EdificioSuccessState } from '../molecules/edificio-success-state'

const LazyEdificioForm = lazy<ComponentType<EdificioFormProps>>(async () => {
  try {
    const mod = await import('../molecules/edificio-form')
    return { default: mod.EdificioForm }
  } catch (error) {
    console.error('Error al cargar EdificioForm:', error)
    const Fallback: ComponentType<EdificioFormProps> = () => null
    return { default: Fallback }
  }
})

export interface EdificioRegistroDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const EdificioRegistroDrawerInner = memo(function EdificioRegistroDrawerInner({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess?: () => void
}) {
  const { policy } = useDeviceResourceProfile()
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
    success,
    handleSedeChange,
    handleToggleEdicionManual,
    handleSubmit,
    resetForm,
  } = useEdificioRegistro({ open: true, onSuccess })

  const handleSafeClose = useCallback(() => {
    try {
      if (!submitting) onClose()
    } catch (error) {
      console.error('Error al cerrar drawer de edificio y pisos:', error)
    }
  }, [onClose, submitting])

  const handleSedeSelect = useCallback(
    (sedeId: string) => {
      void handleSedeChange(sedeId).catch((error) => {
        console.error('Error al consultar sub-sedes:', error)
      })
    },
    [handleSedeChange]
  )

  const handleManualToggle = useCallback(() => {
    void handleToggleEdicionManual().catch((error) => {
      console.error('Error al alternar edición manual en drawer:', error)
    })
  }, [handleToggleEdicionManual])

  const handleFormSubmit = useCallback(
    (values: EdificioInput) => {
      void handleSubmit(values).catch((error) => {
        console.error('Error al registrar edificio y pisos:', error)
      })
    },
    [handleSubmit]
  )

  return (
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      <Drawer
        isOpen
        onClose={handleSafeClose}
        closeOnBackdropClick={!submitting}
        closeOnEscape={!submitting}
        position="right"
        size="full"
        className="drawer-tablet-40 sm:w-[40vw] sm:max-w-[40vw] md:w-[40vw] md:max-w-[40vw] lg:w-[40vw] lg:max-w-[40vw]"
        icon={faLayerGroup}
        title="Registrar edificio y pisos"
        description="Define la cantidad de pisos disponibles dentro de tu sede."
      >
        {success ? (
          <EdificioSuccessState
            success={success}
            onReset={resetForm}
            onClose={handleSafeClose}
          />
        ) : (
          <Suspense
            fallback={
              <div className="flex min-h-48 items-center justify-center">
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
        )}
      </Drawer>

      <Loader
        overlay
        visible={submitting}
        size={40}
        label="Registrando pisos…"
      >
        <span className="text-ink-soft max-w-xs text-center text-xs leading-relaxed">
          Un momento: le estamos dando forma y pisos a tu nuevo edificio.
        </span>
      </Loader>
    </MotionConfig>
  )
})

/**
 * Drawer de 40vw para registrar edificios y definir su número de pisos desde Habitaciones.
 */
export const EdificioRegistroDrawer = memo(function EdificioRegistroDrawer({
  isOpen,
  onClose,
  onSuccess,
}: EdificioRegistroDrawerProps) {
  if (!isOpen) return null
  return (
    <EdificioRegistroDrawerInner onClose={onClose} onSuccess={onSuccess} />
  )
})

export default EdificioRegistroDrawer
