import axios from 'axios'
import { api } from '../../../lib/api'
import { BoundedTtlCache } from '../../../shared/lib/bounded-ttl-cache'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import { detectarRecursosDispositivoRecepciones } from './recepciones-resource-detector'
import {
  formatServiceOrderStatus,
  type GuestServiceRequestProduct,
} from '../domain/salida-huesped'

const serviceRequestsCache = new BoundedTtlCache<
  string,
  FetchGuestServiceRequestsResult
>(200, 2 * 60 * 1000)
const inFlightServiceRequests = new Map<
  string,
  Promise<FetchGuestServiceRequestsResult>
>()

export function clearServiceRequestsCache(): void {
  serviceRequestsCache.clear()
}

export interface ServiceRequestOrderLineDto {
  id?: string
  order_id?: string
  item_menu_id?: string
  name_snapshot?: string
  name?: string
  price_unit?: number
  tax_rate?: number
  amount?: number
  note?: string
}

export interface ServiceRequestItemDto {
  id?: string
  order_number?: string
  stay_id?: string
  person_id?: string
  status?: string
  currency?: string
  subtotal?: number
  taxes?: number
  total?: number
  items?: ServiceRequestOrderLineDto[]
}

export interface GuestServiceRequestsSummary {
  count: number
  totalAmount: number
  products: GuestServiceRequestProduct[]
}

export interface FetchGuestServiceRequestsResult
  extends GuestServiceRequestsSummary {
  validation: StatusCodeValidationResult
}

export interface FetchServiceRequestSummariesResult {
  summariesByPersonId: Map<string, GuestServiceRequestsSummary>
  validation: StatusCodeValidationResult | null
}

function extractServiceRequestList(payload: unknown): ServiceRequestItemDto[] {
  if (Array.isArray(payload)) {
    return payload as ServiceRequestItemDto[]
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const key of ['data', 'service_requests', 'orders', 'items']) {
      if (Array.isArray(obj[key])) {
        return obj[key] as ServiceRequestItemDto[]
      }
    }
    if ('order_number' in obj || 'stay_id' in obj || 'id' in obj) {
      return [obj as ServiceRequestItemDto]
    }
  }
  return []
}

function buildGuestServiceSummary(
  items: ReadonlyArray<ServiceRequestItemDto>,
  personId: string
): GuestServiceRequestsSummary {
  const seenKeys = new Set<string>()
  const products: GuestServiceRequestProduct[] = []
  let totalAmount = 0

  items.forEach((order, orderIndex) => {
    const itemPersonId = order.person_id?.trim()
    if (itemPersonId && itemPersonId !== personId) return

    const uniqueKey =
      order.id?.trim() ||
      order.order_number?.trim() ||
      `service-req-${personId}-${orderIndex}`

    if (seenKeys.has(uniqueKey)) return
    seenKeys.add(uniqueKey)

    const currency = order.currency?.trim() || 'COP'
    const statusLabel = formatServiceOrderStatus(order.status)
    const orderItems = Array.isArray(order.items) ? order.items : []

    let computedOrderLinesTotal = 0

    orderItems.forEach((line, lineIndex) => {
      const amount = Math.max(1, Number(line.amount) || 1)
      const unitPrice = Number(line.price_unit) || 0
      const lineTotal = unitPrice * amount
      computedOrderLinesTotal += lineTotal

      products.push({
        internalKey:
          line.id?.trim() || `${uniqueKey}-line-${lineIndex}`,
        name:
          line.name_snapshot?.trim() ||
          line.name?.trim() ||
          'Producto de servicio a la habitación',
        amount,
        unitPrice,
        lineTotal,
        orderNumber: order.order_number?.trim(),
        statusLabel,
        currency,
        note: line.note?.trim() || undefined,
      })
    })

    const orderTotal =
      typeof order.total === 'number' && Number.isFinite(order.total)
        ? order.total
        : computedOrderLinesTotal
    totalAmount += orderTotal
  })

  return {
    count: seenKeys.size,
    totalAmount,
    products,
  }
}

