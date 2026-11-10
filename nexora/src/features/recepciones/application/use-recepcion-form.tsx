import { useCallback, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faPhone } from '@fortawesome/free-solid-svg-icons'
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'
import {
  ESTADO_OPTIONS,
  formatToIsoUtc,
  getDefaultCheckInDateTime,
  getDefaultCheckOutDateTime,
  METODO_PAGO_OPTIONS,
  normalizeMetodoPago,
  PAYMENT_METHOD_BACKEND_MAP,
  STATUS_BACKEND_MAP,
  validateRecepcionInput,
  type CamaInfo,
  type EdificioInfo,
  type HabitacionInfo,
  type HuespedInfo,
  type Recepcion,
  type RecepcionInput,
  type RecepcionPayload,
  type RecepcionValidationErrors,
  type ReservaInfo,
  type SedeInfo,
} from '../domain/recepcion'
import { RecepcionApiError } from '../domain/recepcion-error'
import { ApiRecepcionRepository } from '../infrastructure/api-recepcion-repository'

function formatReservaDateShort(dateStr?: string): string {
  if (!dateStr) return 'Por definir'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      return dateStr.split('T')[0] || dateStr
    }
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

export function getCreatedByFromLocalStorage(): string {
  try {
    const rawAuthToken = window.localStorage.getItem('auth_token')
    if (rawAuthToken) {
      try {
        const parsed = JSON.parse(rawAuthToken) as unknown
        if (parsed && typeof parsed === 'object') {
          const email = (parsed as { email?: unknown }).email
          if (typeof email === 'string' && email.trim()) {
            return email.trim()
          }
        }
      } catch {
        const parts = rawAuthToken.split('.')
        if (parts.length >= 2) {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const decoded = atob(payloadBase64)
          const jwtData = JSON.parse(decoded) as Record<string, unknown>
          if (typeof jwtData.email === 'string' && jwtData.email.trim()) {
            return jwtData.email.trim()
          }
        }
      }
      if (rawAuthToken.includes('@')) {
        return rawAuthToken.trim()
      }
    }

    const authUserRaw = window.localStorage.getItem('auth_user')
    if (authUserRaw) {
      try {
        const parsedUser = JSON.parse(authUserRaw) as { email?: string }
        if (parsedUser.email?.trim()) return parsedUser.email.trim()
      } catch {
        if (authUserRaw.includes('@')) return authUserRaw.trim()
      }
    }

    const nexoraToken = window.localStorage.getItem('nexora.auth.token')
    if (nexoraToken) {
      const parts = nexoraToken.split('.')
      if (parts.length >= 2) {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(payloadBase64)
        const jwtData = JSON.parse(decoded) as Record<string, unknown>
        if (typeof jwtData.email === 'string' && jwtData.email.trim()) {
          return jwtData.email.trim()
        }
      }
    }
  } catch {
    // Ignorar si localStorage está bloqueado
  }

  return 'recepcion@nexora.com'
}

const defaultRepository = new ApiRecepcionRepository()

export const initialRecepcionFormValues: RecepcionInput = {
  sedeId: '',
  edificioId: '',
  habitacionId: '',
  camaId: '',
  reservaId: '',
  huespedId: '',
  huespedIds: [],
  checkIn: getDefaultCheckInDateTime(),
  checkOut: getDefaultCheckOutDateTime(),
  metodoPago: 'efectivo',
  depositoGarantia: '50000',
  estado: 'progreso',
  observaciones: '',
}

