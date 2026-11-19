import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMinus,
  faPenToSquare,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import {
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
  formatearMonedaCOP,
} from '../../domain/item-menu'
import { CategoriaVinculadaBadge } from '../atoms/CategoriaVinculadaBadge'

export interface ItemMenuProductoMasonryOverlayProps {
  producto: ItemMenuProducto
  categoriaVinculada?: CategoriaVinculadaInfo | null
  isDisponible: boolean
  cantidadEnCarrito: number
  onEditar?: (producto: ItemMenuProducto) => void
  onAgregar: () => void
  onIncrementar: () => void
  onDecrementar: () => void
}

/**
 * Molécula: Overlay interactivo para tarjetas Masonry.
 * Se monta de forma perezosa únicamente al interactuar (hover / focus / touch),
 * evitando mantener botones, badges y DOM oculto en tarjetas en reposo.
 */
export const ItemMenuProductoMasonryOverlay = memo(
  function ItemMenuProductoMasonryOverlay({
    producto,
    categoriaVinculada,
    isDisponible,
    cantidadEnCarrito,
    onEditar,
    onAgregar,
    onIncrementar,
    onDecrementar,
  }: ItemMenuProductoMasonryOverlayProps) {
    return (
      <div className="absolute inset-0 flex flex-col justify-between bg-linear-to-t from-black/95 via-black/70 to-black/45 p-4 opacity-100 transition-opacity duration-200 ease-out sm:p-5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base font-bold leading-snug text-white line-clamp-2 sm:text-lg">
              {producto.name}
            </h3>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center gap-1.5"
          >
            {onEditar && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditar(producto)
                }}
                aria-label={`Modificar ${producto.name}`}
                title="Modificar producto"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-md transition-transform hover:scale-105 hover:bg-black/85 active:scale-95"
              >
                <FontAwesomeIcon
                  icon={faPenToSquare}
                  className="size-3.5"
                  aria-hidden="true"
                />
              </button>
            )}

            {cantidadEnCarrito === 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAgregar()
                }}
                disabled={!isDisponible}
                aria-label={`Agregar ${producto.name} al carrito`}
                title={isDisponible ? 'Agregar al carrito' : 'No disponible'}
                className="bg-primary hover:bg-primary/90 inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} className="size-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1 rounded-full border border-white/25 bg-black/80 p-1 shadow-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDecrementar()
                  }}
                  aria-label={`Disminuir una unidad de ${producto.name}`}
                  title="Disminuir cantidad"
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-rose-500 active:scale-95"
                >
                  <FontAwesomeIcon icon={faMinus} className="size-2.5" />
                </button>

                <span
                  aria-label={`${cantidadEnCarrito} unidades en el carrito`}
                  className="min-w-5 text-center text-xs font-black text-white"
                >
                  {cantidadEnCarrito}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onIncrementar()
                  }}
                  disabled={!isDisponible}
                  aria-label={`Agregar más de ${producto.name}`}
                  title="Agregar más"
                  className="bg-primary hover:bg-primary/90 inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPlus} className="size-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {categoriaVinculada && (
            <CategoriaVinculadaBadge
              categoria={categoriaVinculada}
              variant="overlay"
            />
          )}
          <div className="border-t border-white/20 pt-3">
            <span className="block text-[10px] font-bold tracking-wider text-white/70 uppercase">
              Precio
            </span>
            <span className="font-sans text-lg font-black tracking-tight text-white sm:text-xl">
              {formatearMonedaCOP(producto.price)}
            </span>
          </div>
        </div>
      </div>
    )
  }
)

export default ItemMenuProductoMasonryOverlay
