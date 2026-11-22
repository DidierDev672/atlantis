import axios from 'axios'
import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import type { ItemMenuProducto } from '../domain/item-menu'
import {
  getCatalogoProductosCache,
  getMenuCategoriasCache,
  setCatalogoProductosCache,
} from './catalogo-productos-cache'
import { detectarPerfilRedDisponible } from './network-quality'

export interface ProductosMenuResponse {
  productos: ItemMenuProducto[]
  feedback: StatusCodeValidationResult
}

export interface UpdateProductoPayload {
  category_id: string
  name: string
  description: string
  price: number
  tax_percentage: number
  prep_time: number
  isVegetarian: boolean
  isVegan: boolean
  imageURL: string
  start_time: string
  end_time: string
  available: boolean
  created_by?: string
}

export interface UpdateProductoMenuResponse {
  ok: boolean
  producto?: ItemMenuProducto
  validation: StatusCodeValidationResult
  rawError?: unknown
}

function extractItemMenuList(rawData: unknown): ItemMenuProducto[] {
  if (Array.isArray(rawData)) {
    return rawData as ItemMenuProducto[]
  }

  if (!rawData || typeof rawData !== 'object') {
    return []
  }

  const obj = rawData as Record<string, unknown>
  for (const key of ['data', 'items', 'results', 'products']) {
    const candidate = obj[key]
    if (Array.isArray(candidate)) {
      return candidate as ItemMenuProducto[]
    }
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>
      for (const nestedKey of ['items', 'results', 'products', 'data']) {
        if (Array.isArray(nested[nestedKey])) {
          return nested[nestedKey] as ItemMenuProducto[]
        }
      }
    }
  }

  return []
}

let inFlightProductosRequest: Promise<ProductosMenuResponse> | null = null

/**
 * Consulta balanceada y deduplicada del endpoint GET /item-menu con validación de status code
 * y caché compartida en memoria.
 */
export async function requestProductosMenu(
  options?: { forceRefresh?: boolean }
): Promise<ProductosMenuResponse> {
  if (!options?.forceRefresh) {
    const cached = getCatalogoProductosCache()
    if (cached && cached.productos.length > 0) {
      return {
        productos: cached.productos,
        feedback: cached.feedback ?? validateStatusCode(200),
      }
    }
    if (!detectarPerfilRedDisponible().online) {
      return {
        productos: cached?.productos ?? [],
        feedback: validateStatusCode(503),
      }
    }
    if (inFlightProductosRequest) {
      return inFlightProductosRequest
    }
  }

  const req = (async (): Promise<ProductosMenuResponse> => {
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

      const lista = extractItemMenuList(response.data)
      if (lista.length > 0) {
        const catsCached = getMenuCategoriasCache()
        setCatalogoProductosCache({
          productos: lista,
          categorias: catsCached?.categorias ?? [],
          feedback: validation,
        })
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
    } finally {
      inFlightProductosRequest = null
    }
  })()

  inFlightProductosRequest = req
  return req
}

/**
 * Actualiza las características de un producto en `PUT /item-menu/{id}`
 * (con respaldo `PATCH` si el servidor responde 405) usando balanceo de cargas
 * y validación de códigos HTTP.
 */
export async function updateProductoMenu(
  productId: string,
  payload: UpdateProductoPayload
): Promise<UpdateProductoMenuResponse> {
  const cleanId = productId.trim()
  if (!cleanId) {
    return {
      ok: false,
      validation: validateStatusCode(400),
    }
  }

  const endpoint = `/item-menu/${encodeURIComponent(cleanId)}`

  try {
    let response = await executeBalancedRequest(
      () =>
        api.put<unknown>(endpoint, payload, {
          validateStatus: () => true,
        }),
      { maxRetries: 2 }
    )

    if (response.status === 405) {
      response = await executeBalancedRequest(
        () =>
          api.patch<unknown>(endpoint, payload, {
            validateStatus: () => true,
          }),
        { maxRetries: 1 }
      )
    }

    const validation = validateStatusCode(response.status)

    if (!validation.isValid) {
      return {
        ok: false,
        validation,
        rawError: response.data,
      }
    }

    let updated: ItemMenuProducto | undefined
    const raw = response.data
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
        updated = obj.data as ItemMenuProducto
      } else if ('name' in obj || 'id' in obj) {
        updated = obj as unknown as ItemMenuProducto
      }
    }

    return {
      ok: true,
      producto: updated ?? { id: cleanId, ...payload },
      validation,
    }
  } catch (err: unknown) {
    let status = 500
    let rawError: unknown = err
    if (axios.isAxiosError(err)) {
      if (err.response?.status) status = err.response.status
      else if (err.code === 'ECONNABORTED') status = 408
      rawError = err.response?.data ?? err
    }
    return {
      ok: false,
      validation: validateStatusCode(status),
      rawError,
    }
  }
}

