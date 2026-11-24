import { Suspense, lazy, memo, type ComponentType } from 'react'
import { Loading, type LoadingProps } from '../../../../shared/loading'
import type { MenuCategoria } from '../../domain/menu-categoria'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import { CategoriasCatalogoGrid } from './CategoriasCatalogoGrid'
import { MenuCategoriasEmptyState } from './MenuCategoriasEmptyState'

const LazySharedLoading = lazy<ComponentType<LoadingProps>>(async () => {
  try {
    const mod = await import('../../../../shared/loading')
    return { default: mod.Loading }
  } catch (error) {
    console.error('Error al cargar Loading de /shared/loading:', error)
    return { default: Loading }
  }
})

export interface MenuCategoriasContenidoProps {
  loading: boolean
  totalCategorias: number
  categoriasFiltradasCount: number
  visibleCategorias: ReadonlyArray<MenuCategoria>
  viewMode: LayoutViewMode
  hasMore: boolean
  onLoadMore: () => void
  onMostrarCincoMas: () => void
  onVerDetalle: (categoria: MenuCategoria) => void
  onVerProductos: (categoria: MenuCategoria) => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
  onNuevoRegistro?: () => void
  onRecargar: () => void
  onResetFiltros: () => void
}

/**
 * Molécula: Orquesta la vista de contenido de categorías (carga inicial lazy,
 * aviso ligero de actualización, grilla virtualizada o estado vacío).
 */
export const MenuCategoriasContenido = memo(function MenuCategoriasContenido({
  loading,
  totalCategorias,
  categoriasFiltradasCount,
  visibleCategorias,
  viewMode,
  hasMore,
  onLoadMore,
  onMostrarCincoMas,
  onVerDetalle,
  onVerProductos,
  onAgregarProducto,
  onNuevoRegistro,
  onRecargar,
  onResetFiltros,
}: MenuCategoriasContenidoProps) {
  if (loading && totalCategorias === 0) {
    return (
      <div className="border-line bg-panel flex min-h-[260px] flex-col items-center justify-center rounded-3xl border shadow-xs">
        <Suspense
          fallback={
            <span className="text-ink-muted text-sm font-medium">
              Cargando categorías de la carta…
            </span>
          }
        >
          <LazySharedLoading
            visible={true}
            variant="block"
            size="lg"
            label="Cargando categorías de la carta…"
            description="Consultando menú (/menu-category)"
            delay={0}
            minDuration={300}
          />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-3xl">
      {loading && totalCategorias > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="border-line bg-panel text-ink-muted flex items-center justify-center rounded-2xl border px-4 py-2 text-xs font-medium shadow-2xs"
        >
          Actualizando categorías (/menu-category)…
        </div>
      )}

      {categoriasFiltradasCount > 0 ? (
        <CategoriasCatalogoGrid
          categorias={visibleCategorias}
          totalFiltradas={categoriasFiltradasCount}
          viewMode={viewMode}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onMostrarCincoMas={onMostrarCincoMas}
          onVerDetalle={onVerDetalle}
          onVerProductos={onVerProductos}
          onAgregarProducto={onAgregarProducto}
        />
      ) : (
        <MenuCategoriasEmptyState
          totalCategorias={totalCategorias}
          loading={loading}
          onNuevoRegistro={onNuevoRegistro}
          onRecargar={onRecargar}
          onResetFiltros={onResetFiltros}
        />
      )}
    </div>
  )
})
