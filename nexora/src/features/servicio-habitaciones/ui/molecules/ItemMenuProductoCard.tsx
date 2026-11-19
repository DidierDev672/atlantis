import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPenToSquare, faPlus } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../../../../shared/ui'
import {
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
  formatearMonedaCOP,
} from '../../domain/item-menu'
import {
  obtenerProductoKey,
  useCarritoStore,
} from '../../application/carrito-store'
import { useCategoriaServicio } from '../../application/use-categoria-servicio'
import { CategoriaVinculadaBadge } from '../atoms/CategoriaVinculadaBadge'
import { ProductoImagenHeader } from '../atoms/ProductoImagenHeader'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import { ItemMenuProductoMasonryCard } from './ItemMenuProductoMasonryCard'

export interface ItemMenuProductoCardProps {
  producto: ItemMenuProducto
  index?: number
  viewMode?: LayoutViewMode
  categoriaInfo?: CategoriaVinculadaInfo | null
  onVerDetalle?: (producto: ItemMenuProducto) => void
  onEditar?: (producto: ItemMenuProducto) => void
}

/**
 * Molécula: Tarjeta interactiva de producto gastronómico optimizada para el recepcionista.
 * Muestra la imagen del producto en el encabezado, título/descripción, banner de la
 * categoría vinculada sobre el precio y controles rápidos para editar y agregar al carrito.
 */
export function ItemMenuProductoCard({
  producto,
  index = 0,
  viewMode = 'grid',
  categoriaInfo,
  onVerDetalle,
  onEditar,
}: ItemMenuProductoCardProps) {
  const { categoriaServicio } = useCategoriaServicio(
    categoriaInfo ? undefined : producto.category_id
  )
  const categoriaVinculada = categoriaInfo ?? categoriaServicio
  const isDisponible = producto.available !== false

  const productoKey = obtenerProductoKey(producto)
  const cantidadEnCarrito = useCarritoStore(
    (s) =>
      s.items.find((item) => obtenerProductoKey(item.producto) === productoKey)
        ?.cantidad ?? 0
  )
  const agregarProducto = useCarritoStore((s) => s.agregarProducto)
  const incrementarCantidad = useCarritoStore((s) => s.incrementarCantidad)
  const decrementarCantidad = useCarritoStore((s) => s.decrementarCantidad)

  if (viewMode === 'masonry') {
    return (
      <ItemMenuProductoMasonryCard
        producto={producto}
        index={index}
        categoriaInfo={categoriaVinculada}
        onVerDetalle={onVerDetalle}
        onEditar={onEditar}
      />
    )
  }

  return (
    <article
      data-id={producto.id}
      data-category-id={producto.category_id}
      role="button"
      tabIndex={0}
      onClick={() => onVerDetalle?.(producto)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onVerDetalle?.(producto)
        }
      }}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-line bg-panel shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 cursor-pointer select-none"
    >
      {/* 1. Encabezado visual con imagen del producto */}
      <div>
        <ProductoImagenHeader producto={producto} />

        {/* 2. Nombre del Producto */}
        <div className="p-5 pb-3">
          <h3 className="font-serif text-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary line-clamp-2">
            {producto.name}
          </h3>
        </div>
      </div>

      {/* 3. Banner de categoría vinculada arriba del precio + Pie con precio y carrito */}
      <div className="space-y-3.5 px-5 pb-5 pt-1">
        {categoriaVinculada && (
          <CategoriaVinculadaBadge
            categoria={categoriaVinculada}
            variant="card"
          />
        )}

        <div className="flex items-end justify-between gap-3 border-t border-line/70 pt-3">
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-ink-muted">
              Precio al huésped
            </span>
            <span className="font-sans text-xl sm:text-2xl font-black tracking-tight text-primary">
              {formatearMonedaCOP(producto.price)}
            </span>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center gap-2"
          >
            {onEditar && (
              <Tooltip content="Modificar producto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditar(producto)
                  }}
                  aria-label={`Modificar ${producto.name}`}
                  className="border-line bg-canvas text-ink hover:border-primary/40 hover:text-primary inline-flex size-9 cursor-pointer items-center justify-center rounded-2xl border shadow-2xs transition-all hover:scale-105 active:scale-95"
                >
                  <FontAwesomeIcon
                    icon={faPenToSquare}
                    className="size-3.5"
                    aria-hidden="true"
                  />
                </button>
              </Tooltip>
            )}

            {cantidadEnCarrito === 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  agregarProducto(producto, 1)
                }}
                disabled={!isDisponible}
                aria-label={`Agregar ${producto.name} al carrito`}
                title={isDisponible ? 'Agregar al carrito' : 'No disponible'}
                className="bg-primary hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-white shadow-xs shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-canvas/80 p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    decrementarCantidad(productoKey)
                  }}
                  aria-label={`Descontar una unidad de ${producto.name}`}
                  title="Descontar cantidad"
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-xl bg-panel text-ink transition-all hover:bg-rose-500 hover:text-white active:scale-95 border border-line"
                >
                  <FontAwesomeIcon icon={faMinus} className="size-2.5" />
                </button>

                <span
                  aria-label={`${cantidadEnCarrito} unidades en el carrito`}
                  className="min-w-6 text-center text-xs font-black text-ink"
                >
                  {cantidadEnCarrito}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    incrementarCantidad(productoKey)
                  }}
                  disabled={!isDisponible}
                  aria-label={`Aumentar una unidad de ${producto.name}`}
                  title="Aumentar cantidad"
                  className="bg-primary hover:bg-primary/90 inline-flex size-7 cursor-pointer items-center justify-center rounded-xl text-white shadow-2xs transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPlus} className="size-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default ItemMenuProductoCard
