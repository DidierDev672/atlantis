import { readAuthTokenEmail } from '../../../shared/auth-storage'
import type { PlanetAlertProps } from '../../../shared/alert'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import { generateClientHexId } from './folio-payload'
import {
  COBRO_PAYMENT_METHOD_OPTIONS,
  type CobroPaymentMethod,
} from './salida-cobro'
import type { SalidaHuespedItem } from './salida-huesped'

export type CheckoutRoomCondition =
  | 'keys_returned_good_condition'
  | 'keys_pending'
  | 'damaged_keys_returned'
  | 'damaged_keys_pending'

export interface StayCheckoutPayload {
  id: string
  id_stay: string
  id_room: string
  id_person: string[]
  id_service_request: string
  payment_deposits: string
  amount: number
  condition_room: CheckoutRoomCondition
  comments: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface StayCheckoutResult {
  ok: boolean
  status: number
  payload?: StayCheckoutPayload
  validation: StatusCodeValidationResult
  alertProps: PlanetAlertProps
}

export function resolveRoomConditionCode(
  keysReturned: boolean,
  hasDamages: boolean
): CheckoutRoomCondition {
  if (hasDamages) {
    return keysReturned ? 'damaged_keys_returned' : 'damaged_keys_pending'
  }
  return keysReturned ? 'keys_returned_good_condition' : 'keys_pending'
}

export function resolvePaymentDepositsLabel(
  method: CobroPaymentMethod
): string {
  return (
    COBRO_PAYMENT_METHOD_OPTIONS.find((opt) => opt.id === method)?.label ??
    'Tarjeta'
  )
}

export function buildStayCheckoutPayload(params: {
  stayId: string
  roomId: string
  personIds: string[]
  serviceRequestId: string
  paymentMethod: CobroPaymentMethod
  amount: number
  keysReturned: boolean
  hasDamages: boolean
  comments: string
}): StayCheckoutPayload {
  const nowIso = new Date().toISOString()
  const trimmedComments = params.comments.trim()
  const fallbackComment = params.hasDamages
    ? 'Se reportan novedades o daños en la habitación.'
    : params.keysReturned
      ? 'Habitación entregada en buen estado'
      : 'Check-out registrado sin observaciones adicionales'

  return {
    id: generateClientHexId(16),
    id_stay: params.stayId,
    id_room: params.roomId,
    id_person: params.personIds,
    id_service_request: params.serviceRequestId,
    payment_deposits: resolvePaymentDepositsLabel(params.paymentMethod),
    amount: Math.max(0, Math.round(params.amount)),
    condition_room: resolveRoomConditionCode(
      params.keysReturned,
      params.hasDamages
    ),
    comments: trimmedComments || fallbackComment,
    created_by: readAuthTokenEmail(),
    created_at: nowIso,
    updated_at: nowIso,
  }
}

function extractFriendlyServerMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  const raw = record.message ?? record.error ?? record.detail
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null
}

/**
 * Construye las props de `PlanetAlert` aplicando psicología del usuario:
 * mensajes tranquilizadores, claros y sin culpar al recepcionista.
 */
export function buildCheckoutPlanetAlert(params: {
  guest: SalidaHuespedItem
  validation: StatusCodeValidationResult
  responseData?: unknown
}): PlanetAlertProps {
  const { guest, validation, responseData } = params
  const roomTag = guest.roomNumber ? ` (${guest.roomNumber})` : ''

  if (validation.isValid) {
    return {
      variant: validation.variant,
      planet: validation.planet,
      title: validation.title ?? '¡Check-out completado!',
      message:
        validation.message ??
        `Todo salió muy bien. La cuenta de ${guest.name}${roomTag} quedó liquidada y su salida fue registrada con éxito.`,
    }
  }

  const serverDetail = extractFriendlyServerMessage(responseData)
  const baseMessage =
    validation.message ??
    'Tus datos están a salvo. No pudimos completar el check-out en este momento; revisa la información e inténtalo de nuevo.'

  return {
    variant: validation.variant,
    planet: validation.planet,
    title: validation.title ?? 'Revisión de check-out',
    message: serverDetail ? `${baseMessage} (${serverDetail})` : baseMessage,
    error: responseData,
  }
}
