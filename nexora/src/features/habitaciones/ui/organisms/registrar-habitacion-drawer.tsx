import { Suspense, memo, useCallback, useState } from 'react'
import { faBed } from '@fortawesome/free-solid-svg-icons'
import { Drawer } from '../../../../shared/ui/Drawer'
import { lazyWithFallback } from '../../application/lazy-with-fallback'
import {
  habitacionDetalleRepository,
  useRegistrarHabitacionDetalle,
} from '../../application/use-registrar-habitacion-detalle'
import { Loader } from '../atoms/loader'
import {
  HabitacionCatalogLoadBanner,
  HabitacionRegistroSuccess,
} from '../molecules/habitacion-registro-feedback'

const LazyHabitacionDetalleForm = lazyWithFallback(
  () => import('../molecules/habitacion-detalle-form').then((m) => m.default),
  'HabitacionDetalleForm'
)

const LazyHabitacionTipoModal = lazyWithFallback(
  () => import('./habitacion-tipo-modal').then((m) => m.HabitacionTipoModal),
  'HabitacionTipoModal'
)

const LazyEdificioRegistroModal = lazyWithFallback(
  () =>
    import('../../../edificios/ui/organisms/edificio-registro-modal').then(
      (m) => m.EdificioRegistroModal
    ),
  'EdificioRegistroModal'
)

const LazyHabitacionRegistroRocketOverlay = lazyWithFallback(
  () =>
    import('./habitacion-registro-rocket-overlay').then((m) => m.default),
  'HabitacionRegistroRocketOverlay'
)

export interface RegistrarHabitacionDrawerProps {
  isOpen: boolean
  onClose: () => void
  onHabitacionRegistrada?: () => void
}

const RegistrarHabitacionDrawerInner = memo(
  function RegistrarHabitacionDrawerInner({
    onClose,
    onHabitacionRegistrada,
  }: {
    onClose: () => void
    onHabitacionRegistrada?: () => void
  }) {
    const {
      catalogs,
      selectedTarifaId,
      setSelectedTarifaId,
      selectedTarifa,
      tarifaFeedback,
      submitting,
      submittingNumero,
      submitError,
      submitErrorStatus,
      successNumero,
      successValidationMessage,
      handleSubmit,
      resetForm,
      handleClearForm,
    } = useRegistrarHabitacionDetalle({ onSuccess: onHabitacionRegistrada })

    const [tipoModalOpen, setTipoModalOpen] = useState(false)
    const [edificioModalOpen, setEdificioModalOpen] = useState(false)

    const handleSafeClose = useCallback(() => {
      try {
        if (!submitting) onClose()
      } catch (error) {
        console.error('Error al cerrar drawer de registro de habitación:', error)
      }
    }, [onClose, submitting])

    const handleOpenTipoModal = useCallback(() => setTipoModalOpen(true), [])
    const handleCloseTipoModal = useCallback(() => setTipoModalOpen(false), [])
    const handleOpenEdificioModal = useCallback(
      () => setEdificioModalOpen(true),
      []
    )
    const handleCloseEdificioModal = useCallback(
      () => setEdificioModalOpen(false),
      []
    )

    const handleRefreshRoomTypes = useCallback(() => {
      void catalogs.fetchRoomTypes(true).catch((error) => {
        console.error('Error al refrescar tipos de habitación:', error)
      })
    }, [catalogs])

    const handleRefreshEdificios = useCallback(() => {
      void catalogs.fetchEdificios(true).catch((error) => {
        console.error('Error al refrescar edificios:', error)
      })
    }, [catalogs])

    return (
      <>
        <Drawer
          isOpen
          onClose={handleSafeClose}
          closeOnBackdropClick={!submitting}
          closeOnEscape={!submitting}
          position="right"
          size="full"
          className="drawer-tablet-40 sm:w-[40vw] sm:max-w-[40vw] md:w-[40vw] md:max-w-[40vw] lg:w-[40vw] lg:max-w-[40vw]"
          icon={faBed}
          title="Registrar habitación"
          description="Completa ubicación, datos básicos y tarifa opcional."
        >
          {successNumero ? (
            <HabitacionRegistroSuccess
              numero={successNumero}
              tarifaNombre={selectedTarifa?.label}
              tarifaFeedback={tarifaFeedback}
              successMessage={successValidationMessage}
              onReset={resetForm}
            />
          ) : (
            <div className="space-y-4">
              {catalogs.errorItems.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {catalogs.errorItems.map((item) => (
                    <HabitacionCatalogLoadBanner
                      key={item.error}
                      message={item.error!}
                      loading={item.loading}
                      onRetry={item.retry}
                    />
                  ))}
                </div>
              ) : null}

              <Suspense
                fallback={
                  <div className="flex min-h-48 items-center justify-center">
                    <Loader label="Preparando formulario…" />
                  </div>
                }
              >
                <LazyHabitacionDetalleForm
                  roomTypes={catalogs.roomTypes}
                  roomTypesLoading={catalogs.roomTypesLoading}
                  edificios={catalogs.edificios}
                  edificiosLoading={catalogs.edificiosLoading}
                  rates={catalogs.rates}
                  ratesLoading={catalogs.ratesLoading}
                  ratesError={Boolean(catalogs.ratesError)}
                  selectedTarifaId={selectedTarifaId}
                  onTarifaChange={setSelectedTarifaId}
                  selectedTarifa={selectedTarifa}
                  submitting={submitting}
                  submitError={submitError}
                  submitErrorStatus={submitErrorStatus}
                  onSubmit={handleSubmit}
                  onCreateTipo={handleOpenTipoModal}
                  onCreateEdificio={handleOpenEdificioModal}
                  onClear={handleClearForm}
                  repository={habitacionDetalleRepository}
                />
              </Suspense>
            </div>
          )}
        </Drawer>

        {submitting ? (
          <Suspense fallback={null}>
            <LazyHabitacionRegistroRocketOverlay
              visible={submitting}
              roomNumber={submittingNumero}
              hasTarifa={Boolean(selectedTarifaId)}
            />
          </Suspense>
        ) : null}

        {tipoModalOpen ? (
          <Suspense fallback={null}>
            <LazyHabitacionTipoModal
              open={tipoModalOpen}
              onClose={handleCloseTipoModal}
              onSuccess={handleRefreshRoomTypes}
            />
          </Suspense>
        ) : null}

        {edificioModalOpen ? (
          <Suspense fallback={null}>
            <LazyEdificioRegistroModal
              open={edificioModalOpen}
              onClose={handleCloseEdificioModal}
              onSuccess={handleRefreshEdificios}
            />
          </Suspense>
        ) : null}
      </>
    )
  }
)

/**
 * Organismo: Drawer lateral (40% de pantalla en tablets/iPads/escritorio)
 * que aloja de forma perezosa el formulario `HabitacionDetalleForm`.
 */
export const RegistrarHabitacionDrawer = memo(
  function RegistrarHabitacionDrawer({
    isOpen,
    onClose,
    onHabitacionRegistrada,
  }: RegistrarHabitacionDrawerProps) {
    if (!isOpen) return null

    return (
      <RegistrarHabitacionDrawerInner
        onClose={onClose}
        onHabitacionRegistrada={onHabitacionRegistrada}
      />
    )
  }
)

export default RegistrarHabitacionDrawer
