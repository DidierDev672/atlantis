import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDays,
  faClipboardList,
  faDollarSign,
  faUser,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons'
import { InfiniteScroll, InfiniteScrollEnd } from '../../../../shared/ui'
import type { PedidoComandaIndexado } from '../../application/use-pedidos-servicio-habitacion'
import { PedidoTablaMobileCard } from './PedidoTablaMobileCard'
import { PedidoTablaRow } from './PedidoTablaRow'

export interface PedidosHistorialTablaProps {
  visiblePedidos: ReadonlyArray<PedidoComandaIndexado>
  totalFiltrados: number
  hasMorePedidos: boolean
  onLoadMore: () => void
  onMostrarCincoMas: () => void
  onVerDetalle: (ordenKey: string) => void
}

/**
 * Molécula: Tabla accesible y progresiva de historial de ventas/pedidos para recepción.
 * Columnas: Huésped (solo nombre), Categoría, Precio a pagar y Detalle.
 */
export const PedidosHistorialTabla = memo(function PedidosHistorialTabla({
  visiblePedidos,
  totalFiltrados,
  hasMorePedidos,
  onLoadMore,
  onMostrarCincoMas,
  onVerDetalle,
}: PedidosHistorialTablaProps) {
  const restantes = Math.max(0, totalFiltrados - visiblePedidos.length)
  const siguienteBloque = Math.min(5, restantes)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-ink-muted text-xs font-medium">
          Mostrando <strong className="text-ink">{visiblePedidos.length}</strong> de{' '}
          <strong className="text-ink">{totalFiltrados}</strong>{' '}
          {totalFiltrados === 1 ? 'pedido registrado' : 'pedidos registrados'}
        </p>
      </div>

      <InfiniteScroll
        onLoadMore={onLoadMore}
        hasMore={hasMorePedidos}
        isLoading={false}
        rootMargin="0px 0px 400px 0px"
        cooldownMs={90}
        loader={
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-10 items-center justify-center py-3"
          >
            <span className="text-ink-muted text-xs font-medium">
              Cargando más pedidos…
            </span>
          </div>
        }
        endMessage={
          <InfiniteScrollEnd label="Has visualizado todos los pedidos del historial de ventas." />
        }
      >
        {/* Vista en tarjetas para móvil, tablet e iPad (< xl) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:hidden">
          {visiblePedidos.map((pedido) => (
            <PedidoTablaMobileCard
              key={pedido.ordenKey}
              pedido={pedido}
              onVerDetalle={onVerDetalle}
            />
          ))}
        </div>

        {/* Vista tabular para escritorio (>= xl) */}
        <div className="border-line bg-panel hidden overflow-hidden rounded-3xl border shadow-xs xl:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="border-line bg-canvas/80 text-ink-muted border-b text-[11px] font-bold tracking-wider uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3.5 sm:px-6">
                    <span className="inline-flex items-center gap-1.5">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-primary size-3"
                        aria-hidden="true"
                      />
                      <span>Huésped</span>
                    </span>
                  </th>

                  <th scope="col" className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      <FontAwesomeIcon
                        icon={faUtensils}
                        className="text-primary size-3"
                        aria-hidden="true"
                      />
                      <span>Categoría</span>
                    </span>
                  </th>

                  <th scope="col" className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      <FontAwesomeIcon
                        icon={faCalendarDays}
                        className="text-primary size-3"
                        aria-hidden="true"
                      />
                      <span>Fecha de venta</span>
                    </span>
                  </th>

                  <th scope="col" className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <FontAwesomeIcon
                        icon={faDollarSign}
                        className="text-primary size-3"
                        aria-hidden="true"
                      />
                      <span>Precio a pagar</span>
                    </span>
                  </th>

                  <th scope="col" className="px-5 py-3.5 text-right sm:px-6">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <FontAwesomeIcon
                        icon={faClipboardList}
                        className="text-primary size-3"
                        aria-hidden="true"
                      />
                      <span>Detalle</span>
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-line/70 divide-y">
                {visiblePedidos.map((pedido) => (
                  <PedidoTablaRow
                    key={pedido.ordenKey}
                    pedido={pedido}
                    onVerDetalle={onVerDetalle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </InfiniteScroll>

      {hasMorePedidos && restantes > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onMostrarCincoMas}
            className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary cursor-pointer rounded-2xl border px-4 py-2 text-xs font-semibold shadow-2xs transition-colors"
          >
            Mostrar {siguienteBloque} {siguienteBloque === 1 ? 'pedido más' : 'pedidos más'} (
            {restantes} {restantes === 1 ? 'restante' : 'restantes'})
          </button>
        </div>
      )}
    </div>
  )
})
