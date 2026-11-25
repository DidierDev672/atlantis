import { readAuthTokenEmail } from '../../../shared/auth-storage'
import type { CobroPaymentMethod } from './salida-cobro'
import type {
  GuestServiceRequestOrderSummary,
  SalidaHuespedItem,
} from './salida-huesped'

export interface StayReceptionDto {
  id?: string
  room_id?: string
  reservation_id?: string
  person_ids?: string[]
  person_id?: string
  check_in_date?: string
  check_out_date?: string
  payment_method?: string
  security_deposit?: number | string
  remarks?: string
  status?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface FolioChargeItem {
  id: string
  folio_id: string
  type: 'lodging' | 'room_service'
  source_type: 'stay' | 'service_request'
  source_id: string
  description: string
  subtotal: number
  taxes: number
  total: number
  void_reason?: string
  posted_at: string
  voided_at?: string | null
  created_by: string
}

export interface FolioPaymentItem {
  id: string
  folio_id: string
  paid_by: string
  kind: 'advance' | 'payment'
  method: 'card' | 'cash' | 'transfer' | 'nequi'
  amount: number
  reference: string
  idempotency_key: string
  received_by: string
  created_at: string
}

export interface FolioCreatePayload {
  id: string
  reserve_id?: string
  stay_id?: string
  payer_id: string
  currency: string
  status: 'open' | 'closed'
  total_charges: number
  total_net_paid: number
  balance: number
  charges: FolioChargeItem[]
  payments: FolioPaymentItem[]
  created_by: string
  created_at: string
  updated_at: string
}

export function generateClientHexId(length = 16): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, length)
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.slice(
    0,
    length
  )
}

export function mapCobroMethodToBackend(
  method: CobroPaymentMethod
): FolioPaymentItem['method'] {
  switch (method) {
    case 'efectivo':
      return 'cash'
    case 'transferencia':
      return 'transfer'
    case 'nequi':
      return 'nequi'
    case 'tarjeta':
    default:
      return 'card'
  }
}

export interface BuildFolioPayloadParams {
  guest: SalidaHuespedItem
  roomNumber: string
  stayId?: string
  reserveId?: string
  payerId: string
  currency?: string
  accommodationAmount: number
  roomServiceAmount: number
  paidAmount: number
  method: CobroPaymentMethod
  reference?: string
  orders?: ReadonlyArray<GuestServiceRequestOrderSummary>
}

/**
 * Construye el payload completo requerido por POST /folios
 * incluyendo cargos de alojamiento, órdenes de servicio a la habitación y pago registrado.
 */
export function buildFolioCreatePayload(
  params: BuildFolioPayloadParams
): FolioCreatePayload {
  const folioId = generateClientHexId(16)
  const nowIso = new Date().toISOString()
  const rawEmail = readAuthTokenEmail()
  const createdBy =
    rawEmail && rawEmail !== 'user_system' ? rawEmail : 'reception@nexora.com'

  const staySourceId =
    params.stayId?.trim() || params.reserveId?.trim() || folioId
  const charges: FolioChargeItem[] = []

  if (params.accommodationAmount > 0 || Boolean(params.stayId)) {
    const lodgingAmount = Math.max(0, Math.round(params.accommodationAmount))
    charges.push({
      id: `chg-${generateClientHexId(6)}`,
      folio_id: folioId,
      type: 'lodging',
      source_type: 'stay',
      source_id: staySourceId,
      description: `Alojamiento habitación ${params.roomNumber}`,
      subtotal: lodgingAmount,
      taxes: 0,
      total: lodgingAmount,
      posted_at: nowIso,
      created_by: createdBy,
    })
  }

  const orderList = params.orders ?? params.guest.serviceRequestOrders ?? []
  if (orderList.length > 0) {
    orderList.forEach((order) => {
      const orderTotal = Math.max(0, Math.round(order.total))
      const orderTaxes = Math.max(0, Math.round(order.taxes))
      const orderSubtotal = Math.max(
        0,
        Math.round(order.subtotal || orderTotal - orderTaxes)
      )
      charges.push({
        id: `chg-${generateClientHexId(6)}`,
        folio_id: folioId,
        type: 'room_service',
        source_type: 'service_request',
        source_id: order.id,
        description: order.orderNumber
          ? `Room Service Order #${order.orderNumber}`
          : 'Room Service Order',
        subtotal: orderSubtotal,
        taxes: orderTaxes,
        total: orderTotal,
        void_reason: '',
        posted_at: order.createdAt || nowIso,
        voided_at: null,
        created_by: createdBy,
      })
    })
  } else if (params.roomServiceAmount > 0) {
    const srTotal = Math.max(0, Math.round(params.roomServiceAmount))
    charges.push({
      id: `chg-${generateClientHexId(6)}`,
      folio_id: folioId,
      type: 'room_service',
      source_type: 'service_request',
      source_id: params.guest.personId || staySourceId,
      description: 'Room Service consumido',
      subtotal: srTotal,
      taxes: 0,
      total: srTotal,
      void_reason: '',
      posted_at: nowIso,
      voided_at: null,
      created_by: createdBy,
    })
  }

  const totalCharges = charges.reduce((acc, ch) => acc + ch.total, 0)
  const paidAmount = Math.max(0, Math.round(params.paidAmount))
  const backendMethod = mapCobroMethodToBackend(params.method)
  const reference =
    params.reference?.trim() ||
    `${backendMethod.toUpperCase()}-AUTH-${generateClientHexId(4).toUpperCase()}`

  const payments: FolioPaymentItem[] = [
    {
      id: `pay-${generateClientHexId(6)}`,
      folio_id: folioId,
      paid_by: params.payerId,
      kind: paidAmount < totalCharges ? 'advance' : 'payment',
      method: backendMethod,
      amount: paidAmount,
      reference,
      idempotency_key: `idem-${generateClientHexId(8)}`,
      received_by: createdBy,
      created_at: nowIso,
    },
  ]

  const balance = Math.max(0, totalCharges - paidAmount)

  return {
    id: folioId,
    ...(params.reserveId?.trim() ? { reserve_id: params.reserveId.trim() } : {}),
    ...(params.stayId?.trim() ? { stay_id: params.stayId.trim() } : {}),
    payer_id: params.payerId,
    currency: params.currency?.trim() || 'COP',
    status: 'open',
    total_charges: totalCharges,
    total_net_paid: paidAmount,
    balance,
    charges,
    payments,
    created_by: createdBy,
    created_at: nowIso,
    updated_at: nowIso,
  }
}
