export type SalidaFilterOption = 'todos' | 'hoy' | 'manana'

export type DepartureWindow = 'hoy' | 'manana' | 'otro' | 'sin_fecha'

export type GuestSourceKind = 'recepcion' | 'reserva' | 'ambos' | 'registrado'

export interface PersonApiDto {
  id?: string
  person_id?: string
  document_type?: string
  document_number?: string
  name?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  email?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  roles?: string[]
  created_by?: string
  check_out_date?: string
  checkout_date?: string
}

export interface GuestServiceRequestOrderSummary {
  id: string
  orderNumber?: string
  subtotal: number
  taxes: number
  total: number
  status?: string
  createdAt?: string
}

export interface GuestServiceRequestProduct {
  /** Clave interna de renderizado React; nunca se muestra en la UI */
  internalKey: string
  name: string
  amount: number
  unitPrice: number
  lineTotal: number
  orderNumber?: string
  statusLabel?: string
  currency: string
  note?: string
}

export interface SalidaHuespedItem {
  /** Clave interna de renderizado React; nunca se muestra en la UI */
  internalKey: string
  /** Identificador interno para consultas por huésped; nunca se muestra en la UI */
  personId: string
  name: string
  phoneNumber: string
  email?: string
  documentTypeRaw: string
  documentTypeLabel: string
  documentNumber: string
  dateOfBirthRaw: string
  dateOfBirthFormatted: string
  ageText: string
  genderRaw: string
  genderLabel: string
  genderTone: 'indigo' | 'rose' | 'amber'
  sourceKind: GuestSourceKind
  sourceLabel: string
  receptionCount: number
  serviceRequestCount: number
  receptionsTotal: number
  reservesTotal: number
  serviceRequestsTotal: number
  deliveredServiceOrdersCount?: number
  deliveredServiceRequestsTotal?: number
  serviceRequestProducts: GuestServiceRequestProduct[]
  serviceRequestOrders?: GuestServiceRequestOrderSummary[]
  checkInDateRaw?: string | null
  checkInDateFormatted?: string
  checkInTimeFormatted?: string
  checkOutDateRaw: string | null
  checkOutDateFormatted?: string
  checkOutTimeFormatted?: string
  departureWindow: DepartureWindow
  departureLabel: string
  roomId?: string
  primaryRoomId?: string
  roomNumber?: string
  roomFloor?: string
  roomStatus?: string
  stayId?: string
  primaryStayId?: string
  primaryReserveId?: string
  stayPersonIds?: string[]
  securityDeposit?: number
  depositPaymentMethod?: string
  stayStatus?: string
  isTodayActivity?: boolean
}

export function formatStayDateAndTime(
  rawDate?: string | null,
  fallbackTime = '—',
): { dateText: string; timeText: string } {
  if (!rawDate) {
    return { dateText: 'Por definir', timeText: fallbackTime }
  }
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) {
    return { dateText: rawDate, timeText: fallbackTime }
  }
  const dateText = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)

  const hasTimeComponent = rawDate.includes('T') || rawDate.includes(':')
  if (!hasTimeComponent) {
    return { dateText, timeText: fallbackTime }
  }

  const timeText = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed)

  return { dateText, timeText }
}

export interface ReceptionRecordRef {
  id?: string
  reservation_id?: string
  person_id?: string
  person_ids?: string[]
  persons?: Array<string | { id?: string; person_id?: string }>
  check_out_date?: string
  status?: string
  state?: string
}

export interface ReceptionLookupOptions {
  /** Mapa reservation_id -> personIds obtenido de /reserve */
  reservePersonIdsMap?: ReadonlyMap<string, ReadonlyArray<string>>
  /** Mapa stay_id -> personIds obtenido de /stays_person/{stay_id} */
  stayPersonIdsMap?: ReadonlyMap<string, ReadonlyArray<string>>
}

export function resolvePersonId(dto: PersonApiDto): string {
  return dto.id?.trim() || dto.person_id?.trim() || ''
}

export const SALIDA_FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'hoy', label: 'Salen hoy' },
  { value: 'manana', label: 'Salen mañana' },
] as const

