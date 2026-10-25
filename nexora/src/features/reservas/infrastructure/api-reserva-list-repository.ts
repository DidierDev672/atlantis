import axios from 'axios'
import { api } from '../../../lib/api'
import { validateStatusCode, type StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import type { ReservaApiDto, ReservaGuestItem, ReservaTone, ReservaViewItem } from '../domain/reserva-list-types'
import { MOCK_PERSON_CATALOG, MOCK_RESERVAS_DATA, MOCK_ROOM_CATALOG } from './mock-reservas-data'
import { executeBalancedRequest } from './api-load-balancer'

export interface FetchReservasResult {
  items: ReservaViewItem[]
  validation: StatusCodeValidationResult
  isFallback: boolean
}

function parseReservaTone(state: string): { label: string; tone: ReservaTone } {
  const norm = (state || '').toLowerCase().trim()
  if (norm === 'progress' || norm === 'progreso' || norm === 'in progress' || norm === 'en curso') {
    return { label: 'Progreso', tone: 'blue' }
  }
  if (norm === 'completed' || norm === 'completada' || norm === 'finalizada') {
    return { label: 'Completada', tone: 'purple' }
  }
  if (norm === 'canceled' || norm === 'cancelada' || norm === 'cancelled') {
    return { label: 'Cancelada', tone: 'red' }
  }
  if (norm === 'confirmed' || norm === 'confirmada') return { label: 'Confirmada', tone: 'emerald' }
  if (norm === 'pending' || norm === 'pendiente') return { label: 'Pendiente', tone: 'amber' }
  if (norm === 'no show' || norm === 'no se presento') return { label: 'No se presentó', tone: 'stone' }
  return { label: state || 'Sin estado', tone: 'stone' }
}

function formatLocalDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return 'Fecha por definir'
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Fecha por definir'
  }
}

function calculateNights(checkIn: string, checkOut: string): number {
  try {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    const nights = Math.round(diff / (1000 * 60 * 60 * 24))
    return nights > 0 ? nights : 1
  } catch {
    return 1
  }
}

function formatPriceCOP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$ 0 COP'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function transformReservaDto(
  dto: ReservaApiDto,
  roomsMap: Map<string, string>,
  personsMap: Map<string, string>
): ReservaViewItem {
  const rawState = dto.status || dto.state || 'progress'
  const { label: stateLabel, tone: stateTone } = parseReservaTone(rawState)

  // Regla de oro: No visualizar los id para experiencia de usuario.
  let roomName = roomsMap.get(dto.room_id) || MOCK_ROOM_CATALOG[dto.room_id]?.name
  if (!roomName || roomName === dto.room_id) {
    roomName = 'Habitación asignada'
  }

  const primaryPersonId =
    (Array.isArray(dto.person_ids) && dto.person_ids.length > 0 ? dto.person_ids[0] : undefined) ||
    dto.person_id ||
    ''

  let personName = personsMap.get(primaryPersonId) || MOCK_PERSON_CATALOG[primaryPersonId]
  if (!personName || personName === primaryPersonId) {
    personName = 'Huésped registrado'
  }

  const numberOfGuests =
    (Array.isArray(dto.person_ids) && dto.person_ids.length > 0 ? dto.person_ids.length : undefined) ||
    dto.number_of_guests ||
    1

  const price = dto.total_price || (typeof dto.security_deposit === 'number' ? dto.security_deposit : 0)

  // Resolver lista completa de huéspedes y sus iniciales
  const rawPersonIds = Array.isArray(dto.person_ids) && dto.person_ids.length > 0
    ? dto.person_ids
    : primaryPersonId
    ? [primaryPersonId]
    : []

  const guests: ReservaGuestItem[] = []

  rawPersonIds.forEach((pid, idx) => {
    let name = personsMap.get(pid) || MOCK_PERSON_CATALOG[pid]
    if (!name || name === pid) {
      name = idx === 0 ? personName : `Acompañante ${idx + 1}`
    }
    const initials =
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('') || (idx === 0 ? 'HT' : `A${idx + 1}`)
    guests.push({ id: pid, name, initials })
  })

  if (guests.length === 0) {
    const initials =
      personName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('') || 'HT'
    guests.push({ id: primaryPersonId, name: personName, initials })
  }

  if (numberOfGuests > guests.length) {
    const diff = numberOfGuests - guests.length
    for (let i = 1; i <= diff; i++) {
      guests.push({
        name: `Acompañante ${i}`,
        initials: `A${i}`,
      })
    }
  }

  return {
    id: dto.id,
    roomId: dto.room_id,
    roomDisplayName: roomName,
    personId: primaryPersonId,
    personIds: Array.isArray(dto.person_ids) ? dto.person_ids : primaryPersonId ? [primaryPersonId] : [],
    personDisplayName: personName,
    guests,
    checkInDate: dto.check_in_date,
    checkInFormatted: formatLocalDate(dto.check_in_date),
    checkOutDate: dto.check_out_date,
    checkOutFormatted: formatLocalDate(dto.check_out_date),
    nights: calculateNights(dto.check_in_date, dto.check_out_date),
    numberOfGuests,
    state: rawState,
    stateLabel,
    stateTone,
    totalPrice: price,
    totalPriceFormatted: formatPriceCOP(price),
    paymentMethod: dto.payment_method,
    securityDeposit: dto.security_deposit,
    remarks: dto.remarks,
    createdBy: dto.created_by || 'Recepción',
    createdAt: dto.created_at,
  }
}

