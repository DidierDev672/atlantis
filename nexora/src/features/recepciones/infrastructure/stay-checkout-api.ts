import axios from 'axios'
import { api } from '../../../lib/api'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import {
  dispatchPipelinedEndpoints,
  executeBalancedRequest,
} from '../../reservas/infrastructure/api-load-balancer'
import type { StayReceptionDto } from '../domain/folio-payload'
import type { CobroPaymentMethod } from '../domain/salida-cobro'
import {
  getUniquePersonIdsFromRecord,
  resolvePersonId,
  type PersonApiDto,
  type SalidaHuespedItem,
} from '../domain/salida-huesped'
import {
  buildCheckoutPlanetAlert,
  buildStayCheckoutPayload,
  type StayCheckoutResult,
} from '../domain/stay-checkout'
import { detectarRecursosDispositivoRecepciones } from './recepciones-resource-detector'
import { fetchServiceRequestsByPersonId } from './service-requests-api'

export interface SubmitStayCheckoutParams {
  guest: SalidaHuespedItem
  amount: number
  paymentMethod: CobroPaymentMethod
  keysReturned: boolean
  hasDamages: boolean
  comments: string
}

function extractStayRecord(data: unknown): StayReceptionDto | null {
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

function extractStayPersonIds(data: unknown): string[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? ((data as Record<string, unknown>).persons ??
        (data as Record<string, unknown>).data ??
        (data as Record<string, unknown>).items ??
        [data])
      : []

  if (!Array.isArray(list)) return []
  return list
    .map((entry) =>
      typeof entry === 'string'
        ? entry.trim()
        : resolvePersonId((entry ?? {}) as PersonApiDto)
    )
    .filter(Boolean)
}

/**
 * Construye en segundo plano el payload completo de check-out y lo envía a
 * `POST /stay/{stay_id}/checkout` con balanceo de carga (`api-load-balancer.ts`)
 * y validación psicológica de estado HTTP (`status-code-validator.ts`).
 */
export async function submitStayCheckout(
  params: SubmitStayCheckoutParams
): Promise<StayCheckoutResult> {
  const { guest } = params

  try {
    const { maxRetries } = detectarRecursosDispositivoRecepciones().policy
    const safeRetries = Math.min(2, maxRetries)

    let stayId = (guest.primaryStayId || guest.stayId || '').trim()
    let roomId = (guest.primaryRoomId || guest.roomId || '').trim()
    const personIdsSet = new Set<string>()

    if (guest.personId?.trim()) personIdsSet.add(guest.personId.trim())
    if (Array.isArray(guest.stayPersonIds)) {
      for (const pid of guest.stayPersonIds) {
        if (pid?.trim()) personIdsSet.add(pid.trim())
      }
    }

    const resolveServiceRequestId = async (): Promise<string> => {
      const existingOrderId = guest.serviceRequestOrders?.[0]?.id?.trim()
      if (existingOrderId) return existingOrderId
      if (!guest.personId?.trim()) return ''
      try {
        const sr = await fetchServiceRequestsByPersonId(guest.personId)
        return sr.orders[0]?.id?.trim() ?? ''
      } catch {
        return ''
      }
    }

    const executeCheckoutWithStay = async (
      stayRes: { status: number; data: unknown } | null
    ): Promise<StayCheckoutResult> => {
      if (stayRes && validateStatusCode(stayRes.status).isValid) {
        const stayDto = extractStayRecord(stayRes.data)
        if (stayDto) {
          if (!stayId && stayDto.id?.trim()) stayId = stayDto.id.trim()
          if (!roomId && stayDto.room_id?.trim()) {
            roomId = stayDto.room_id.trim()
          }
          for (const pid of getUniquePersonIdsFromRecord(stayDto)) {
            personIdsSet.add(pid)
          }
        }
      }

      if (!stayId) {
        const validation = validateStatusCode(404)
        return {
          ok: false,
          status: 404,
          validation,
          alertProps: {
            variant: 'warning',
            planet: 'jupiter',
            title: 'Estadía por confirmar',
            message: `No encontramos una estadía activa vinculada para ${guest.name}. Verifica su recepción asignada e intenta nuevamente; tus datos siguen intactos.`,
          },
        }
      }

      const [resolvedServiceReqId, stayPersonsRes] = await Promise.all([
        resolveServiceRequestId(),
        personIdsSet.size <= 1
          ? executeBalancedRequest(
              () =>
                api.get<unknown>(
                  `/stays_person/${encodeURIComponent(stayId)}`,
                  { validateStatus: () => true }
                ),
              { maxRetries: 1 }
            ).catch(() => null)
          : Promise.resolve(null),
      ])

      if (stayPersonsRes && validateStatusCode(stayPersonsRes.status).isValid) {
        for (const pid of extractStayPersonIds(stayPersonsRes.data)) {
          personIdsSet.add(pid)
        }
      }

      const payload = buildStayCheckoutPayload({
        stayId,
        roomId,
        personIds: Array.from(personIdsSet),
        serviceRequestId: resolvedServiceReqId,
        paymentMethod: params.paymentMethod,
        amount: params.amount,
        keysReturned: params.keysReturned,
        hasDamages: params.hasDamages,
        comments: params.comments,
      })

      const checkoutRes = await executeBalancedRequest(
        () =>
          api.post<unknown>(
            `/stay/${encodeURIComponent(stayId)}/checkout`,
            payload,
            { validateStatus: () => true }
          ),
        { maxRetries: safeRetries }
      )

      const validation = validateStatusCode(checkoutRes.status)
      return {
        ok: validation.isValid,
        status: checkoutRes.status,
        payload,
        validation,
        alertProps: buildCheckoutPlanetAlert({
          guest,
          validation,
          responseData: checkoutRes.data,
        }),
      }
    }

    if (!stayId && roomId) {
      const pipelined = await dispatchPipelinedEndpoints(
        () =>
          api.get<unknown>(
            `/stay/reception/${encodeURIComponent(roomId)}`,
            { validateStatus: () => true }
          ),
        (stayRes) =>
          executeCheckoutWithStay(
            stayRes as { status: number; data: unknown }
          ),
        { maxRetries: safeRetries }
      )
      return pipelined.second
    }

    return await executeCheckoutWithStay(null)
  } catch (error) {
    console.error('[submitStayCheckout] Error en POST /stay/{stay_id}/checkout:', error)
    const status = axios.isAxiosError(error)
      ? (error.response?.status ?? 500)
      : 500
    const validation = validateStatusCode(status)
    return {
      ok: false,
      status,
      validation,
      alertProps: buildCheckoutPlanetAlert({
        guest,
        validation,
        responseData: axios.isAxiosError(error) ? error.response?.data : undefined,
      }),
    }
  }
}