export function formatSalidaDocumentType(documentType?: string | null): string {
  if (!documentType) return 'Sin documento'
  const normalized = documentType.toLowerCase().trim()

  switch (normalized) {
    case 'national_id':
    case 'cedula':
    case 'dni':
      return 'Cédula de ciudadanía'
    case 'id_card':
    case 'tarjeta_identidad':
      return 'Tarjeta de identidad'
    case 'foreign_id':
    case 'tarjeta_extranjera':
      return 'Cédula de extranjería'
    case 'passport':
    case 'pasaporte':
      return 'Pasaporte'
    default:
      return documentType.replace(/_/g, ' ')
  }
}

export function formatSalidaGender(gender?: string | null): {
  label: string
  tone: 'indigo' | 'rose' | 'amber'
} {
  if (!gender) {
    return { label: 'No especificado', tone: 'amber' }
  }
  const normalized = gender.trim().toUpperCase()
  if (normalized === 'M' || normalized === 'MASC' || normalized === 'MASCULINO' || normalized === 'MALE') {
    return { label: 'Masculino', tone: 'indigo' }
  }
  if (normalized === 'F' || normalized === 'FEM' || normalized === 'FEMENINO' || normalized === 'FEMALE') {
    return { label: 'Femenino', tone: 'rose' }
  }
  return { label: gender, tone: 'amber' }
}

export function formatSalidaBirthDate(dateStr?: string | null): {
  formatted: string
  ageText: string
} {
  if (!dateStr) {
    return { formatted: 'No registrada', ageText: '' }
  }

  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) {
    return { formatted: dateStr, ageText: '' }
  }

  const formatted = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)

  const today = new Date()
  let age = today.getUTCFullYear() - parsed.getUTCFullYear()
  const monthDiff = today.getUTCMonth() - parsed.getUTCMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getUTCDate() < parsed.getUTCDate())
  ) {
    age -= 1
  }

  const ageText = age >= 0 && age <= 120 ? `${age} años` : ''
  return { formatted, ageText }
}

export function getGuestInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'HU'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function extractIsoDateKey(dateStr: string): string | null {
  const isoPrefix = dateStr.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoPrefix && !dateStr.includes('T')) {
    return isoPrefix[1]
  }
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return null
  return toLocalDateKey(parsed)
}

export function classifyDepartureWindow(
  checkOutDate?: string | null,
  referenceDate: Date = new Date()
): DepartureWindow {
  if (!checkOutDate) return 'sin_fecha'
  const targetKey = extractIsoDateKey(checkOutDate)
  if (!targetKey) return 'sin_fecha'

  const todayKey = toLocalDateKey(referenceDate)
  const tomorrow = new Date(referenceDate)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = toLocalDateKey(tomorrow)

  if (targetKey === todayKey) return 'hoy'
  if (targetKey === tomorrowKey) return 'manana'
  return 'otro'
}

export function formatDepartureLabel(
  checkOutDate?: string | null,
  window: DepartureWindow = classifyDepartureWindow(checkOutDate)
): string {
  if (window === 'hoy') return 'Sale hoy'
  if (window === 'manana') return 'Sale mañana'
  if (!checkOutDate) return 'Salida por confirmar'

  const parsed = new Date(checkOutDate)
  if (Number.isNaN(parsed.getTime())) return 'Salida programada'

  return `Sale el ${new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)}`
}

export function formatSourceLabel(kind: GuestSourceKind): string {
  switch (kind) {
    case 'recepcion':
      return 'Con recepción'
    case 'reserva':
      return 'Con reserva'
    case 'ambos':
      return 'Recepción y reserva'
    default:
      return 'Huésped registrado'
  }
}

export function isCanceledStayOrReserve(record: ReceptionRecordRef): boolean {
  const status = (record.status ?? record.state ?? '').trim().toLowerCase()
  return (
    status === 'canceled' ||
    status === 'cancelled' ||
    status === 'cancelada'
  )
}

