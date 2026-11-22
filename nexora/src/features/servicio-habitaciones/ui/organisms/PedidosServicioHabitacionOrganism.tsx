import { Suspense, memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateRight } from '@fortawesome/free-solid-svg-icons'
import type { LoadingProps } from '../../../../shared/loading'
import type { LoaderProps } from '../../../tema/ui/atoms/loader'
import { lazyWithFallback } from '../../application/lazy-with-fallback'
import {
  usePedidosServicioHabitacion,
  type EstadoActualizablePedido,
} from '../../application/use-pedidos-servicio-habitacion'
import { resolveBackendUpdateStatus } from '../../domain/service-request-status'
import { PedidosControlToolbar } from '../molecules/PedidosControlToolbar'
import { PedidosEmptyState } from '../molecules/PedidosEmptyState'
import { PedidosFeedbackBanner } from '../molecules/PedidosFeedbackBanner'
import type { PedidosHistorialTablaProps } from '../molecules/PedidosHistorialTabla'
import { PedidosTablaSkeleton } from '../molecules/PedidosTablaSkeleton'
import type { PedidoDetalleModalProps } from './PedidoDetalleModal'
import type {
  ServiceRequestItem,
  ServiceRequestOrder,
  UpdateServiceRequestPayload,
  CreateServiceAssignmentPayload,
  NivelPrioridad,
  PrioridadInfo,
  EstadoPedido,
  EstadoPedidoConfig,
} from '../../domain/pedidos-servicio-habitacion'

export type {
  ServiceRequestItem,
  ServiceRequestOrder,
  UpdateServiceRequestPayload,
  CreateServiceAssignmentPayload,
  NivelPrioridad,
  PrioridadInfo,
  EstadoPedido,
  EstadoPedidoConfig,
}

const LazySharedLoading = lazyWithFallback<LoadingProps>(
  () => import('../../../../shared/loading').then((m) => m.Loading),
  'Loading en PedidosServicioHabitacion',
)

const LazyOverlayLoader = lazyWithFallback<LoaderProps>(
  () => import('../../../tema/ui/atoms/loader').then((m) => m.Loader),
  'Loader en PedidosServicioHabitacion',
)

const LazyPedidosHistorialTabla = lazyWithFallback<PedidosHistorialTablaProps>(
  () =>
    import('../molecules/PedidosHistorialTabla').then(
      (m) => m.PedidosHistorialTabla,
    ),
  'PedidosHistorialTabla',
)

const LazyPedidoDetalleModal = lazyWithFallback<PedidoDetalleModalProps>(
  () => import('./PedidoDetalleModal').then((m) => m.PedidoDetalleModal),
  'PedidoDetalleModal',
)

export interface PedidosServicioHabitacionOrganismProps {
  refreshTrigger?: number
  onIrAProductos?: () => void
  onIrACarrito?: () => void
}

/**
 * Organismo: Historial de Ventas de Servicio a la Habitación (`/service-request`).
 * Presenta una tabla optimizada para recepción (Huésped, Categoría, Precio a pagar, Detalle)
 * y carga perezosamente la tabla y el modal de detalle.
 */
