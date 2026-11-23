import { isAxiosError } from 'axios'
import { api } from '../../../lib/api'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import type {
  RoomTariffPayload,
  RoomTariffRepository,
} from '../domain/room-tariff'

export class ApiRoomTariffRepository implements RoomTariffRepository {
  async assignTariff(payload: RoomTariffPayload): Promise<{
    ok: boolean
    status: number
    data?: unknown
    error?: unknown
  }> {
    try {
      const response = await executeBalancedRequest(
        () =>
          api.post('/room_tariff', payload, {
            headers: {
              'Content-Type': 'application/json',
            },
            validateStatus: () => true,
          }),
        { maxRetries: 2 }
      )

      const validation = validateStatusCode(response.status)

      return {
        ok: validation.isValid,
        status: response.status,
        data: response.data,
      }
    } catch (error) {
      const status = isAxiosError(error) ? (error.response?.status ?? 0) : 0
      validateStatusCode(status)
      return {
        ok: false,
        status,
        error,
      }
    }
  }
}
