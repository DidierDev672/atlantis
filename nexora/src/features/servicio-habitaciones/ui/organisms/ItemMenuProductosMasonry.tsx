import { Suspense, lazy, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator';
import { Loading, useDelayVisibility } from '../../../../shared/loading';
import { useItemMenuProductos } from '../../application/use-item-menu-productos';
import type { ItemMenuProducto } from '../../domain/item-menu';
import { ProductosMasonryNavbar } from '../molecules/ProductosMasonryNavbar';
import { ProductosVisualizacionNavbar } from '../molecules/ProductosVisualizacionNavbar';
import { ItemMenuProductosEmptyState } from '../molecules/ItemMenuProductosEmptyState';
import { ImageBalancerStatusBanner } from '../molecules/ImageBalancerStatusBanner';
import { ProductosCatalogoGrid } from '../molecules/ProductosCatalogoGrid';
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch';

// Carga perezosa bajo demanda: evita montar/descargar Modal y Drawer hasta que el usuario interactúe
const LazyItemMenuProductoModalDetalle = lazy(async () => {
  try {
    return await import('../molecules/ItemMenuProductoModalDetalle');
  } catch (error) {
    console.error('Error cargando modal de detalle de producto:', error);
    return { default: () => null };
  }
});

const LazyEditarProductoDrawer = lazy(async () => {
  try {
    const mod = await import('./EditarProductoDrawer');
    return { default: mod.EditarProductoDrawer };
  } catch (error) {
    console.error('Error cargando drawer de edición de producto:', error);
    return { default: () => null };
  }
});

export interface ItemMenuProductosMasonryProps {
  onAgregarNuevo?: () => void;
}

/**
 * Organismo: Catálogo principal de productos gastronómicos (`/item-menu`).
 * Mantiene `ImageBalancerStatusBanner` aislado, `ProductosVisualizacionNavbar` sin blur
 * y carga perezosa para modales/drawers evitando trabajo innecesario de GPU/RAM.
 */
export function ItemMenuProductosMasonry({
  onAgregarNuevo,
}: ItemMenuProductosMasonryProps) {
  const {
    productos,
    productosFiltrados,
    visibleProductos,
    categoriasMap,
    categoriaOptions,
    loading,
    organizando,
    feedback,
    setFeedback,
    busqueda,
    disponibilidad,
    categoriasSeleccionadas,
    ordenesSeleccionados,
    hasMore,
    handleLoadMore,
    mostrarTodos,
    cargarProductos,
    handleBusquedaChange,
    handleLimpiarBusqueda,
    handleDisponibilidadChange,
    handleCategoriasChange,
    handleOrdenesChange,
    aplicarProductoActualizado,
  } = useItemMenuProductos();

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<ItemMenuProducto | null>(null);
  const [productoParaEditar, setProductoParaEditar] =
    useState<ItemMenuProducto | null>(null);
  const [viewMode, setViewMode] = useState<LayoutViewMode>('grid');

  const showOrganizando = useDelayVisibility(organizando, {
    delay: 0,
    minDuration: 400,
  });
  const showLoading = useDelayVisibility(loading, {
    delay: 0,
    minDuration: 450,
  });

  const handleRefrescar = useCallback(() => {
    void cargarProductos();
  }, [cargarProductos]);

  const handleDismissFeedback = useCallback(() => {
    setFeedback(null);
  }, [setFeedback]);

  const handleCerrarDetalle = useCallback(() => {
    setProductoSeleccionado(null);
  }, []);

  const handleCerrarEditar = useCallback(() => {
    setProductoParaEditar(null);
  }, []);

  const isOverlayLoading = showOrganizando || (showLoading && productos.length > 0);

  return (
    <div className="space-y-6">
      <ProductosMasonryNavbar
        busqueda={busqueda}
        disponibilidad={disponibilidad}
        categoriasSeleccionadas={categoriasSeleccionadas}
        categoriaOptions={categoriaOptions}
        ordenesSeleccionados={ordenesSeleccionados}
        totalProductos={productos.length}
        loading={loading}
        onBusquedaChange={handleBusquedaChange}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        onDisponibilidadChange={handleDisponibilidadChange}
        onCategoriasChange={handleCategoriasChange}
        onOrdenesChange={handleOrdenesChange}
        onRefrescar={handleRefrescar}
        onAgregarNuevo={onAgregarNuevo}
      />

      <StatusCodeAlert
        validation={feedback}
        dismissible
        onClose={handleDismissFeedback}
        actions={
          <button
            type="button"
            onClick={handleRefrescar}
            disabled={loading}
            className="border-line bg-panel text-ink hover:border-primary/40 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              spin={loading}
              className="size-3"
            />
            <span>Reintentar</span>
          </button>
        }
      />

      {/* Estado aislado del balanceador: emitSnapshot() no re-renderiza este organismo */}
      <ImageBalancerStatusBanner suppressed={loading} />

      {loading && productos.length === 0 ? (
        <div className="border-line bg-panel flex min-h-[260px] flex-col items-center justify-center rounded-3xl border shadow-xs">
          <Loading
            visible={loading || showLoading}
            variant="block"
            size="lg"
            label="Cargando productos del menú…"
            description="Consultando catálogo (/item-menu)"
            delay={0}
            minDuration={450}
          />
        </div>
      ) : (
        <div className="relative rounded-3xl">
          {isOverlayLoading && (
            <Loading
              visible={true}
              variant="overlay"
              size="md"
              label={
                organizando
                  ? 'Organizando productos gastronómicos…'
                  : 'Actualizando productos (/item-menu)…'
              }
              description={
                organizando
                  ? 'Reordenando carta según la opción seleccionada'
                  : 'Consultando catálogo (/item-menu)'
              }
              delay={0}
              minDuration={400}
            />
          )}

          {productosFiltrados.length === 0 ? (
            <ItemMenuProductosEmptyState
              totalProductos={productos.length}
              onAgregarNuevo={onAgregarNuevo}
            />
          ) : (
            <ProductosCatalogoGrid
              productos={visibleProductos}
              totalFiltrados={productosFiltrados.length}
              viewMode={viewMode}
              categoriasMap={categoriasMap}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onMostrarTodos={mostrarTodos}
              onVerDetalle={setProductoSeleccionado}
              onEditar={setProductoParaEditar}
            />
          )}
        </div>
      )}

      {productoSeleccionado && (
        <Suspense fallback={null}>
          <LazyItemMenuProductoModalDetalle
            producto={productoSeleccionado}
            onClose={handleCerrarDetalle}
          />
        </Suspense>
      )}

      {productoParaEditar && (
        <Suspense fallback={null}>
          <LazyEditarProductoDrawer
            producto={productoParaEditar}
            onClose={handleCerrarEditar}
            onProductoActualizado={aplicarProductoActualizado}
          />
        </Suspense>
      )}

      <ProductosVisualizacionNavbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
}
