import { memo, useMemo } from 'react'
import { InfiniteScrollOptimizedItem } from '../../../../shared/ui'
import {
  resolverCategoriaDeProducto,
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
} from '../../domain/item-menu'
import { useResponsiveColumns } from '../../application/use-responsive-columns'
import { ItemMenuProductoCard } from './ItemMenuProductoCard'

export interface ProductosMasonryColumnsLayoutProps {
  productos: ReadonlyArray<ItemMenuProducto>
  categoriasMap: ReadonlyMap<string, CategoriaVinculadaInfo>
  onVerDetalle: (producto: ItemMenuProducto) => void
  onEditar: (producto: ItemMenuProducto) => void
}

/**
 * Molécula: Disposición Masonry por columnas Flex/Grid independientes.
 * Sustituye CSS Multi-column (`columns-*`) para eliminar el recálculo de fragmentación
 * de columnas cuando `InfiniteScrollOptimizedItem` aplica `content-visibility: auto`.
 */
export const ProductosMasonryColumnsLayout = memo(
  function ProductosMasonryColumnsLayout({
    productos,
    categoriasMap,
    onVerDetalle,
    onEditar,
  }: ProductosMasonryColumnsLayoutProps) {
    const columnCount = useResponsiveColumns()

    const columnas = useMemo(() => {
      const buckets: Array<Array<{ item: ItemMenuProducto; index: number }>> =
        Array.from({ length: columnCount }, () => [])

      productos.forEach((item, index) => {
        buckets[index % columnCount].push({ item, index })
      })

      return buckets
    }, [productos, columnCount])

    return (
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {columnas.map((columna, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-6">
            {columna.map(({ item, index }) => {
              const itemKey =
                item.id || `${item.category_id || 'cat'}-${item.name}-${index}`

              return (
                <InfiniteScrollOptimizedItem
                  key={itemKey}
                  animate={false}
                  optimizeGpuMemory={true}
                  estimatedHeight={320}
                  className="w-full"
                >
                  <ItemMenuProductoCard
                    producto={item}
                    index={index}
                    viewMode="masonry"
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
        ))}
      </div>
    )
  }
)
