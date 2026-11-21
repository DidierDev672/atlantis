import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faReceipt, faXmark } from '@fortawesome/free-solid-svg-icons'

export interface PedidoDetalleModalHeaderProps {
  categoriaNombre: string
  orderNumber: string
  filteredCount: number
  totalCount: number
  hasSearchQuery: boolean
  isUpdating: boolean
  onClose: () => void
}

/**
 * Molécula: Cabecera del modal de detalle de pedido con categoría, número de orden,
 * contador de productos y botón de cierre protegido durante actualizaciones.
 */
export const PedidoDetalleModalHeader = memo(function PedidoDetalleModalHeader({
  categoriaNombre,
  orderNumber,
  filteredCount,
  totalCount,
  hasSearchQuery,
  isUpdating,
  onClose,
}: PedidoDetalleModalHeaderProps) {
  return (
    <header className="border-line bg-canvas/60 flex items-center justify-between gap-3 rounded-t-3xl border-b px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="bg-primary/15 text-primary grid size-11 shrink-0 place-items-center rounded-2xl">
          <FontAwesomeIcon icon={faReceipt} className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <span className="text-primary block font-sans text-[10px] font-bold tracking-wider uppercase">
            {categoriaNombre}
          </span>
          <h3
            id="modal-detalle-pedido-titulo"
            className="text-ink truncate font-sans text-lg font-bold sm:text-xl"
          >
            Detalle del Pedido #{orderNumber}
          </h3>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-1 font-sans text-xs font-bold tabular-nums">
          {hasSearchQuery
            ? `${filteredCount}/${totalCount}`
            : `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`}
        </span>

        <button
          type="button"
          onClick={onClose}
          disabled={isUpdating}
          className="border-line bg-panel text-ink-muted hover:bg-canvas hover:text-ink grid size-9 cursor-pointer place-items-center rounded-full border transition-colors disabled:opacity-50"
          title="Cerrar ventana"
          aria-label="Cerrar ventana"
        >
          <FontAwesomeIcon icon={faXmark} className="size-4" />
        </button>
      </div>
    </header>
  )
})
