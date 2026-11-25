import { useCallback, useMemo, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { readAuthTokenEmail } from '../../../shared/auth-storage'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import type { HabitacionDetalleInput } from '../domain/habitacion-detalle'
import { HabitacionApiError } from '../domain/habitacion-error'
import type {
  RoomTariffFeedback,
  RoomTariffPayload,
} from '../domain/room-tariff'
import { ApiHabitacionDetalleRepository } from '../infrastructure/api-habitacion-detalle-repository'
import { ApiRoomTariffRepository } from '../infrastructure/api-room-tariff-repository'
import { roomTypeErrorCopy } from '../ui/lib/error-copy'
import { AsignarTarifaHabitacion } from './asignar-tarifa-habitacion'
import { RegistrarHabitacionDetalle } from './registrar-habitacion-detalle'
import { useHabitacionRegistroCatalogs } from './use-habitacion-registro-catalogs'

export const habitacionDetalleRepository = new ApiHabitacionDetalleRepository()
const roomTariffRepository = new ApiRoomTariffRepository()

export interface UseRegistrarHabitacionDetalleOptions {
  onSuccess?: () => void
}

/**
 * Hook de aplicación reutilizable para registrar una habitación y asignar
 * su tarifa opcional con manejo de errores `try / catch`.
 */
export function useRegistrarHabitacionDetalle(
  options: UseRegistrarHabitacionDetalleOptions = {}
) {
  const { onSuccess } = options
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

        onSuccess?.()
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
    [catalogs.rates, onSuccess, selectedTarifaId]
  )

  const resetForm = useCallback(() => {
    setSuccessNumero(null)
    setSuccessValidationMessage(null)
    setSubmitError(null)
    setSubmitErrorStatus(null)
    setSelectedTarifaId('')
    setTarifaFeedback(null)
  }, [])

  const handleClearForm = useCallback(() => {
    setSubmitError(null)
    setSubmitErrorStatus(null)
    setTarifaFeedback(null)
  }, [])

  return {
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
  }
}