export function useRecepcionForm(
  repository = defaultRepository,
  onSuccessCallback?: (recepcion: Recepcion) => void,
) {
  const [formValues, setFormValues] = useState<RecepcionInput>(initialRecepcionFormValues)
  const [errors, setErrors] = useState<RecepcionValidationErrors>({})
  const [loadingDependencies, setLoadingDependencies] = useState(true)
  const [dependencyError, setDependencyError] = useState<string | null>(null)

  const [sedes, setSedes] = useState<SedeInfo[]>([])
  const [edificios, setEdificios] = useState<EdificioInfo[]>([])
  const [habitaciones, setHabitaciones] = useState<HabitacionInfo[]>([])
  const [camas, setCamas] = useState<CamaInfo[]>([])
  const [reservas, setReservas] = useState<ReservaInfo[]>([])
  const [huespedes, setHuespedes] = useState<HuespedInfo[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successRecepcion, setSuccessRecepcion] = useState<Recepcion | null>(null)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)

  const loadDependencies = useCallback(async () => {
    setLoadingDependencies(true)
    setDependencyError(null)

    try {
      const [sedesData, edificiosData, roomsData, camasData, reservasData, huespedesData] =
        await Promise.all([
          repository.getSedes(),
          repository.getEdificios(),
          repository.getHabitaciones(),
          repository.getCamas(),
          repository.getReservas(),
          repository.getHuespedes(),
        ])

      setSedes(sedesData)
      setEdificios(edificiosData)
      setHabitaciones(roomsData)
      setCamas(camasData)
      setReservas(reservasData)
      setHuespedes(huespedesData)
    } catch {
      setDependencyError(
        'Tuvimos un inconveniente al cargar las opciones de ubicación y huéspedes. Tus datos no se han perdido; puedes reintentar cuando gustes.',
      )
    } finally {
      setLoadingDependencies(false)
    }
  }, [repository])

  useEffect(() => {
    void loadDependencies()
  }, [loadDependencies])

  // Opciones de Sede
  const sedeOptions = useMemo(
    () =>
      sedes.map((s) => ({
        value: s.id,
        label: `${s.name} (${s.city})`,
      })),
    [sedes],
  )

  // Opciones de Edificios filtrados por Sede
  const edificioOptions = useMemo(() => {
    const list = formValues.sedeId
      ? edificios.filter((e) => e.headquarters_id === formValues.sedeId)
      : edificios
    return list.map((e) => ({
      value: e.id,
      label: `${e.name} · ${e.floor_number ?? 5} pisos`,
    }))
  }, [edificios, formValues.sedeId])

  // Opciones de Habitaciones filtradas por Edificio (única y exclusivamente número de habitación y piso)
  const habitacionOptions = useMemo(() => {
    const list = formValues.edificioId
      ? habitaciones.filter((h) => h.building_id === formValues.edificioId)
      : habitaciones
    return list.map((h) => {
      const num = h.number ? String(h.number) : (h.name || 'Habitación')
      const piso = h.floor ? `Piso ${h.floor}` : 'Piso 1'
      return {
        value: h.id,
        label: `${num} - ${piso}`,
      }
    })
  }, [habitaciones, formValues.edificioId])

  // Opciones de Camas filtradas por Habitación
  const camaOptions = useMemo(() => {
    const list = formValues.habitacionId
      ? camas.filter((c) => c.room_id === formValues.habitacionId)
      : camas
    return list.map((c) => ({
      value: c.id,
      label: c.etiquette,
    }))
  }, [camas, formValues.habitacionId])

  const reservaDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      reservas.map((r) => {
        const guestCount =
          r.numberOfGuests ?? (r.personIds && r.personIds.length > 0 ? r.personIds.length : 1)
        const extraGuests = guestCount > 1 ? guestCount - 1 : 0
        const phone = r.guestPhone && r.guestPhone !== 'Sin teléfono' ? r.guestPhone : null
        const inDate = formatReservaDateShort(r.checkInDate)
        const outDate = formatReservaDateShort(r.checkOutDate)
        const dateSummary =
          r.checkInDate || r.checkOutDate ? ` · ${inDate} → ${outDate}` : ''

        return {
          value: r.id,
          label: `${r.guestName}${phone ? ` · ${phone}` : ''}${dateSummary}${extraGuests > 0 ? ` (+${extraGuests})` : ''}`,
          customContent: (
            <div className="flex w-full items-center justify-between gap-2.5 py-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-ink">{r.guestName}</p>
                  {extraGuests > 0 && (
                    <span
                      title={`${guestCount} huéspedes en total (${extraGuests} adicional${extraGuests > 1 ? 'es' : ''})`}
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-primary/25"
                    >
                      +{extraGuests}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <FontAwesomeIcon icon={faPhone} className="size-2.5 text-primary/70 shrink-0" aria-hidden="true" />
                    <span className="truncate">{phone ?? 'Sin teléfono'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 font-medium text-emerald-600 dark:text-emerald-400">
                    <FontAwesomeIcon icon={faCalendarDays} className="size-2.5 shrink-0" aria-hidden="true" />
                    <span>Entrada: {inDate}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 font-medium text-amber-600 dark:text-amber-400">
                    <FontAwesomeIcon icon={faCalendarDays} className="size-2.5 shrink-0" aria-hidden="true" />
                    <span>Salida: {outDate}</span>
                  </span>
                </div>
              </div>
            </div>
          ),
        }
      }),
    [reservas],
  )

  const huespedDropdownOptions = useMemo(
    () =>
      huespedes.map((p) => ({
        value: p.id,
        label: p.label,
      })),
    [huespedes],
  )

  const handleFieldChange = (
    field: keyof RecepcionInput,
    value: string | number | string[],
  ) => {
    setFormValues((prev) => {
      const next = { ...prev, [field]: value }

      if (field === 'huespedIds') {
        const arr = Array.isArray(value) ? (value as string[]) : []
        next.huespedIds = arr
        next.huespedId = arr[0] || ''
      }

      if (field === 'huespedId') {
        const strVal = String(value)
        next.huespedId = strVal
        if (strVal && (!next.huespedIds || next.huespedIds.length === 0)) {
          next.huespedIds = [strVal]
        }
      }

      if (field === 'metodoPago') {
        next.metodoPago = normalizeMetodoPago(String(value))
      }

      // Si cambia la Sede, limpiar edificio, habitación y cama si no pertenecen
      if (field === 'sedeId') {
        next.edificioId = ''
        next.habitacionId = ''
        next.camaId = ''
      }

      // Si cambia el Edificio, limpiar habitación y cama
      if (field === 'edificioId') {
        next.habitacionId = ''
        next.camaId = ''
      }

      // Si cambia la Habitación, cargar primera cama disponible
      if (field === 'habitacionId') {
        const matchingCamas = camas.filter((c) => c.room_id === String(value))
        next.camaId = matchingCamas.length > 0 ? matchingCamas[0].id : ''
        
        // Auto-asignar edificio y sede si están vacíos
        const selectedRoom = habitaciones.find((h) => h.id === String(value))
        if (selectedRoom?.building_id) {
          next.edificioId = selectedRoom.building_id
          const selectedBuilding = edificios.find((e) => e.id === selectedRoom.building_id)
          if (selectedBuilding?.headquarters_id) {
            next.sedeId = selectedBuilding.headquarters_id
          }
        }
      }

      // Si selecciona una Reserva, autocompletar toda la jerarquía
      if (field === 'reservaId') {
        const found = reservas.find((r) => r.id === value)
        if (found) {
          const resolvedPersonIds =
            Array.isArray(found.personIds) && found.personIds.length > 0
              ? found.personIds
              : found.personId
                ? [found.personId]
                : []
          next.huespedIds = resolvedPersonIds
          next.huespedId = resolvedPersonIds[0] || found.personId || ''
          if (found.roomId) {
            next.habitacionId = found.roomId
            const matchingRoom = habitaciones.find((h) => h.id === found.roomId)
            if (matchingRoom?.building_id) {
              next.edificioId = matchingRoom.building_id
              const matchingBld = edificios.find((e) => e.id === matchingRoom.building_id)
              if (matchingBld?.headquarters_id) {
                next.sedeId = matchingBld.headquarters_id
              }
            }
            const matchingCamas = camas.filter((c) => c.room_id === found.roomId)
            if (matchingCamas.length > 0) {
              next.camaId = matchingCamas[0].id
            }
          }
          if (found.checkInDate) {
            next.checkIn = found.checkInDate.slice(0, 16)
          }
          if (found.checkOutDate) {
            next.checkOut = found.checkOutDate.slice(0, 16)
          }
          setSyncNotice(
            `Reserva vinculada: ${found.guestName}. Ubicación y datos sincronizados automáticamente.`,
          )
        } else {
          setSyncNotice(null)
        }
      }

      return next
    })

    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (field === 'huespedIds' && errors.huespedId) {
      setErrors((prev) => ({ ...prev, huespedId: undefined }))
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSubmitError(null)

    const validation = validateRecepcionInput(formValues)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setSubmitting(true)

    const cleanDeposit = Number(
      formValues.depositoGarantia.toString().replace(',', '.').trim(),
    )
    const backendPayment =
      PAYMENT_METHOD_BACKEND_MAP[formValues.metodoPago] || 'cash'
    const backendStatus = STATUS_BACKEND_MAP[formValues.estado] || 'progress'
    const createdByEmail = getCreatedByFromLocalStorage()

    const personIds =
      Array.isArray(formValues.huespedIds) && formValues.huespedIds.length > 0
        ? formValues.huespedIds
        : formValues.huespedId
          ? [formValues.huespedId]
          : []

    const payload: RecepcionPayload = {
      room_id: formValues.habitacionId,
      reservation_id: formValues.reservaId,
      person_ids: personIds,
      check_in_date: formatToIsoUtc(formValues.checkIn),
      check_out_date: formatToIsoUtc(formValues.checkOut),
      payment_method: backendPayment,
      security_deposit: isNaN(cleanDeposit) ? 0 : cleanDeposit,
      remarks: formValues.observaciones?.trim() || '',
      status: backendStatus,
      created_by: createdByEmail,
    }

    // Ventana deliberada para reflejar la construcción, empaquetado y verificación del payload
    await new Promise((resolve) => setTimeout(resolve, 600))

    try {
      const created = await repository.createRecepcion(payload)
      setSuccessRecepcion(created)
      if (onSuccessCallback) {
        onSuccessCallback(created)
      }
    } catch (err: unknown) {
      if (err instanceof RecepcionApiError) {
        setSubmitError(err.serverMessage || err.message)
      } else {
        setSubmitError(
          'No logramos completar el registro en este instante. La información ingresada sigue intacta; por favor verifica los datos e inténtalo nuevamente.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormValues(initialRecepcionFormValues)
    setErrors({})
    setSubmitError(null)
    setSuccessRecepcion(null)
    setSyncNotice(null)
  }

  return {
    formValues,
    errors,
    loadingDependencies,
    dependencyError,
    sedeOptions,
    edificioOptions,
    habitacionOptions,
    habitacionDropdownOptions: habitacionOptions,
    camaOptions,
    reservaDropdownOptions,
    huespedDropdownOptions,
    metodoPagoOptions: METODO_PAGO_OPTIONS,
    estadoOptions: ESTADO_OPTIONS,
    submitting,
    submitError,
    successRecepcion,
    syncNotice,
    handleFieldChange,
    handleSubmit,
    handleReset,
    loadDependencies,
  }
}
