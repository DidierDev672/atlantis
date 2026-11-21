import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboardList, faRotateRight } from '@fortawesome/free-solid-svg-icons'

export interface PedidosEmptyStateProps {
  totalPedidos: number
  onIrAProductos?: () => void
  onIrACarrito?: () => void
  onRecargar: () => void
  onRestablecerFiltros: () => void
}

/**
 * Molécula: Estado vacío de comandas e historial de ventas cuando no existen pedidos
 * o ningún registro coincide con los filtros activos.
 */
export const PedidosEmptyState = memo(function PedidosEmptyState({
  totalPedidos,
  onIrAProductos,
  onIrACarrito,
  onRecargar,
  onRestablecerFiltros,
}: PedidosEmptyStateProps) {
  const sinPedidos = totalPedidos === 0

  return (
    <div className="border-line bg-panel mx-auto max-w-lg space-y-4 rounded-3xl border p-10 text-center shadow-xs sm:p-14">
      <div className="bg-primary/10 text-primary border-primary/20 mx-auto grid size-16 place-items-center rounded-2xl border text-2xl">
        <FontAwesomeIcon icon={faClipboardList} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-ink font-sans text-base font-black tracking-wider uppercase sm:text-lg">
          {sinPedidos ? 'No se encuentran pedidos' : 'Sin comandas que coincidan'}
        </h3>
        <p className="text-ink-muted mx-auto max-w-sm font-sans text-xs leading-relaxed">
          {sinPedidos
            ? 'Actualmente no se encuentran pedidos registrados en el sistema de Room Service. Las nuevas órdenes aparecerán aquí al consultar o actualizar el historial.'
            : 'No se encontraron pedidos con los filtros o término de búsqueda aplicado. Puedes restablecer los filtros para volver a ver todas las órdenes.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {sinPedidos ? (
          <>
            {onIrAProductos && (
              <button
                type="button"
                onClick={onIrAProductos}
                className="bg-primary hover:bg-primary/90 cursor-pointer rounded-xl px-4 py-2 font-sans text-xs font-bold text-white shadow-2xs transition-colors"
              >
                Tomar Pedido / Ver Menú
              </button>
            )}
            {onIrACarrito && (
              <button
                type="button"
                onClick={onIrACarrito}
                className="border-line bg-canvas text-ink hover:bg-line/40 cursor-pointer rounded-xl border px-4 py-2 font-sans text-xs font-bold transition-colors"
              >
                Ir al Carrito
              </button>
            )}
            <button
              type="button"
              onClick={onRecargar}
              className="border-line bg-canvas text-ink hover:bg-line/40 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 font-sans text-xs font-bold transition-colors"
              title="Volver a consultar /service-request"
            >
              <FontAwesomeIcon icon={faRotateRight} className="size-3" />
              <span>Consultar Nuevamente</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onRestablecerFiltros}
            className="border-line bg-canvas text-ink hover:bg-line/40 cursor-pointer rounded-xl border px-4 py-2 font-sans text-xs font-bold transition-colors"
          >
            Restablecer Filtros
          </button>
        )}
      </div>
    </div>
  )
})
