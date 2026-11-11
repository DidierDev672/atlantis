import axios from 'axios'
import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import type { ItemMenuProducto } from '../domain/item-menu'

export interface ProductosMenuResponse {
  productos: ItemMenuProducto[]
  feedback: StatusCodeValidationResult
}

/**
 * Consulta balanceada del endpoint GET /item-menu con validación de status code.
 */
export async function requestProductosMenu(): Promise<ProductosMenuResponse> {
  try {
    const response = await executeBalancedRequest(() =>
      api.get('/item-menu', {
        skipAuth: true,
        validateStatus: () => true,
      })
    )

    const validation = validateStatusCode(response.status)
    if (!validation.isValid) {
      return { productos: [], feedback: validation }
    }

    const rawData = response.data
    let lista: ItemMenuProducto[] = []

    if (Array.isArray(rawData)) {
      lista = rawData as ItemMenuProducto[]
    } else if (
      rawData &&
      typeof rawData === 'object' &&
      Array.isArray((rawData as { data?: unknown }).data)
    ) {
      lista = (rawData as { data: ItemMenuProducto[] }).data
    }

    return { productos: lista, feedback: validation }
  } catch (err: unknown) {
    let status = 500
    if (axios.isAxiosError(err) && err.response?.status) {
      status = err.response.status
    } else if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      status = 408
    }
    return { productos: [], feedback: validateStatusCode(status) }
  }
}

