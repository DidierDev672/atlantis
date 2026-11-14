import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMinus,
  faPlus,
  faLeaf,
  faSeedling,
  faClock,
  faStopwatch,
  faCircleCheck,
  faCircleXmark,
  faReceipt,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons'
import {
  type ItemMenuProducto,
  formatearMonedaCOP,
} from '../../domain/item-menu'
import {
  obtenerProductoKey,
  useCarritoStore,
} from '../../application/carrito-store'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'

export interface ItemMenuProductoCardProps {
  producto: ItemMenuProducto
  index?: number
  viewMode?: LayoutViewMode
  onVerDetalle?: (producto: ItemMenuProducto) => void
}

/**
 * Molécula: Tarjeta interactiva de producto gastronómico sin imágenes,
 * optimizada para Grid y Masonry, visualizando de forma limpia y directa:
 * - Nombre comercial del producto
 * - Descripción detallada
 * - Precio en moneda colombiana (COP)
 * - Indicadores dietéticos, disponibilidad y controles del carrito
 */
export function ItemMenuProductoCard({
  producto,
  viewMode = 'grid',
  onVerDetalle,
}: ItemMenuProductoCardProps) {
  const isVegetariano = Boolean(producto.isVegetarian ?? producto.is_vegetarian)
  const isVegano = Boolean(producto.isVegan ?? producto.is_vegan)
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
      className={`group relative flex flex-col justify-between rounded-3xl border border-line bg-panel p-5 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 cursor-pointer select-none ${
        viewMode === 'grid' ? 'h-full min-h-[220px]' : 'break-inside-avoid mb-6'
      }`}
    >
      {/* 1. Encabezado de la Tarjeta: Badges de Disponibilidad, Dieta y Acceso a Detalle */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Disponibilidad con icono FontAwesome */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isDisponible
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              <FontAwesomeIcon
                icon={isDisponible ? faCircleCheck : faCircleXmark}
                className="size-2.5"
              />
              {isDisponible ? 'Disponible' : 'Agotado'}
            </span>

            {/* Badges Dietéticos con iconos FontAwesome */}
            {isVegetariano && (
              <span
                title="Apto para vegetarianos"
                className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-300"
              >
                <FontAwesomeIcon icon={faLeaf} className="size-2.5 text-green-500" />
                <span>Vegetariano</span>
              </span>
            )}
            {isVegano && (
              <span
                title="Apto para veganos"
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <FontAwesomeIcon icon={faSeedling} className="size-2.5 text-emerald-500" />
                <span>Vegano</span>
              </span>
            )}
          </div>

          <span
            title="Ver detalle completo"
            className="text-ink-muted/50 transition-colors group-hover:text-primary"
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3" />
          </span>
        </div>

        {/* 2. Cuerpo: Nombre y Descripción del Producto */}
        <h3 className="font-serif text-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary">
          {producto.name}
        </h3>

        {producto.description ? (
          <p className="mt-2 text-xs leading-relaxed text-ink-muted line-clamp-3">
            {producto.description}
          </p>
        ) : (
          <p className="mt-2 text-xs italic text-ink-muted/60">
            Sin descripción gastronómica registrada.
          </p>
        )}

        {/* Metadatos secundarios: Tiempo de preparación, Horario e IVA */}
        <div className="flex flex-wrap items-center gap-2 pt-3 text-[11px] text-ink-muted">
          {producto.prep_time !== undefined && (
            <span
              title="Tiempo estimado en cocina"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas/70 px-2 py-0.5 text-[10px] font-medium"
            >
              <FontAwesomeIcon icon={faStopwatch} className="size-2.5 text-amber-500" />
              <span>{producto.prep_time} min</span>
            </span>
          )}

          {(producto.start_time || producto.end_time) && (
            <span
              title="Horario del servicio"
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas/70 px-2 py-0.5 text-[10px] font-medium"
            >
              <FontAwesomeIcon icon={faClock} className="size-2.5 text-primary" />
              <span>
                {producto.start_time || '00:00'} - {producto.end_time || '23:59'}
              </span>
            </span>
          )}

          {producto.tax_percentage !== undefined && (
            <span
              title="Impuesto aplicado"
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas/70 px-2 py-0.5 text-[10px] font-medium"
            >
              <FontAwesomeIcon icon={faReceipt} className="size-2.5 text-sky-500" />
              <span>IVA {producto.tax_percentage}%</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Pie de la Tarjeta: Precio y Acciones Rápidas del Carrito */}
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-line/70 pt-3.5">
        <div>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-ink-muted">
            Precio al huésped
          </span>
          <span className="font-sans text-xl sm:text-2xl font-black tracking-tight text-primary">
            {formatearMonedaCOP(producto.price)}
          </span>
        </div>

        {/* Controles de Carrito con FontAwesome */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
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
    </article>
  )
}

export default ItemMenuProductoCard
