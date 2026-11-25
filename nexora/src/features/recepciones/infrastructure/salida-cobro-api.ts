import axios from 'axios'
import { api } from '../../../lib/api'
import { catalogApi } from '../../../shared/catalog'
import { BoundedTtlCache } from '../../../shared/lib/bounded-ttl-cache'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import {
  dispatchPipelinedEndpoints,
  executeBalancedRequest,
} from '../../reservas/infrastructure/api-load-balancer'
import {
  buildFolioCreatePayload,
  type StayReceptionDto,
} from '../domain/folio-payload'
import {
  COBRO_PAYMENT_METHOD_OPTIONS,
  formatRoomStatusBadge,
  type CobroPaymentMethod,
  type CobroPaymentSubmissionResult,
  type CobroRoomDetails,
} from '../domain/salida-cobro'
import type { SalidaHuespedItem } from '../domain/salida-huesped'
import { detectarRecursosDispositivoRecepciones } from './recepciones-resource-detector'

const roomCobroCache = new BoundedTtlCache<string, CobroRoomDetails>(
  100,
  3 * 60 * 1000
)

function extractStayReceptionRecord(data: unknown): StayReceptionDto | null {
  if (!data) return null
  if (Array.isArray(data)) return (data[0] as StayReceptionDto) ?? null
  if (typeof data === 'object') {
    const obj = data as { data?: StayReceptionDto | StayReceptionDto[] }
    if (obj.data !== undefined) {
      return Array.isArray(obj.data) ? (obj.data[0] ?? null) : obj.data
    }
    return data as StayReceptionDto
  }
  return null
}

function extractFirstPersonId(data: unknown): string {
  const list: Array<{ id?: string; person_id?: string }> = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? ((data as { data?: Array<{ id?: string; person_id?: string }> })
          .data ?? [data as { id?: string; person_id?: string }])
      : []
  for (const item of list) {
    const pid = item?.id?.trim() || item?.person_id?.trim()
    if (pid) return pid
  }
  return ''
}

/**
 * Resuelve perezosamente el número, estado y tarifa base de la habitación
 * asociada al huésped usando el catálogo compartido.
 */
export async function fetchCobroRoomDetails(
  roomId?: string
): Promise<CobroRoomDetails> {
  const cleanId = roomId?.trim() || ''
  if (!cleanId) {
    const statusInfo = formatRoomStatusBadge('occupied')
    return {
      roomId: '',
      roomNumber: 'Por asignar',
      roomStatusRaw: 'occupied',
      roomStatusLabel: statusInfo.label,
      roomStatusToneClass: statusInfo.toneClass,
      nightlyRate: 0,
    }
  }

  const cached = roomCobroCache.get(cleanId)
  if (cached) return cached

  try {
    const roomRes = await catalogApi.getRoom(cleanId)
    const room = roomRes.data
    let nightlyRate =
      room && typeof room.price_override === 'number' && room.price_override > 0
        ? room.price_override
        : 0

    if (nightlyRate === 0 && room?.room_types_id) {
      try {
        const typeRes = await catalogApi.getRoomType(room.room_types_id)
        if (typeRes.data && typeof typeRes.data.base_price === 'number') {
          nightlyRate = typeRes.data.base_price
        }
      } catch {
        // Mantiene 0 si no es posible consultar tarifa del tipo de habitación
      }
    }

    const rawStatus = room?.status || 'occupied'
    const statusInfo = formatRoomStatusBadge(rawStatus)
    const resolved: CobroRoomDetails = {
      roomId: cleanId,
      roomNumber: room?.number ? String(room.number) : cleanId.slice(0, 4),
      roomStatusRaw: rawStatus,
      roomStatusLabel: statusInfo.label,
      roomStatusToneClass: statusInfo.toneClass,
      nightlyRate,
    }
    roomCobroCache.set(cleanId, resolved)
    return resolved
  } catch (err) {
    console.warn('[fetchCobroRoomDetails] Error al consultar habitación:', err)
    const statusInfo = formatRoomStatusBadge('occupied')
    return {
      roomId: cleanId,
      roomNumber: cleanId.slice(0, 4),
      roomStatusRaw: 'occupied',
      roomStatusLabel: statusInfo.label,
      roomStatusToneClass: statusInfo.toneClass,
      nightlyRate: 0,
    }
  }
}

export interface SubmitCobroFolioParams {
  guest: SalidaHuespedItem
  roomId?: string
  roomNumber: string
  accommodationAmount: number
  roomServiceAmount: number
  paidAmount: number
  method: CobroPaymentMethod
}

/**
 * Consulta la recepción activa (`GET /stay/reception/{room_id}`), construye el payload
 * del Folio con llaves de vinculación y lo registra en `POST /folios`
 * con balanceo de carga (`api-load-balancer.ts`) y validación (`status-code-validator.ts`).
 */
