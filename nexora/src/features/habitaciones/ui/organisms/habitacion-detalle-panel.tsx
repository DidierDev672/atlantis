import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { isAxiosError } from 'axios'
import { motion } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
import { readAuthTokenEmail } from '../../../../shared/auth-storage'
import { validateStatusCode } from '../../../../shared/lib/status-code-validator'
import { AsignarTarifaHabitacion } from '../../application/asignar-tarifa-habitacion'
import { RegistrarHabitacionDetalle } from '../../application/registrar-habitacion-detalle'
import { useHabitacionRegistroCatalogs } from '../../application/use-habitacion-registro-catalogs'
import type { HabitacionDetalleInput } from '../../domain/habitacion-detalle'
import { HabitacionApiError } from '../../domain/habitacion-error'
import type {
  RoomTariffFeedback,
  RoomTariffPayload,
} from '../../domain/room-tariff'
import { ApiHabitacionDetalleRepository } from '../../infrastructure/api-habitacion-detalle-repository'
import { ApiRoomTariffRepository } from '../../infrastructure/api-room-tariff-repository'
import { Loader } from '../atoms/loader'
import { roomTypeErrorCopy } from '../lib/error-copy'
import {
  HabitacionCatalogLoadBanner,
  HabitacionRegistroSuccess,
} from '../molecules/habitacion-registro-feedback'

const LazyHabitacionDetalleForm = lazy(
  () => import('../molecules/habitacion-detalle-form')
)

const LazyHabitacionTipoModal = lazy(() =>
  import('./habitacion-tipo-modal').then((m) => ({
    default: m.HabitacionTipoModal,
  }))
)

const LazyEdificioRegistroModal = lazy(() =>
  import('../../../edificios/ui/organisms/edificio-registro-modal').then(
    (m) => ({ default: m.EdificioRegistroModal })
  )
)

const LazyHabitacionRegistroRocketOverlay = lazy(
  () => import('./habitacion-registro-rocket-overlay')
)

const habitacionDetalleRepository = new ApiHabitacionDetalleRepository()
const roomTariffRepository = new ApiRoomTariffRepository()

export const HabitacionDetallePanel = memo(function HabitacionDetallePanel() {
  const catalogs = useHabitacionRegistroCatalogs()
  const [selectedTarifaId, setSelectedTarifaId] = useState('')
  const [tarifaFeedback, setTarifaFeedback] =
    useState<RoomTariffFeedback | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittingNumero, setSubmittingNumero] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitErrorStatus, setSubmitErrorStatus] = useState<number | null>(
    null
  )
  const [successNumero, setSuccessNumero] = useState<string | null>(null)
  const [successValidationMessage, setSuccessValidationMessage] = useState<
    string | null
  >(null)
  const [tipoModalOpen, setTipoModalOpen] = useState(false)
  const [edificioModalOpen, setEdificioModalOpen] = useState(false)
  const submittingRef = useRef(false)

  const selectedTarifa = useMemo(
    () => catalogs.rates.find((r) => r.value === selectedTarifaId) ?? null,
    [catalogs.rates, selectedTarifaId]
  )

  const handleSubmit = useCallback(
    async (values: HabitacionDetalleInput) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)
      setSubmittingNumero(values.numero.trim())
      setSubmitError(null)
      setSubmitErrorStatus(null)
      setTarifaFeedback(null)

      try {
        const result = await RegistrarHabitacionDetalle(
          habitacionDetalleRepository
        )(values)
        setSuccessNumero(values.numero.trim())
        if (result?.validation?.message) {
          setSuccessValidationMessage(result.validation.message)
        }

        if (selectedTarifaId) {
          const tarifaSeleccionada = catalogs.rates.find(
            (r) => r.value === selectedTarifaId
          )
          const roomId = result?.roomId
          const createdByEmail = readAuthTokenEmail()

          if (roomId) {
            const tariffPayload: RoomTariffPayload = {
              room_id: roomId,
              rate_id: selectedTarifaId,
              is_default: true,
              status: 'active',
              created_by: createdByEmail,
            }

            const feedback = await AsignarTarifaHabitacion(
              roomTariffRepository
            )({
              payload: tariffPayload,
              tarifaNombre: tarifaSeleccionada?.label,
              numeroHabitacion: values.numero.trim(),
            })
            setTarifaFeedback(feedback)
          } else {
            setTarifaFeedback({
              type: 'error',
              status: 0,
              title: 'Aviso: No se pudo vincular la tarifa en este momento',
              message: `La habitación ${values.numero.trim()} se guardó en tu inventario, pero no recibimos su identificador para vincular automáticamente la tarifa «${tarifaSeleccionada?.label ?? 'seleccionada'}».`,
              subtext:
                'Puedes asociar o modificar su tarifa luego desde el detalle de la habitación.',
            })
          }
        }
      } catch (error) {
        const status =
          error instanceof HabitacionApiError
            ? error.status
            : isAxiosError(error)
              ? (error.response?.status ?? 0)
              : 0
        setSubmitErrorStatus(status)
        if (error instanceof HabitacionApiError && error.friendlyMessage) {
          setSubmitError(error.friendlyMessage)
        } else {
          const validation = validateStatusCode(status)
          setSubmitError(validation.message ?? roomTypeErrorCopy(status))
        }
      } finally {
        setSubmitting(false)
        setSubmittingNumero('')
        submittingRef.current = false
      }
    },
    [catalogs.rates, selectedTarifaId]
  )

  const resetForm = useCallback(() => {
    setSuccessNumero(null)
    setSuccessValidationMessage(null)
    setSubmitError(null)
    setSubmitErrorStatus(null)
    setSelectedTarifaId('')
    setTarifaFeedback(null)
  }, [])

  const handleOpenTipoModal = useCallback(() => setTipoModalOpen(true), [])
  const handleOpenEdificioModal = useCallback(
    () => setEdificioModalOpen(true),
    []
  )
  const handleClearForm = useCallback(() => {
    setSubmitError(null)
    setSubmitErrorStatus(null)
    setTarifaFeedback(null)
  }, [])

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
            onClose={() => setTipoModalOpen(false)}
            onSuccess={() => void catalogs.fetchRoomTypes(true)}
          />
        </Suspense>
      ) : null}

      {edificioModalOpen ? (
        <Suspense fallback={null}>
          <LazyEdificioRegistroModal
            open={edificioModalOpen}
            onClose={() => setEdificioModalOpen(false)}
            onSuccess={() => void catalogs.fetchEdificios(true)}
          />
        </Suspense>
      ) : null}
    </>
  )
})

export default HabitacionDetallePanel
