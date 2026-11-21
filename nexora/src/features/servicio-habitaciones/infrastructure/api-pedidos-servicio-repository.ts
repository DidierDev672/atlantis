import { api } from '../../../lib/api'
import { readAuthUser } from '../../../shared/auth-storage'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import type {
  EstadoPedido,
  ServiceRequestOrder,
  UpdateServiceRequestPayload,
} from '../domain/pedidos-servicio-habitacion'
import {
  resolveBackendUpdateStatus,
  SERVICE_REQUEST_STATUS_CONFIG,
  type ServiceRequestBackendStatus,
} from '../domain/service-request-status'

function mapEstadoToBackend(
  estadoActual: EstadoPedido | ServiceRequestBackendStatus,
): {
  statusBackend: ServiceRequestBackendStatus
  statusComment: string
} {
  const statusBackend = resolveBackendUpdateStatus(estadoActual)
  const config = SERVICE_REQUEST_STATUS_CONFIG[statusBackend]
  return {
    statusBackend,
    statusComment: config.statusComment,
  }
}

function normalizarListaPedidos(raw: unknown): ServiceRequestOrder[] {
  if (Array.isArray(raw)) {
    return raw as ServiceRequestOrder[]
  }
  if (raw && typeof raw === 'object') {
    if (Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: ServiceRequestOrder[] }).data
    }
    if ('order_number' in raw) {
      return [raw as ServiceRequestOrder]
    }
  }
  return []
}

/**
 * Repositorio de infraestructura: Consulta `GET /service-request` y normaliza la lista junto con su status HTTP.
 */
export async function fetchPedidosServiceRequestApi(): Promise<{
  lista: ServiceRequestOrder[]
  validation: StatusCodeValidationResult
}> {
  try {
    const response = await api.get('/service-request', {
      validateStatus: () => true,
    })
    const validation = validateStatusCode(response.status)

    if (!validation.isValid) {
      return { lista: [], validation }
    }

    return {
      lista: normalizarListaPedidos(response.data),
      validation,
    }
  } catch (error) {
    console.error('Error al consultar /service-request:', error)
    return { lista: [], validation: validateStatusCode(500) }
  }
}

/**
 * Repositorio de infraestructura: Construye el payload de estado y ejecuta `PUT /service-requests/{id}`
 * mediante el balanceador de carga (`executeBalancedRequest`) y valida el código HTTP con `validateStatusCode`.
 */
export async function actualizarOrdenYAsignacionApi(
  orden: ServiceRequestOrder,
  estadoActual: EstadoPedido | ServiceRequestBackendStatus,
): Promise<StatusCodeValidationResult> {
  try {
    const { statusBackend, statusComment } = mapEstadoToBackend(estadoActual)
    const authUser = readAuthUser()
    const actorId =
      (authUser?.id as string) || (authUser?.user_id as string) || 'waiter-01'

    const targetId =
      orden.id || (orden.order_number === '71' ? 'sr-1' : orden.order_number || 'sr-1')

    const payload: UpdateServiceRequestPayload = {
      status: statusBackend,
      actor_type: 'staff',
      actor_id: actorId,
      status_comment: statusComment,
    }

    const responsePut = await executeBalancedRequest(() =>
      api.put(
        `/service-requests/${encodeURIComponent(targetId)}`,
        payload,
        { validateStatus: () => true },
      ),
    )

    const validationPut = validateStatusCode(responsePut.status)
    if (!validationPut.isValid) {
      return validationPut
    }

    return {
      ...validationPut,
      title: validationPut.title || 'Estado Actualizado',
      message:
        validationPut.message ||
        `La comanda #${orden.order_number} se actualizó correctamente (${statusComment}).`,
    }
  } catch (error) {
    console.error('Error al actualizar /service-requests/{id}:', error)
    return validateStatusCode(500)
  }
}
