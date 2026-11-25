import { Suspense, memo, useCallback, useState } from 'react'
import { motion } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
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

export const HabitacionDetallePanel = memo(function HabitacionDetallePanel() {
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
  } = useRegistrarHabitacionDetalle()

  const [tipoModalOpen, setTipoModalOpen] = useState(false)
  const [edificioModalOpen, setEdificioModalOpen] = useState(false)

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

  return (
    <>
      <motion.section
        aria-label="Registro de habitaciones"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="mt-4"
      >
        <div className="border-line bg-panel rounded-2xl border p-5 shadow-sm sm:p-8">
          {successNumero ? (
            <HabitacionRegistroSuccess
              numero={successNumero}
              tarifaNombre={selectedTarifa?.label}
              tarifaFeedback={tarifaFeedback}
              successMessage={successValidationMessage}
              onReset={resetForm}
            />
          ) : (
            <>
              <header className="space-y-1">
                <h2 className="text-ink text-lg font-bold">
                  Registrar habitación
                </h2>
                <p className="text-ink-muted text-xs leading-relaxed">
                  Completa la ubicación, los datos básicos y la tarifa opcional
                  en un solo flujo.
                </p>
              </header>

              {catalogs.errorItems.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2">
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

              <div className="mt-5">
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
            </>
          )}
        </div>
      </motion.section>

      {submitting ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
              <Loader label="Preparando lanzamiento…" />
            </div>
          }
        >
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
            onSuccess={() => void catalogs.fetchRoomTypes(true)}
          />
        </Suspense>
      ) : null}

      {edificioModalOpen ? (
        <Suspense fallback={null}>
          <LazyEdificioRegistroModal
            open={edificioModalOpen}
            onClose={handleCloseEdificioModal}
            onSuccess={() => void catalogs.fetchEdificios(true)}
          />
        </Suspense>
      ) : null}
    </>
  )
})

export default HabitacionDetallePanel
