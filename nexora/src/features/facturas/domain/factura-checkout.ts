import { formatCurrencyAmount } from '../../recepciones/domain/salida-huesped'

export interface CheckoutInvoiceDto {
  id: string
  id_stay: string
  id_room: string
  id_person: string[]
  id_service_request?: string | null
  payment_deposits: string
  amount: number
  condition_room: string
  comments: string
  created_by: string
  created_at: string
  updated_at: string
}

export type FacturaConditionTone = 'success' | 'warning' | 'danger'
export type FacturaFilterOption = 'todas' | 'buen_estado' | 'novedades'

export interface CheckoutInvoiceItem {
  id: string
  receiptCode: string
  stayId: string
  roomId: string
  roomNumberDisplay: string
  roomLabel: string
  roomFloor: string
  personIds: string[]
  guestNames: string[]
  serviceRequestId: string
  paymentRaw: string
  paymentLabel: string
  amount: number
  amountFormatted: string
  conditionRaw: string
  conditionLabel: string
  conditionTone: FacturaConditionTone
  comments: string
  createdBy: string
  checkInRaw: string
  checkInFormatted: string
  checkOutRaw: string
  checkOutFormatted: string
  nightsCount: number
  nightsLabel: string
  createdAtRaw: string
  createdAtFormatted: string
  updatedAtRaw: string
  updatedAtFormatted: string
}

export function translatePaymentDeposit(raw?: string | null): string {
  const clean = (raw ?? '').trim()
  if (!clean) return 'No especificado'
  const norm = clean.toLowerCase()
  switch (norm) {
    case 'debit card':
    case 'debit_card':
    case 'tarjeta debito':
    case 'tarjeta débito':
      return 'Tarjeta débito'
    case 'credit card':
    case 'credit_card':
    case 'tarjeta credito':
    case 'tarjeta crédito':
      return 'Tarjeta crédito'
    case 'card':
    case 'tarjeta':
      return 'Tarjeta'
    case 'cash':
    case 'efectivo':
      return 'Efectivo'
    case 'transfer':
    case 'bank_transfer':
    case 'transferencia':
      return 'Transferencia'
    case 'nequi':
      return 'Nequi'
    default:
      return clean
  }
}

export function translateConditionRoom(raw?: string | null): {
  label: string
  tone: FacturaConditionTone
} {
  const norm = (raw ?? '').trim().toLowerCase()
  switch (norm) {
    case 'keys_returned_good_condition':
      return {
        label: 'Llaves devueltas · Sin daños',
        tone: 'success',
      }
    case 'keys_pending':
      return {
        label: 'Llaves pendientes · Sin daños',
        tone: 'warning',
      }
    case 'damaged_keys_returned':
      return {
        label: 'Llaves devueltas · Con daños',
        tone: 'danger',
      }
    case 'damaged_keys_pending':
      return {
        label: 'Llaves pendientes · Con daños',
        tone: 'danger',
      }
    default:
      return {
        label: raw?.trim()
          ? raw.replace(/_/g, ' ')
          : 'Entrega registrada',
        tone: 'warning',
      }
  }
}

export function formatInvoiceDateTime(raw?: string | null): string {
  if (!raw) return 'Fecha no registrada'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed)
}

export function formatInvoiceShortDate(raw?: string | null): string {
  if (!raw) return 'Por confirmar'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

export function computeStayNights(
  checkIn?: string | null,
  checkOut?: string | null
): { nightsCount: number; nightsLabel: string } {
  if (!checkIn || !checkOut) {
    return { nightsCount: 1, nightsLabel: '1 noche' }
  }
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { nightsCount: 1, nightsLabel: '1 noche' }
  }
  const diffMs = Math.max(0, end.getTime() - start.getTime())
  const nights = Math.max(1, Math.round(diffMs / 86_400_000))
  return {
    nightsCount: nights,
    nightsLabel: `${nights} ${nights === 1 ? 'noche' : 'noches'}`,
  }
}

export function formatRoomFloorLabel(floor: unknown): string {
  if (typeof floor === 'number' && Number.isFinite(floor)) {
    return `Piso ${floor}`
  }
  if (typeof floor === 'string' && floor.trim()) {
    const clean = floor.trim()
    return /^piso\s+/i.test(clean) ? clean : `Piso ${clean}`
  }
  return ''
}

export function buildReceiptCode(id?: string | null): string {
  const clean = (id ?? '').trim()
  if (!clean) return 'FAC-SINREF'
  return `#${clean.slice(0, 8).toUpperCase()}`
}

export function mapCheckoutDtoToItem(
  dto: CheckoutInvoiceDto,
  resolved?: {
    roomNumberDisplay?: string
    roomLabel?: string
    roomFloor?: string
    guestNames?: string[]
    checkInDate?: string
    checkOutDate?: string
  }
): CheckoutInvoiceItem {
  const condition = translateConditionRoom(dto.condition_room)
  const personIds = Array.isArray(dto.id_person)
    ? dto.id_person.map((p) => String(p ?? '').trim()).filter(Boolean)
    : []
  const amount = Number.isFinite(Number(dto.amount)) ? Number(dto.amount) : 0

  const checkInRaw = (resolved?.checkInDate ?? '').trim()
  const checkOutRaw = (resolved?.checkOutDate || dto.created_at || '').trim()
  const nightsInfo = computeStayNights(checkInRaw, checkOutRaw)

  return {
    id: dto.id,
    receiptCode: buildReceiptCode(dto.id),
    stayId: (dto.id_stay ?? '').trim(),
    roomId: (dto.id_room ?? '').trim(),
    roomNumberDisplay: resolved?.roomNumberDisplay || '—',
    roomLabel: resolved?.roomLabel || 'Habitación asignada',
    roomFloor: resolved?.roomFloor || '',
    personIds,
    guestNames:
      resolved?.guestNames && resolved.guestNames.length > 0
        ? resolved.guestNames
        : personIds.length > 0
          ? ['Huésped registrado']
          : ['Huésped sin registro'],
    serviceRequestId: (dto.id_service_request ?? '').trim(),
    paymentRaw: (dto.payment_deposits ?? '').trim(),
    paymentLabel: translatePaymentDeposit(dto.payment_deposits),
    amount,
    amountFormatted: formatCurrencyAmount(amount, 'COP'),
    conditionRaw: (dto.condition_room ?? '').trim(),
    conditionLabel: condition.label,
    conditionTone: condition.tone,
    comments: (dto.comments ?? '').trim() || 'Sin observaciones adicionales',
    createdBy: (dto.created_by ?? '').trim() || 'Recepción',
    checkInRaw,
    checkInFormatted: formatInvoiceShortDate(checkInRaw),
    checkOutRaw,
    checkOutFormatted: formatInvoiceShortDate(checkOutRaw),
    nightsCount: nightsInfo.nightsCount,
    nightsLabel: nightsInfo.nightsLabel,
    createdAtRaw: dto.created_at ?? '',
    createdAtFormatted: formatInvoiceDateTime(dto.created_at),
    updatedAtRaw: dto.updated_at ?? '',
    updatedAtFormatted: formatInvoiceDateTime(dto.updated_at),
  }
}
