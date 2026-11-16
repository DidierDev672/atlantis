/**
 * Contratos de dominio, formateadores semánticos y datos de contingencia
 * para la selección de estancias y recepciones de servicio a la habitación.
 */

export interface RawStayApi {
  id: string
  room_id: string
  reservation_id?: string | null
  person_ids?: string[]
  check_in_date: string
  check_out_date: string
  payment_method?: string
  security_deposit?: number
  remarks?: string
  status?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface RoomDetailApi {
  id: string
  number: string
  floor: number
  room_types_id: string
  building_id: string
  price_override?: number
  status: string
  has_reception: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface ReserveDetailApi {
  id: string
  room_id: string
  person_id: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  state: string
  total_price?: number
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface PersonDetailApi {
  id: string
  document_type: string
  document_number: string
  name: string
  phone_number: string
  email: string
  date_of_birth: string
  gender: string
  nationality?: string
  roles?: string[]
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface RecepcionSeleccionada {
  id: string
  label: string
  huespedNombre: string
  habitacionNumero: string
  habitacionNombre?: string
  tieneReserva: boolean
  cantidadHuespedes: number
  checkInFormateado: string
  checkOutFormateado: string
  roomId: string
  reservationId?: string | null
  personIds?: string[]
  sedeNombre?: string
  room?: RoomDetailApi
  reserve?: ReserveDetailApi | null
  person?: PersonDetailApi
}

export function formatearFecha(isoString?: string): string {
  if (!isoString) return 'Por definir'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'Por definir'
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return 'Por definir'
  }
}

export function formatearFechaHora(isoString?: string): string {
  if (!isoString) return 'Por definir'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'Por definir'
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Por definir'
  }
}

export function formatDocType(type?: string): string {
  switch (type?.toLowerCase()) {
    case 'id_card':
    case 'national_id':
      return 'DNI / Cédula'
    case 'passport':
      return 'Pasaporte'
    case 'foreign_card':
      return 'Carné de Extranjería'
    default:
      return 'Doc. Identidad'
  }
}

export function formatGender(gender?: string): string {
  switch (gender?.toUpperCase()) {
    case 'M':
      return 'Masculino'
    case 'F':
      return 'Femenino'
    default:
      return 'No especificado'
  }
}

const ROOM_TYPES_CATALOG: Record<string, string> = {
  'type-1': 'Suite Presidencial',
  'type-2': 'Doble Superior',
  'type-3': 'Master Suite Ejecutiva',
}

export function formatRoomType(roomTypeId?: string): string {
  if (!roomTypeId) return 'Estándar'
  return ROOM_TYPES_CATALOG[roomTypeId] || 'Suite Confort'
}

const BUILDINGS_CATALOG: Record<string, string> = {
  'building-1': 'Torre Panorámica A',
  'building-2': 'Torre Ejecutiva B',
}

export function formatBuilding(buildingId?: string): string {
  if (!buildingId) return 'Edificio Principal'
  return BUILDINGS_CATALOG[buildingId] || 'Torre Central'
}

export function formatRoomStatus(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'available':
      return 'Disponible'
    case 'occupied':
      return 'Ocupada'
    case 'maintenance':
      return 'Mantenimiento'
    default:
      return 'Activa'
  }
}

export function getRoomStatusColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'available':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'occupied':
      return 'text-amber-600 dark:text-amber-400'
    case 'maintenance':
      return 'text-rose-600 dark:text-rose-400'
    default:
      return 'text-ink-muted'
  }
}

export function formatReserveState(state?: string): string {
  switch (state?.toLowerCase()) {
    case 'confirmed':
      return 'Confirmada'
    case 'pending':
      return 'Pendiente'
    case 'cancelled':
      return 'Cancelada'
    default:
      return 'En curso'
  }
}

export function getReserveStateBadge(state?: string): string {
  switch (state?.toLowerCase()) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
    case 'pending':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
    default:
      return 'bg-canvas text-ink-muted border-line'
  }
}

export const STAYS_FALLBACK: RawStayApi[] = [
  {
    id: 'stay-1',
    room_id: 'room-1',
    reservation_id: 'res-1',
    person_ids: ['person-1'],
    check_in_date: '2026-10-01T15:04:05Z',
    check_out_date: '2026-10-02T15:04:05Z',
    payment_method: 'cash',
    security_deposit: 50,
    remarks: '',
    status: 'progress',
    created_by: 'recepcion',
  },
  {
    id: 'stay-2',
    room_id: 'room-2',
    reservation_id: 'res-2',
    person_ids: ['person-2'],
    check_in_date: '2026-10-02T12:00:00Z',
    check_out_date: '2026-10-05T11:00:00Z',
    payment_method: 'card',
    security_deposit: 100,
    remarks: 'Preferencia piso alto',
    status: 'progress',
    created_by: 'recepcion',
  },
  {
    id: 'stay-3',
    room_id: 'room-3',
    reservation_id: null,
    person_ids: ['person-3'],
    check_in_date: '2026-10-03T16:30:00Z',
    check_out_date: '2026-10-06T10:00:00Z',
    payment_method: 'bank_transfer',
    security_deposit: 0,
    remarks: 'Habitación silenciosa',
    status: 'progress',
    created_by: 'recepcion',
  },
]