export async function submitCobroSalidaPago(
  params: SubmitCobroFolioParams
): Promise<CobroPaymentSubmissionResult> {
  const methodMeta = COBRO_PAYMENT_METHOD_OPTIONS.find(
    (opt) => opt.id === params.method
  )
  const methodLabel = methodMeta?.label ?? 'Tarjeta'

  try {
    const { maxRetries } = detectarRecursosDispositivoRecepciones().policy
    const safeRetries = Math.min(1, maxRetries)
    const cleanRoomId =
      params.roomId?.trim() || params.guest.primaryRoomId?.trim() || ''

    const resolveKeysAndPostFolio = async (
      stayRes: { status: number; data: unknown } | null
    ): Promise<{
      stayValidation: StatusCodeValidationResult | null
      folioStatus: number
      folioData: unknown
    }> => {
      let stayValidation: StatusCodeValidationResult | null = null
      let stayDto: StayReceptionDto | null = null

      if (stayRes) {
        stayValidation = validateStatusCode(stayRes.status)
        if (stayValidation.isValid) {
          stayDto = extractStayReceptionRecord(stayRes.data)
        }
      }

      const stayId = stayDto?.id?.trim() || params.guest.primaryStayId?.trim() || ''
      const reserveId =
        stayDto?.reservation_id?.trim() ||
        params.guest.primaryReserveId?.trim() ||
        ''

      let payerId =
        stayDto?.person_ids?.[0]?.trim() ||
        stayDto?.person_id?.trim() ||
        params.guest.personId?.trim() ||
        ''

      if (!payerId && stayId) {
        try {
          const spRes = await executeBalancedRequest(
            () =>
              api.get<unknown>(
                `/stays_person/${encodeURIComponent(stayId)}`,
                { validateStatus: () => true }
              ),
            { maxRetries: safeRetries }
          )
          if (validateStatusCode(spRes.status).isValid) {
            payerId = extractFirstPersonId(spRes.data)
          }
        } catch {
          // Respaldo con personId ya conocido si falla /stays_person
        }
      }

      if (!stayId && !reserveId) {
        return {
          stayValidation: stayValidation ?? validateStatusCode(404),
          folioStatus: stayValidation?.status ?? 404,
          folioData: {
            message:
              'No encontramos un identificador activo de estadía (stay_id) ni de reserva (reserve_id) para abrir el folio.',
          },
        }
      }

      if (!payerId) {
        return {
          stayValidation: validateStatusCode(400),
          folioStatus: 400,
          folioData: {
            message:
              'No fue posible identificar al huésped titular responsable de la cuenta (payer_id).',
          },
        }
      }

      const payload = buildFolioCreatePayload({
        guest: params.guest,
        roomNumber: params.roomNumber,
        stayId: stayId || undefined,
        reserveId: reserveId || undefined,
        payerId,
        currency: 'COP',
        accommodationAmount: params.accommodationAmount,
        roomServiceAmount: params.roomServiceAmount,
        paidAmount: params.paidAmount,
        method: params.method,
      })

      const folioRes = await executeBalancedRequest(
        () =>
          api.post<unknown>('/folios', payload, {
            validateStatus: () => true,
          }),
        { maxRetries: safeRetries }
      )

      return {
        stayValidation,
        folioStatus: folioRes.status,
        folioData: { response: folioRes.data, payloadId: payload.id },
      }
    }

    const pipelineResult = cleanRoomId
      ? (
          await dispatchPipelinedEndpoints(
            () =>
              api.get<{ status: number; data: unknown } | unknown>(
                `/stay/reception/${encodeURIComponent(cleanRoomId)}`,
                { validateStatus: () => true }
              ),
            (stayRes) =>
              resolveKeysAndPostFolio(
                stayRes as { status: number; data: unknown }
              ),
            { maxRetries: safeRetries }
          )
        ).second
      : await resolveKeysAndPostFolio(null)

    const folioValidation = validateStatusCode(pipelineResult.folioStatus)

    if (!folioValidation.isValid) {
      const rawData = pipelineResult.folioData as
        | { message?: string; response?: { message?: string; error?: string } }
        | undefined
      const serverMsg =
        rawData?.response?.message ||
        rawData?.response?.error ||
        rawData?.message ||
        folioValidation.message ||
        'No fue posible registrar el folio de cobro.'

      return {
        ok: false,
        receiptCode: '',
        paidAmount: 0,
        method: params.method,
        methodLabel,
        message: serverMsg,
        validation: folioValidation,
      }
    }

    const wrapped = pipelineResult.folioData as {
      response?: { id?: string }
      payloadId?: string
    }
    const folioId = wrapped?.response?.id || wrapped?.payloadId || ''
    const receiptCode = folioId
      ? folioId.slice(0, 8).toUpperCase()
      : `PAG-${Date.now().toString(36).toUpperCase().slice(-6)}`

    return {
      ok: true,
      receiptCode,
      folioId,
      paidAmount: params.paidAmount,
      method: params.method,
      methodLabel,
      message: `Folio y pago de ${params.guest.name} (Hab. ${params.roomNumber}) registrados vía ${methodLabel}.`,
      validation: folioValidation,
    }
  } catch (err) {
    console.error('[submitCobroSalidaPago] Error al registrar folio:', err)
    const status = axios.isAxiosError(err)
      ? (err.response?.status ?? 500)
      : 500
    const validation = validateStatusCode(status)
    return {
      ok: false,
      receiptCode: '',
      paidAmount: 0,
      method: params.method,
      methodLabel,
      message:
        validation.message ||
        'No fue posible registrar el pago en este instante. Tus datos están seguros; intenta nuevamente.',
      validation,
    }
  }
}
