import { memo, useMemo } from 'react'
import { useResponsiveColumns } from '../../application/use-responsive-columns'
import type { MenuCategoria } from '../../domain/menu-categoria'
import { VirtualizedCardSlot } from '../atoms/VirtualizedCardSlot'
import { MenuCategoriaCard } from './MenuCategoriaCard'

export interface CategoriasMasonryColumnsLayoutProps {
  categorias: ReadonlyArray<MenuCategoria>
  onVerDetalle: (categoria: MenuCategoria) => void
  onVerProductos: (categoria: MenuCategoria) => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

const GRID_COLUMNS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

/**
 * Molécula: Distribuye las categorías de forma determinista en columnas flexibles
 * sin CSS Multi-column (`columns-*`) para evitar recalcular geometría en scroll o filtrado.
 * Cada tarjeta queda envuelta en `VirtualizedCardSlot`.
 */
export const CategoriasMasonryColumnsLayout = memo(function CategoriasMasonryColumnsLayout({
  categorias,
  onVerDetalle,
  onVerProductos,
  onAgregarProducto,
}: CategoriasMasonryColumnsLayoutProps) {
  const columnCount = useResponsiveColumns()

  const columnsBuckets = useMemo(() => {
    const buckets: Array<Array<{ item: MenuCategoria; index: number }>> = Array.from(
      { length: columnCount },
      () => [],
    )
    categorias.forEach((item, index) => {
      buckets[index % columnCount].push({ item, index })
    })
    return buckets
  }, [categorias, columnCount])

  const colsClass = GRID_COLUMNS_CLASS[columnCount] ?? 'grid-cols-4'

  return (
    <div className={`grid items-start gap-6 ${colsClass}`}>
      {columnsBuckets.map((bucket, colIdx) => (
        <div key={`masonry-cat-col-${columnCount}-${colIdx}`} className="flex flex-col gap-6">
          {bucket.map(({ item, index }) => {
            const catKey = item.id || `${item.name}-${index}`
            return (
              <VirtualizedCardSlot
                key={catKey}
                estimatedHeight={340}
                className="w-full"
              >
                <MenuCategoriaCard
                  categoria={item}
                  index={index}
                  viewMode="masonry"
                  onVerDetalle={onVerDetalle}
                  onVerProductos={onVerProductos}
                  onAgregarProducto={onAgregarProducto}
                />
              </VirtualizedCardSlot>
            )
          })}
        </div>
      ))}
    </div>
  )
})
