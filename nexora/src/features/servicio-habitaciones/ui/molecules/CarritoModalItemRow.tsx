import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import {
  obtenerProductoKey,
  type ItemCarrito,
} from '../../application/carrito-store'
import {
  formatearMonedaCOP,
  resolverImagenProducto,
} from '../../domain/item-menu'

const FALLBACK_ITEM_IMAGE =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'

export interface CarritoModalItemRowProps {
  item: ItemCarrito
  onIncrement: (productoKey: string) => void
  onDecrement: (productoKey: string) => void
  onRemove: (productoKey: string) => void
}

/**
 * Molécula: Fila de producto dentro del modal flotante del carrito.
 */
export function CarritoModalItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CarritoModalItemRowProps) {
  const { producto, cantidad } = item
  const productoKey = obtenerProductoKey(producto)
  const [imgError, setImgError] = useState(false)
  const imgSrc = imgError ? FALLBACK_ITEM_IMAGE : resolverImagenProducto(producto)
  const subtotalItem = producto.price * cantidad

  return (
    <div className="border-line bg-canvas/70 flex items-center gap-3.5 rounded-2xl border p-3 transition-colors hover:bg-canvas">
      <div className="border-line bg-panel size-16 shrink-0 overflow-hidden rounded-xl border">
        <img
          src={imgSrc}
          alt={producto.name}
          onError={() => setImgError(true)}
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-ink truncate font-serif text-sm font-bold">
            {producto.name}
          </h4>
          <button
            type="button"
            onClick={() => onRemove(productoKey)}
            aria-label={`Eliminar ${producto.name} del carrito`}
            title="Quitar del carrito"
            className="text-ink-muted shrink-0 cursor-pointer rounded-lg p-1 text-xs transition-colors hover:bg-rose-500/15 hover:text-rose-500"
          >
            <FontAwesomeIcon icon={faTrash} className="size-3.5" />
          </button>
        </div>

        <div className="text-ink-muted mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
          <span>Unitario: {formatearMonedaCOP(producto.price)}</span>
          {producto.tax_percentage !== undefined && producto.tax_percentage > 0 && (
            <span className="border-line bg-panel rounded-md border px-1.5 py-0.5 text-[10px] font-semibold">
              IVA {producto.tax_percentage}%
            </span>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="border-line bg-panel inline-flex items-center gap-1 rounded-xl border p-0.5">
            <button
              type="button"
              onClick={() => onDecrement(productoKey)}
              aria-label={`Descontar una unidad de ${producto.name}`}
              title="Descontar"
              className="text-ink-muted hover:text-ink inline-flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-canvas"
            >
              <FontAwesomeIcon icon={faMinus} className="size-2.5" />
            </button>
            <span className="text-ink min-w-6 text-center text-xs font-extrabold">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(productoKey)}
              aria-label={`Aumentar una unidad de ${producto.name}`}
              title="Aumentar"
              className="bg-primary/15 text-primary hover:bg-primary inline-flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:text-white"
            >
              <FontAwesomeIcon icon={faPlus} className="size-2.5" />
            </button>
          </div>

          <span className="text-primary font-sans text-sm font-black">
            {formatearMonedaCOP(subtotalItem)}
          </span>
        </div>
      </div>
    </div>
  )
}

