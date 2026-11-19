import { memo } from 'react'
import {
  InfiniteScroll,
  InfiniteScrollEnd,
  InfiniteScrollOptimizedItem,
} from '../../../../shared/ui'
import { Loading } from '../../../../shared/loading'
import {
  resolverCategoriaDeProducto,
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
} from '../../domain/item-menu'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import { ItemMenuProductoCard } from './ItemMenuProductoCard'
import { ProductosMasonryColumnsLayout } from './ProductosMasonryColumnsLayout'

export interface ProductosCatalogoGridProps {
  productos: ReadonlyArray<ItemMenuProducto>
  totalFiltrados: number
  viewMode: LayoutViewMode
  categoriasMap: ReadonlyMap<string, CategoriaVinculadaInfo>
  hasMore: boolean
  onLoadMore: () => void
  onMostrarTodos: () => void
  onVerDetalle: (producto: ItemMenuProducto) => void
  onEditar: (producto: ItemMenuProducto) => void
}

/**
 * Molécula: Contenedor progresivo del catálogo de productos (Grid / Masonry)
 * con `InfiniteScroll` y aislamiento seguro por tarjeta (`content-visibility: auto`).
 */
export const ProductosCatalogoGrid = memo(function ProductosCatalogoGrid({
  productos,
  totalFiltrados,
  viewMode,
  categoriasMap,
  hasMore,
  onLoadMore,
  onMostrarTodos,
  onVerDetalle,
  onEditar,
}: ProductosCatalogoGridProps) {
  const restantes = Math.max(0, totalFiltrados - productos.length)

  return (
    <div className="space-y-4">
      <InfiniteScroll
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        isLoading={false}
        rootMargin="0px 0px 450px 0px"
        cooldownMs={90}
        loader={
          <Loading
            variant="inline"
            size="sm"
            label="Cargando más productos…"
            delay={0}
            minDuration={220}
          />
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
                <InfiniteScrollOptimizedItem
                  key={itemKey}
                  animate={false}
                  optimizeGpuMemory={true}
                  estimatedHeight={340}
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
                </InfiniteScrollOptimizedItem>
              )
            })}
          </div>
        )}
      </InfiniteScroll>

      {hasMore && restantes > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onMostrarTodos}
            className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary cursor-pointer rounded-2xl border px-4 py-2 text-xs font-semibold shadow-2xs transition-colors"
          >
            Mostrar los {restantes} productos restantes
          </button>
        </div>
      )}
    </div>
  )
})