export const ROOMS_FALLBACK: Record<string, RoomDetailApi> = {
  'room-1': {
    id: 'room-1',
    number: '101',
    floor: 1,
    room_types_id: 'type-1',
    building_id: 'building-1',
    price_override: 450.0,
    status: 'available',
    has_reception: true,
  },
  'room-2': {
    id: 'room-2',
    number: '204',
    floor: 2,
    room_types_id: 'type-2',
    building_id: 'building-1',
    price_override: 320.0,
    status: 'available',
    has_reception: true,
  },
  'room-3': {
    id: 'room-3',
    number: '305',
    floor: 3,
    room_types_id: 'type-3',
    building_id: 'building-2',
    price_override: 600.0,
    status: 'occupied',
    has_reception: false,
  },
}

export const RESERVES_FALLBACK: Record<string, ReserveDetailApi> = {
  'res-1': {
    id: 'res-1',
    room_id: 'room-1',
    person_id: 'person-1',
    check_in_date: '2026-10-10T15:04:05Z',
    check_out_date: '2026-10-12T15:04:05Z',
    number_of_guests: 2,
    state: 'pending',
    total_price: 250000,
  },
  'res-2': {
    id: 'res-2',
    room_id: 'room-2',
    person_id: 'person-2',
    check_in_date: '2026-10-11T14:00:00Z',
    check_out_date: '2026-10-14T11:00:00Z',
    number_of_guests: 1,
    state: 'confirmed',
    total_price: 320000,
  },
}

export const PERSONS_FALLBACK: Record<string, PersonDetailApi> = {
  'person-1': {
    id: 'person-1',
    document_type: 'id_card',
    document_number: '12345678',
    name: 'Juan Pérez',
    phone_number: '999888777',
    email: 'juan@example.com',
    date_of_birth: '1990-05-15T00:00:00Z',
    gender: 'M',
    nationality: 'Peruana',
  },
  'person-2': {
    id: 'person-2',
    document_type: 'passport',
    document_number: 'P98765432',
    name: 'Ana Gómez',
    phone_number: '987654321',
    email: 'ana.gomez@example.com',
    date_of_birth: '1994-08-20T00:00:00Z',
    gender: 'F',
    nationality: 'Colombiana',
  },
  'person-3': {
    id: 'person-3',
    document_type: 'id_card',
    document_number: '45678912',
    name: 'Roberto Valdés',
    phone_number: '912345678',
    email: 'roberto.valdes@example.com',
    date_of_birth: '1988-11-03T00:00:00Z',
    gender: 'M',
    nationality: 'Chilena',
  },
}

export function crearRoomFallback(roomId: string): RoomDetailApi {
  return (
    ROOMS_FALLBACK[roomId] || {
      id: roomId,
      number: roomId.replace(/\D/g, '') || '101',
      floor: 1,
      room_types_id: 'type-1',
      building_id: 'building-1',
      status: 'available',
      has_reception: true,
    }
  )
}

export function crearPersonFallback(personId: string): PersonDetailApi {
  return (
    PERSONS_FALLBACK[personId] || {
      id: personId,
      document_type: 'id_card',
      document_number: '12345678',
      name: 'Huésped Registrado',
      phone_number: '999888777',
      email: 'huesped@nexora.com',
      date_of_birth: '1990-05-15T00:00:00Z',
      gender: 'M',
    }
  )
}

export function construirFallbackRecepciones(): RecepcionSeleccionada[] {
  return STAYS_FALLBACK.map((stay) => {
    const r = crearRoomFallback(stay.room_id)
    const res = stay.reservation_id ? RESERVES_FALLBACK[stay.reservation_id] ?? null : null
    const p = crearPersonFallback(stay.person_ids?.[0] || 'person-1')

    return {
      id: stay.id,
      label: `Habitación ${r.number} · ${p.name}`,
      huespedNombre: p.name,
      habitacionNumero: r.number,
      habitacionNombre: `Habitación ${r.number}`,
      tieneReserva: Boolean(stay.reservation_id),
      cantidadHuespedes: res?.number_of_guests || 1,
      checkInFormateado: formatearFechaHora(res?.check_in_date || stay.check_in_date),
      checkOutFormateado: formatearFechaHora(res?.check_out_date || stay.check_out_date),
      roomId: stay.room_id,
      reservationId: stay.reservation_id ?? null,
      personIds: stay.person_ids,
      sedeNombre: formatBuilding(r.building_id),
      room: r,
      reserve: res,
      person: p,
    }
  })
}
