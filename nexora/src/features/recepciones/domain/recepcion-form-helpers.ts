import { readAuthTokenEmail } from '../../../shared/auth-storage'
import {
  formatToIsoUtc,
  getDefaultCheckInDateTime,
  getDefaultCheckOutDateTime,
  normalizeMetodoPago,
  PAYMENT_METHOD_BACKEND_MAP,
  STATUS_BACKEND_MAP,
  type CamaInfo,
  type EdificioInfo,
  type HabitacionInfo,
  type RecepcionInput,
  type RecepcionPayload,
  type ReservaInfo,
} from './recepcion'

export interface RecepcionFormCatalogs {
  camas: CamaInfo[]
  habitaciones: HabitacionInfo[]
  edificios: EdificioInfo[]
  reservas: ReservaInfo[]
}

/**
 * Obtiene el email del usuario autenticado desde el almacén compartido de sesión.
 */
export function getCreatedByFromLocalStorage(): string {
  try {
    const email = readAuthTokenEmail()
    return email && email !== 'user_system' ? email : 'recepcion@nexora.com'
  } catch {
    return 'recepcion@nexora.com'
  }
}

export function createInitialRecepcionFormValues(): RecepcionInput {
  return {
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
}

import {
  mapCamaOptions,
  mapEdificioOptions,
  mapHabitacionOptions,
  mapHuespedOptions,
  mapReservaDropdownOptions,
  mapSedeOptions,
  buildReservaOptionDescriptor,
  filterActiveReservasForCheckIn,
  formatReservaDateShort,
} from './recepcion-option-mappers'

export {
  buildReservaOptionDescriptor,
  filterActiveReservasForCheckIn,
  formatReservaDateShort,
  mapCamaOptions,
  mapEdificioOptions,
  mapHabitacionOptions,
  mapHuespedOptions,
  mapReservaDropdownOptions,
  mapSedeOptions,
}

/**
 * Convierte una fecha ISO (UTC o local) al formato local `YYYY-MM-DDTHH:mm`
 * requerido por inputs `<input type="datetime-local" />`.
 */
export function formatIsoToLocalDateTimeInput(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) {
      return dateStr.slice(0, 16)
    }
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
      parsed.getDate()
    )}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
  } catch {
    return dateStr.slice(0, 16)
  }
}

/**
 * Función pura de transición de estado para actualizar jerarquía y autocompletados
 * sin provocar efectos secundarios dentro del updater de React.
 */
export function applyRecepcionFieldUpdate(
  prev: RecepcionInput,
  field: keyof RecepcionInput,
  value: string | number | string[],
  catalogs: RecepcionFormCatalogs
): RecepcionInput {
  const next: RecepcionInput = { ...prev, [field]: value }

  if (field === 'huespedIds') {
    const arr = Array.isArray(value) ? (value as string[]) : []
    next.huespedIds = arr
    next.huespedId = arr[0] || ''
    return next
  }

  if (field === 'huespedId') {
    const strVal = String(value)
    next.huespedId = strVal
    if (strVal && (!next.huespedIds || next.huespedIds.length === 0)) {
      next.huespedIds = [strVal]
    }
    return next
  }

  if (field === 'metodoPago') {
    next.metodoPago = normalizeMetodoPago(String(value))
    return next
  }

  if (field === 'sedeId') {
    next.edificioId = ''
    next.habitacionId = ''
    next.camaId = ''
    return next
  }

  if (field === 'edificioId') {
    next.habitacionId = ''
    next.camaId = ''
    return next
  }

  if (field === 'habitacionId') {
    const roomIdStr = String(value)
    const matchingCamas = catalogs.camas.filter((c) => c.room_id === roomIdStr)
    next.camaId = matchingCamas.length > 0 ? matchingCamas[0].id : ''

    const selectedRoom = catalogs.habitaciones.find((h) => h.id === roomIdStr)
    if (selectedRoom?.building_id) {
      next.edificioId = selectedRoom.building_id
      const selectedBuilding = catalogs.edificios.find(
        (e) => e.id === selectedRoom.building_id
      )
      if (selectedBuilding?.headquarters_id) {
        next.sedeId = selectedBuilding.headquarters_id
      }
    }
    return next
  }

  if (field === 'reservaId') {
    const found = catalogs.reservas.find((r) => r.id === value)
    if (!found) return next

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
      const matchingRoom = catalogs.habitaciones.find(
        (h) => h.id === found.roomId
      )
      if (matchingRoom?.building_id) {
        next.edificioId = matchingRoom.building_id
        const matchingBld = catalogs.edificios.find(
          (e) => e.id === matchingRoom.building_id
        )
        if (matchingBld?.headquarters_id) {
          next.sedeId = matchingBld.headquarters_id
        }
      }
      const matchingCamas = catalogs.camas.filter(
        (c) => c.room_id === found.roomId
      )
      if (matchingCamas.length > 0) {
        next.camaId = matchingCamas[0].id
      }
    }

    if (found.checkInDate) {
      next.checkIn = formatIsoToLocalDateTimeInput(found.checkInDate)
    }
    if (found.checkOutDate) {
      next.checkOut = formatIsoToLocalDateTimeInput(found.checkOutDate)
    }
  }

  return next
}

export function buildRecepcionPayload(values: RecepcionInput): RecepcionPayload {
  const cleanDeposit = Number(
    values.depositoGarantia.toString().replace(',', '.').trim()
  )
  const backendPayment = PAYMENT_METHOD_BACKEND_MAP[values.metodoPago] || 'cash'
  const backendStatus = STATUS_BACKEND_MAP[values.estado] || 'progress'
  const createdByEmail = getCreatedByFromLocalStorage()

  const personIds =
    Array.isArray(values.huespedIds) && values.huespedIds.length > 0
      ? values.huespedIds
      : values.huespedId
        ? [values.huespedId]
        : []

  return {
    room_id: values.habitacionId,
    reservation_id: values.reservaId,
    person_ids: personIds,
    check_in_date: formatToIsoUtc(values.checkIn),
    check_out_date: formatToIsoUtc(values.checkOut),
    payment_method: backendPayment,
    security_deposit: isNaN(cleanDeposit) ? 0 : cleanDeposit,
    remarks: values.observaciones?.trim() || '',
    status: backendStatus,
    created_by: createdByEmail,
  }
}

export function mergeCatalogItemsById<T extends { id: string }>(
  incoming: T[],
  existing: T[]
): T[] {
  const byId = new Map(incoming.map((item) => [item.id, item]))
  for (const prev of existing) {
    if (!byId.has(prev.id)) {
      byId.set(prev.id, prev)
    }
  }
  return Array.from(byId.values())
}

export function mergeRoomsPreservingLocation(
  incoming: HabitacionInfo[],
  existing: HabitacionInfo[],
  overrideWithHqRooms?: HabitacionInfo[]
): HabitacionInfo[] {
  const byId = new Map(incoming.map((room) => [room.id, room]))
  for (const prev of existing) {
    if (prev.headquarters_id) {
      byId.set(prev.id, { ...byId.get(prev.id), ...prev })
    }
  }
  if (overrideWithHqRooms) {
    for (const hqRoom of overrideWithHqRooms) {
      byId.set(hqRoom.id, { ...byId.get(hqRoom.id), ...hqRoom })
    }
  }
  return Array.from(byId.values())
}