export const PedidosServicioHabitacionOrganism = memo(
  function PedidosServicioHabitacionOrganism({
    refreshTrigger = 0,
    onIrAProductos,
    onIrACarrito,
  }: PedidosServicioHabitacionOrganismProps) {
    const {
      pedidos,
      pedidosFiltrados,
      visiblePedidos,
      pedidoDetalleSeleccionado,
      loading,
      feedback,
      busqueda,
      filtroPrioridad,
      filtroCanales,
      filtroFechaVenta,
      estadosPorPedido,
      actualizandoOrdenId,
      hasMorePedidos,
      cargarPedidos,
      handleDismissFeedback,
      handleActualizarBusqueda,
      handleActualizarFiltroPrioridad,
      handleActualizarFiltroCanal,
      handleActualizarFiltroFechaVenta,
      handleRestablecerFiltros,
      handleLoadMorePedidos,
      handleMostrarCincoMas,
      handleAbrirDetalle,
      handleCerrarDetalle,
      handleChangeEstadoById,
      handleActualizarOrden,
    } = usePedidosServicioHabitacion(refreshTrigger)

    const handleRefrescarClick = useCallback(() => {
      void cargarPedidos().catch((error) => {
        console.error('Error al refrescar historial de ventas:', error)
      })
    }, [cargarPedidos])

    const detalleEstadoActual: EstadoActualizablePedido = pedidoDetalleSeleccionado
      ? estadosPorPedido[pedidoDetalleSeleccionado.ordenKey] ||
        resolveBackendUpdateStatus(pedidoDetalleSeleccionado.orden.status)
      : 'confirmed'

    return (
      <div className="font-sans space-y-6">
        <PedidosControlToolbar
          busqueda={busqueda}
          filtroPrioridad={filtroPrioridad}
          filtroCanales={filtroCanales}
          filtroFechaVenta={filtroFechaVenta}
          loading={loading}
          onBusquedaChange={handleActualizarBusqueda}
          onPrioridadChange={handleActualizarFiltroPrioridad}
          onCanalesChange={handleActualizarFiltroCanal}
          onFechaVentaChange={handleActualizarFiltroFechaVenta}
          onRefrescar={handleRefrescarClick}
        />

        <PedidosFeedbackBanner
          feedback={feedback}
          onDismiss={handleDismissFeedback}
        />

        {actualizandoOrdenId !== null && !pedidoDetalleSeleccionado && (
          <Suspense fallback={null}>
            <LazyOverlayLoader
              overlay
              visible
              label="Actualizando pedido..."
            />
          </Suspense>
        )}

        {loading && pedidos.length === 0 ? (
          <div className="border-line bg-panel flex min-h-[240px] items-center justify-center rounded-3xl border shadow-xs">
            <Suspense
              fallback={
                <span className="text-ink-muted text-xs font-medium">
                  Consultando historial de ventas…
                </span>
              }
            >
              <LazySharedLoading
                visible={true}
                variant="block"
                size="md"
                label="Consultando historial de ventas…"
                description="Cargando pedidos (/service-request)"
                delay={0}
                minDuration={250}
              />
            </Suspense>
          </div>
        ) : (
          <div className="space-y-4">
            {loading && pedidos.length > 0 && (
              <div
                role="status"
                aria-live="polite"
                className="border-line bg-panel text-ink-muted flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold shadow-2xs"
              >
                <FontAwesomeIcon icon={faRotateRight} spin className="text-primary size-3.5" />
                <span>Actualizando historial de ventas…</span>
              </div>
            )}

            {pedidosFiltrados.length === 0 ? (
              <PedidosEmptyState
                totalPedidos={pedidos.length}
                onIrAProductos={onIrAProductos}
                onIrACarrito={onIrACarrito}
                onRecargar={handleRefrescarClick}
                onRestablecerFiltros={handleRestablecerFiltros}
              />
            ) : (
              <Suspense fallback={<PedidosTablaSkeleton />}>
                <LazyPedidosHistorialTabla
                  visiblePedidos={visiblePedidos}
                  totalFiltrados={pedidosFiltrados.length}
                  hasMorePedidos={hasMorePedidos}
                  onLoadMore={handleLoadMorePedidos}
                  onMostrarCincoMas={handleMostrarCincoMas}
                  onVerDetalle={handleAbrirDetalle}
                />
              </Suspense>
            )}
          </div>
        )}

        {pedidoDetalleSeleccionado && (
          <Suspense fallback={null}>
            <LazyPedidoDetalleModal
              key={pedidoDetalleSeleccionado.ordenKey}
              pedido={pedidoDetalleSeleccionado}
              estadoActual={detalleEstadoActual}
              isUpdating={actualizandoOrdenId === pedidoDetalleSeleccionado.ordenKey}
              onClose={handleCerrarDetalle}
              onChangeEstadoById={handleChangeEstadoById}
              onActualizarOrden={handleActualizarOrden}
            />
          </Suspense>
        )}
      </div>
    )
  },
)
