import { memo } from 'react'
import { InfiniteScroll, InfiniteScrollEnd } from '../../../../shared/ui'
import type { MenuCategoria } from '../../domain/menu-categoria'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import { VirtualizedCardSlot } from '../atoms/VirtualizedCardSlot'
import { CategoriasMasonryColumnsLayout } from './CategoriasMasonryColumnsLayout'
import { MenuCategoriaCard } from './MenuCategoriaCard'

export interface CategoriasCatalogoGridProps {
  categorias: ReadonlyArray<MenuCategoria>
  totalFiltradas: number
  viewMode: LayoutViewMode
  hasMore: boolean
  onLoadMore: () => void
  onMostrarCincoMas: () => void
  onVerDetalle: (categoria: MenuCategoria) => void
  onVerProductos: (categoria: MenuCategoria) => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

/**
 * Molécula: Contenedor progresivo y virtualizado del catálogo de categorías.
 * Usa `VirtualizedCardSlot` para desmontar nodos DOM fuera de pantalla,
 * loader ligero sin SaturnLoader en cada lote, y avance incremental de +5 categorías.
 */
export const CategoriasCatalogoGrid = memo(function CategoriasCatalogoGrid({
  categorias,
  totalFiltradas,
  viewMode,
  hasMore,
  onLoadMore,
  onMostrarCincoMas,
  onVerDetalle,
  onVerProductos,
  onAgregarProducto,
}: CategoriasCatalogoGridProps) {
  const restantes = Math.max(0, totalFiltradas - categorias.length)
  const siguienteBloque = Math.min(5, restantes)

  const handleMostrarCincoMasClick = () => {
    try {
      onMostrarCincoMas()
    } catch (error) {
      console.error('Error al cargar el siguiente lote de categorías:', error)
    }
  }

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
              Cargando más categorías…
            </span>
          </div>
        }
        endMessage={
          <InfiniteScrollEnd
            label={`Has explorado las ${totalFiltradas} ${
              totalFiltradas === 1 ? 'categoría' : 'categorías'
            } de Room Service.`}
          />
        }
      >
        {viewMode === 'masonry' ? (
          <CategoriasMasonryColumnsLayout
            categorias={categorias}
            onVerDetalle={onVerDetalle}
            onVerProductos={onVerProductos}
            onAgregarProducto={onAgregarProducto}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categorias.map((item, idx) => {
              const catKey = item.id || `${item.name}-${idx}`

              return (
                <VirtualizedCardSlot
                  key={catKey}
                  estimatedHeight={300}
                  className="h-full w-full"
                >
                  <MenuCategoriaCard
                    categoria={item}
                    index={idx}
                    viewMode="grid"
                    onVerDetalle={onVerDetalle}
                    onVerProductos={onVerProductos}
                    onAgregarProducto={onAgregarProducto}
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
            onClick={handleMostrarCincoMasClick}
            className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary cursor-pointer rounded-2xl border px-4 py-2 text-xs font-semibold shadow-2xs transition-colors"
          >
            Mostrar {siguienteBloque} {siguienteBloque === 1 ? 'categoría más' : 'categorías más'} (
            {restantes} {restantes === 1 ? 'restante' : 'restantes'})
          </button>
        </div>
      )}
    </div>
  )
})
