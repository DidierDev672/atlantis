import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBowlFood, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons'
import { InfiniteScroll, InfiniteScrollEnd } from '../../../../shared/ui'
import type { ItemMenuProducto } from '../../domain/item-menu'
import { VirtualizedCardSlot } from '../atoms/VirtualizedCardSlot'
import { CategoriaProductoFilaItem } from './CategoriaProductoFilaItem'

export interface MenuCategoriaModalProductosListaProps {
  visibleProductos: ReadonlyArray<ItemMenuProducto>
  totalFiltrados: number
  totalVinculados: number
  busqueda: string
  hasMore: boolean
  onLoadMore: () => void
  onMostrarCincoMas: () => void
  onLimpiarBusqueda: () => void
  onAgregarPrimerProducto?: () => void
}

/**
 * Molécula: Listado progresivo y virtualizado de productos dentro del modal de categoría,
 * más los estados vacíos de búsqueda o categoría sin ítems.
 */
export const MenuCategoriaModalProductosLista = memo(
  function MenuCategoriaModalProductosLista({
    visibleProductos,
    totalFiltrados,
    totalVinculados,
    busqueda,
    hasMore,
    onLoadMore,
    onMostrarCincoMas,
    onLimpiarBusqueda,
    onAgregarPrimerProducto,
  }: MenuCategoriaModalProductosListaProps) {
    if (totalFiltrados > 0) {
      const restantes = Math.max(0, totalFiltrados - visibleProductos.length)
      const siguienteBloque = Math.min(5, restantes)

      return (
        <div className="space-y-3">
          <InfiniteScroll
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            isLoading={false}
            rootMargin="0px 0px 250px 0px"
            cooldownMs={90}
            loader={
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-8 items-center justify-center py-2"
              >
                <span className="text-ink-muted text-xs font-medium">
                  Cargando más productos…
                </span>
              </div>
            }
            endMessage={
              <InfiniteScrollEnd
                label={`Mostrando todos los ${totalFiltrados} ${
                  totalFiltrados === 1 ? 'producto' : 'productos'
                } de la categoría.`}
              />
            }
          >
            <div role="list" className="space-y-3">
              {visibleProductos.map((producto, idx) => (
                <VirtualizedCardSlot
                  key={producto.id ?? `${producto.name}-${idx}`}
                  estimatedHeight={104}
                  className="w-full"
                >
                  <CategoriaProductoFilaItem producto={producto} index={idx} />
                </VirtualizedCardSlot>
              ))}
            </div>
          </InfiniteScroll>

          {hasMore && restantes > 0 && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onMostrarCincoMas}
                className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
              >
                Mostrar {siguienteBloque} {siguienteBloque === 1 ? 'producto más' : 'productos más'} (
                {restantes} {restantes === 1 ? 'restante' : 'restantes'})
              </button>
            </div>
          )}
        </div>
      )
    }

    if (totalVinculados > 0) {
      return (
        <div className="border-line bg-canvas/40 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-ink-muted size-6" />
          <div className="space-y-1">
            <p className="text-ink text-sm font-bold">
              Sin coincidencias para "{busqueda}"
            </p>
            <p className="text-ink-muted text-xs">
              Intenta con otro nombre o descripción del producto.
            </p>
          </div>
          <button
            type="button"
            onClick={onLimpiarBusqueda}
            className="border-line bg-panel text-ink hover:border-primary/40 mt-1 cursor-pointer rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
          >
            Limpiar búsqueda
          </button>
        </div>
      )
    }

    return (
      <div className="border-line bg-canvas/40 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center">
        <div className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
          <FontAwesomeIcon icon={faBowlFood} className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-ink text-sm font-bold">Sin productos vinculados aún</p>
          <p className="text-ink-muted max-w-sm text-xs">
            Esta categoría todavía no tiene platillos o bebidas asociadas en el catálogo.
          </p>
        </div>
        {onAgregarPrimerProducto && (
          <button
            type="button"
            onClick={onAgregarPrimerProducto}
            className="bg-primary hover:bg-primary/90 mt-1 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors active:scale-95"
          >
            <FontAwesomeIcon icon={faPlus} className="size-3" />
            <span>Agregar primer producto</span>
          </button>
        )}
      </div>
    )
  },
)
