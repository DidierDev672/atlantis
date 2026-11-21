import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import type { ServiceRequestOrder } from '../domain/pedidos-servicio-habitacion'
import type { EstadoPedido } from '../domain/pedidos-servicio-habitacion'
import type { ServiceRequestBackendStatus } from '../domain/service-request-status'
import { detectarPerfilRedDisponible } from './network-quality'

export interface PedidosCacheEntry {
  lista: ServiceRequestOrder[]
  validation: StatusCodeValidationResult | null
  roomsMap: Map<string, string>
  personasMap: Map<string, string>
  itemCategoriaMap: Map<string, string>
  estadosPorPedido: Record<string, EstadoPedido | ServiceRequestBackendStatus>
  updatedAt: number
}

let pedidosCache: PedidosCacheEntry | null = null

export function getPedidosServicioCache(): PedidosCacheEntry | null {
  try {
    if (!pedidosCache) return null
    const ttlMs = detectarPerfilRedDisponible().cacheTtlMs
    if (Date.now() - pedidosCache.updatedAt > ttlMs) {
      pedidosCache = null
      return null
    }
    return pedidosCache
  } catch {
    return null
  }
}

export function setPedidosServicioCache(
  entry: Omit<PedidosCacheEntry, 'updatedAt'>
): void {
  try {
    pedidosCache = {
      ...entry,
      roomsMap: new Map(entry.roomsMap),
      personasMap: new Map(entry.personasMap),
      itemCategoriaMap: new Map(entry.itemCategoriaMap),
      estadosPorPedido: { ...entry.estadosPorPedido },
      updatedAt: Date.now(),
    }
  } catch {
    // Evita fallo si la memoria está restringida
  }
}

export function patchPedidosCacheMetadatos(partial: {
  roomsMap?: Map<string, string>
  personasMap?: Map<string, string>
  itemCategoriaMap?: Map<string, string>
  estadosPorPedido?: Record<string, EstadoPedido | ServiceRequestBackendStatus>
}): void {
  if (!pedidosCache) return
  pedidosCache = {
    ...pedidosCache,
    roomsMap: partial.roomsMap ? new Map(partial.roomsMap) : pedidosCache.roomsMap,
    personasMap: partial.personasMap
      ? new Map(partial.personasMap)
      : pedidosCache.personasMap,
    itemCategoriaMap: partial.itemCategoriaMap
      ? new Map(partial.itemCategoriaMap)
      : pedidosCache.itemCategoriaMap,
    estadosPorPedido: partial.estadosPorPedido
      ? { ...partial.estadosPorPedido }
      : pedidosCache.estadosPorPedido,
  }
}

export function invalidarPedidosServicioCache(): void {
  pedidosCache = null
}