export async function fetchReservasFromApi(): Promise<FetchReservasResult> {
  const roomsMap = new Map<string, string>()
  const personsMap = new Map<string, string>()

  try {
    const minChance = new Promise((resolve) => setTimeout(resolve, 500))
    const [resRooms, resPersons] = await Promise.allSettled([
      executeBalancedRequest(() =>
        api.get<Array<{ id: string; number?: string; floor?: number }>>('/room', { validateStatus: () => true })
      ),
      executeBalancedRequest(() =>
        api.get<Array<{ id: string; first_name?: string; last_name?: string; name?: string }>>('/persons', { validateStatus: () => true })
      ),
    ])

    if (resRooms.status === 'fulfilled' && Array.isArray(resRooms.value.data)) {
      resRooms.value.data.forEach((r) => {
        roomsMap.set(r.id, `Habitación ${r.number ?? ''}${r.floor ? ` · Piso ${r.floor}` : ''}`.trim())
      })
    }
    if (resPersons.status === 'fulfilled' && Array.isArray(resPersons.value.data)) {
      resPersons.value.data.forEach((p) => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Huésped registrado'
        personsMap.set(p.id, fullName)
      })
    }

    // Consumo balanceado del endpoint /stay con el método GET
    const [response] = await Promise.all([
      executeBalancedRequest(() =>
        api.get<unknown>('/stay', {
          validateStatus: () => true,
        })
      ),
      minChance,
    ])

    // Validación de status code con status-code-validator.ts
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const rawData = response.data
      let staysList: ReservaApiDto[] = []

      // Soporte tanto para Array directo como para envoltura JSON ({ data: [...] }, { stays: [...] }, { items: [...] } o single object)
      if (Array.isArray(rawData)) {
        staysList = rawData as ReservaApiDto[]
      } else if (rawData && typeof rawData === 'object') {
        const obj = rawData as Record<string, unknown>
        if (Array.isArray(obj.data)) {
          staysList = obj.data as ReservaApiDto[]
        } else if (Array.isArray(obj.stays)) {
          staysList = obj.stays as ReservaApiDto[]
        } else if (Array.isArray(obj.items)) {
          staysList = obj.items as ReservaApiDto[]
        } else if (obj.id) {
          staysList = [obj as unknown as ReservaApiDto]
        }
      }

      if (staysList.length > 0) {
        const items = staysList.map((dto) => transformReservaDto(dto, roomsMap, personsMap))
        return { items, validation, isFallback: false }
      }
    }

    // Si responde 200 pero vacío, o código no válido, aplicamos fallback ordenado
    const fallbackItems = MOCK_RESERVAS_DATA.map((dto) => transformReservaDto(dto, roomsMap, personsMap))
    return { items: fallbackItems, validation, isFallback: true }
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status ?? 0 : 0
    const validation = validateStatusCode(status)
    const fallbackItems = MOCK_RESERVAS_DATA.map((dto) => transformReservaDto(dto, roomsMap, personsMap))
    return { items: fallbackItems, validation, isFallback: true }
  }
}