/**
 * Consume `GET /service-request?person_id={person_id}` con Axios,
 * balanceo preventivo de carga (`executeBalancedRequest`) y validación
 * empática de códigos HTTP (`validateStatusCode`).
 */
export async function fetchServiceRequestsByPersonId(
  personId: string,
  options?: { forceRefresh?: boolean }
): Promise<FetchGuestServiceRequestsResult> {
  const targetId = personId.trim()
  if (!targetId) {
    return {
      count: 0,
      totalAmount: 0,
      products: [],
      validation: validateStatusCode(200),
    }
  }

  if (!options?.forceRefresh) {
    const cached = serviceRequestsCache.get(targetId)
    if (cached) return cached
  }

  const existing = inFlightServiceRequests.get(targetId)
  if (existing) return existing

  const promise = (async (): Promise<FetchGuestServiceRequestsResult> => {
    try {
      const response = await executeBalancedRequest(
        () =>
          api.get<unknown>(
            `/service-request?person_id=${encodeURIComponent(targetId)}`,
            { validateStatus: () => true }
          ),
        { maxRetries: 0 }
      )

      const validation = validateStatusCode(response.status)

      if (validation.isValid) {
        const list = extractServiceRequestList(response.data)
        const summary = buildGuestServiceSummary(list, targetId)
        const result: FetchGuestServiceRequestsResult = {
          ...summary,
          validation,
        }
        serviceRequestsCache.set(targetId, result)
        return result
      }

      if (response.status === 404) {
        const emptyOk: FetchGuestServiceRequestsResult = {
          count: 0,
          totalAmount: 0,
          products: [],
          validation: validateStatusCode(200),
        }
        serviceRequestsCache.set(targetId, emptyOk)
        return emptyOk
      }

      return {
        count: 0,
        totalAmount: 0,
        products: [],
        validation,
      }
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? (error.response?.status ?? 500)
        : 500
      return {
        count: 0,
        totalAmount: 0,
        products: [],
        validation: validateStatusCode(status),
      }
    } finally {
      inFlightServiceRequests.delete(targetId)
    }
  })()

  inFlightServiceRequests.set(targetId, promise)
  return promise
}

/**
 * Consulta en lotes con concurrencia acotada y caché TTL compartida
 * solo los `person_id` que aún no están cacheados.
 */
export async function fetchServiceRequestCountsByPersonIds(
  personIds: ReadonlyArray<string>,
  options?: { forceRefresh?: boolean }
): Promise<FetchServiceRequestSummariesResult> {
  const summariesByPersonId = new Map<string, GuestServiceRequestsSummary>()
  const uniqueIds = Array.from(
    new Set(personIds.map((id) => id.trim()).filter(Boolean))
  )

  if (uniqueIds.length === 0) {
    return { summariesByPersonId, validation: null }
  }

  const pendingIds: string[] = []
  for (const pid of uniqueIds) {
    if (!options?.forceRefresh) {
      const cached = serviceRequestsCache.get(pid)
      if (cached) {
        summariesByPersonId.set(pid, {
          count: cached.count,
          totalAmount: cached.totalAmount,
          products: cached.products,
        })
        continue
      }
    }
    pendingIds.push(pid)
  }

  if (pendingIds.length === 0) {
    return { summariesByPersonId, validation: null }
  }

  const concurrency = Math.max(
    1,
    detectarRecursosDispositivoRecepciones().policy.serviceRequestsConcurrency
  )
  let cursor = 0
  let firstErrorValidation: StatusCodeValidationResult | null = null

  async function worker() {
    while (cursor < pendingIds.length) {
      const idx = cursor++
      const pid = pendingIds[idx]
      const res = await fetchServiceRequestsByPersonId(pid, options)
      summariesByPersonId.set(pid, {
        count: res.count,
        totalAmount: res.totalAmount,
        products: res.products,
      })
      if (!res.validation.isValid && !firstErrorValidation) {
        firstErrorValidation = res.validation
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pendingIds.length) }, () =>
      worker()
    )
  )

  return {
    summariesByPersonId,
    validation: firstErrorValidation,
  }
}