export function getUniquePersonIdsFromRecord(
  record: ReceptionRecordRef,
  options?: ReceptionLookupOptions
): string[] {
  const unique = new Set<string>()
  if (Array.isArray(record.person_ids)) {
    for (const id of record.person_ids) {
      const clean = id?.trim()
      if (clean) unique.add(clean)
    }
  }
  const single = record.person_id?.trim()
  if (single) unique.add(single)

  if (Array.isArray(record.persons)) {
    for (const entry of record.persons) {
      if (typeof entry === 'string') {
        const clean = entry.trim()
        if (clean) unique.add(clean)
      } else if (entry && typeof entry === 'object') {
        const clean = entry.id?.trim() || entry.person_id?.trim()
        if (clean) unique.add(clean)
      }
    }
  }

  const reservationId = record.reservation_id?.trim()
  if (reservationId && options?.reservePersonIdsMap) {
    const linkedIds = options.reservePersonIdsMap.get(reservationId) ?? []
    for (const pid of linkedIds) {
      const clean = pid?.trim()
      if (clean) unique.add(clean)
    }
  }

  const stayId = record.id?.trim()
  if (stayId && options?.stayPersonIdsMap) {
    const stayLinkedIds = options.stayPersonIdsMap.get(stayId) ?? []
    for (const pid of stayLinkedIds) {
      const clean = pid?.trim()
      if (clean) unique.add(clean)
    }
  }

  return Array.from(unique)
}

/**
 * Busca todas las recepciones activas (no canceladas) de un huésped
 * usando su `personId` como parámetro de búsqueda.
 */
export function findReceptionsByPersonId<T extends ReceptionRecordRef>(
  personId: string,
  stays: ReadonlyArray<T>,
  options?: ReceptionLookupOptions
): T[] {
  const targetId = personId.trim()
  if (!targetId) return []

  const seenStayKeys = new Set<string>()
  const matches: T[] = []

  stays.forEach((stay, index) => {
    if (isCanceledStayOrReserve(stay)) return
    const stayKey = stay.id?.trim() || `stay-idx-${index}`
    if (seenStayKeys.has(stayKey)) return

    const personIds = getUniquePersonIdsFromRecord(stay, options)
    if (personIds.includes(targetId)) {
      seenStayKeys.add(stayKey)
      matches.push(stay)
    }
  })

  return matches
}

/**
 * Construye un mapa con la cantidad de recepciones activas (no canceladas)
 * por cada ID de huésped a partir de los registros de `/stays`.
 */
export function buildReceptionCountMap(
  stays: ReadonlyArray<ReceptionRecordRef>,
  options?: ReceptionLookupOptions
): Map<string, number> {
  const counts = new Map<string, number>()
  const seenStayKeys = new Set<string>()

  stays.forEach((stay, index) => {
    if (isCanceledStayOrReserve(stay)) return
    const stayKey = stay.id?.trim() || `stay-idx-${index}`
    if (seenStayKeys.has(stayKey)) return
    seenStayKeys.add(stayKey)

    for (const pid of getUniquePersonIdsFromRecord(stay, options)) {
      counts.set(pid, (counts.get(pid) ?? 0) + 1)
    }
  })

  return counts
}

/**
 * Identifica cuántas recepciones activas (no canceladas) tiene un huésped
 * buscando por su ID (`personId`).
 */
export function countGuestReceptions(
  personId: string,
  stays: ReadonlyArray<ReceptionRecordRef>,
  options?: ReceptionLookupOptions
): number {
  return findReceptionsByPersonId(personId, stays, options).length
}

export function formatCurrencyAmount(
  amount: number,
  currency = 'COP'
): string {
  const safe = Number.isFinite(amount) ? amount : 0
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      minimumFractionDigits: Number.isInteger(safe) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(safe)
  } catch {
    return `$ ${safe.toLocaleString('es-CO')}`
  }
}

export function formatServiceOrderStatus(status?: string | null): string {
  if (!status) return 'Pendiente'
  const norm = status.trim().toLowerCase()
  switch (norm) {
    case 'pending':
    case 'pendiente':
      return 'Pendiente'
    case 'preparing':
    case 'in_progress':
    case 'en_preparacion':
      return 'En preparación'
    case 'delivered':
    case 'completed':
    case 'entregado':
      return 'Entregado'
    case 'canceled':
    case 'cancelled':
    case 'cancelado':
      return 'Cancelado'
    default:
      return status
  }
}
