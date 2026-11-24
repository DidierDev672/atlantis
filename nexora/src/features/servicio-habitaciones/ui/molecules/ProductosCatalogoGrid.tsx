import { memo } from 'react'
import { InfiniteScroll, InfiniteScrollEnd } from '../../../../shared/ui'
import {
  resolverCategoriaDeProducto,
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
} from '../../domain/item-menu'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import { VirtualizedCardSlot } from '../atoms/VirtualizedCardSlot'
import { ItemMenuProductoCard } from './ItemMenuProductoCard'
import { ProductosMasonryColumnsLayout } from './ProductosMasonryColumnsLayout'

export interface ProductosCatalogoGridProps {
  productos: ReadonlyArray<ItemMenuProducto>
  totalFiltrados: number
  viewMode: LayoutViewMode
  categoriasMap: ReadonlyMap<string, CategoriaVinculadaInfo>
  hasMore: boolean
  onLoadMore: () => void
  onMostrarCincoMas: () => void
  onVerDetalle: (producto: ItemMenuProducto) => void
  onEditar?: (producto: ItemMenuProducto) => void
}

/**
 * Molécula: Contenedor progresivo y virtualizado del catálogo de productos.
 * Usa `VirtualizedCardSlot` para desmontar nodos DOM fuera de pantalla,
 * loader ligero sin SaturnLoader en cada lote, y avance incremental de +5 productos.
 */
export const ProductosCatalogoGrid = memo(function ProductosCatalogoGrid({
  productos,
  totalFiltrados,
  viewMode,
  categoriasMap,
  hasMore,
  onLoadMore,
  onMostrarCincoMas,
  onVerDetalle,
  onEditar,
}: ProductosCatalogoGridProps) {
  const restantes = Math.max(0, totalFiltrados - productos.length)
  const siguienteBloque = Math.min(5, restantes)

  return (
    <div className="space-y-4">
      <InfiniteScroll
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        isLoading={false}
        rootMargin="0px 0px 450px 0px"
        cooldownMs={90}
        loader={
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-10 items-center justify-center py-3"
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
            } del menú de Room Service.`}
          />
        }
      >
        {viewMode === 'masonry' ? (
          <ProductosMasonryColumnsLayout
            productos={productos}
            categoriasMap={categoriasMap}
            onVerDetalle={onVerDetalle}
            onEditar={onEditar}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productos.map((item, idx) => {
              const itemKey =
                item.id || `${item.category_id || 'cat'}-${item.name}-${idx}`

              return (
                <VirtualizedCardSlot
                  key={itemKey}
                  estimatedHeight={280}
                  className="h-full w-full"
                >
                  <ItemMenuProductoCard
                    producto={item}
                    index={idx}
                    viewMode="grid"
                    categoriaInfo={resolverCategoriaDeProducto(
                      item.category_id,
                      categoriasMap
                    )}
                    onVerDetalle={onVerDetalle}
                    onEditar={onEditar}
                  />
                </VirtualizedCardSlot>
              )
            })}
          </div>
        )}
      </InfiniteScroll>

      {hasMore && restantes > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onMostrarCincoMas}
            className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary cursor-pointer rounded-2xl border px-4 py-2 text-xs font-semibold shadow-2xs transition-colors"
          >
            Mostrar {siguienteBloque} productos más ({restantes} restantes)
          </button>
        </div>
      )}
    </div>
  )
})
