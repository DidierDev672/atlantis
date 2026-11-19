import { useState, useSyncExternalStore } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import {
  getImageLoadBalancerSnapshot,
  subscribeImageLoadBalancer,
} from '../../infrastructure/image-load-balancer';
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator';
import { Loading, useDelayVisibility } from '../../../../shared/loading';
import { useItemMenuProductos } from '../../application/use-item-menu-productos';
import {
  resolverCategoriaDeProducto,
  type ItemMenuProducto,
} from '../../domain/item-menu';
import { ItemMenuProductoCard } from '../molecules/ItemMenuProductoCard';
import { ItemMenuProductoModalDetalle } from '../molecules/ItemMenuProductoModalDetalle';
import { ProductosMasonryNavbar } from '../molecules/ProductosMasonryNavbar';
import { ProductosVisualizacionNavbar } from '../molecules/ProductosVisualizacionNavbar';
import { ItemMenuProductosEmptyState } from '../molecules/ItemMenuProductosEmptyState';
import { EditarProductoDrawer } from './EditarProductoDrawer';
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch';
import {
  InfiniteScroll,
  InfiniteScrollAnimatedItem,
  InfiniteScrollEnd,
} from '../../../../shared/ui';

export interface ItemMenuProductosMasonryProps {
  onAgregarNuevo?: () => void;
}

export function ItemMenuProductosMasonry({
  onAgregarNuevo,
}: ItemMenuProductosMasonryProps) {
  const {
    productos,
    productosFiltrados,
    visibleProductos,
    categoriasMap,
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
  const imageBalancer = useSyncExternalStore(
    subscribeImageLoadBalancer,
    getImageLoadBalancerSnapshot
  );
  const showImageBalancerLoading = useDelayVisibility(
    imageBalancer.isRunning && !loading,
    { delay: 0, minDuration: 350 }
  );

  return (
    <div className="space-y-6">
      {/* Barra Superior Atomic Design: Buscador, Filtros y Acciones */}
      <ProductosMasonryNavbar
        busqueda={busqueda}
        disponibilidad={disponibilidad}
        categoriasSeleccionadas={categoriasSeleccionadas}
        ordenesSeleccionados={ordenesSeleccionados}
        totalProductos={productos.length}
        loading={loading}
        onBusquedaChange={handleBusquedaChange}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        onDisponibilidadChange={handleDisponibilidadChange}
        onCategoriasChange={handleCategoriasChange}
        onOrdenesChange={handleOrdenesChange}
        onRefrescar={() => void cargarProductos()}
        onAgregarNuevo={onAgregarNuevo}
      />

      {/* Alerta automática basada en status-code-validator.ts (silenciosa en 200 OK) */}
      <StatusCodeAlert
        validation={feedback}
        dismissible
        onClose={() => setFeedback(null)}
        actions={
          <button
            type="button"
            onClick={() => void cargarProductos()}
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

      {/* Indicador visual del balanceador de cargas de imágenes (/shared/loading) */}
      {showImageBalancerLoading && (
        <div className="border-line bg-panel/90 flex items-center justify-center rounded-2xl border px-4 py-1.5 shadow-2xs backdrop-blur-xs">
          <Loading
            visible={true}
            variant="inline"
            size="sm"
            label={`Balanceando carga de imágenes (${imageBalancer.activeCount} activas · ${imageBalancer.queuedCount} en cola)…`}
            delay={0}
            minDuration={350}
          />
        </div>
      )}

      {/* Estado de Carga y Contenido con /shared/loading */}
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
          <Loading
            visible={showOrganizando || (showLoading && productos.length > 0)}
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

          {productosFiltrados.length === 0 ? (
            <ItemMenuProductosEmptyState
              totalProductos={productos.length}
              onAgregarNuevo={onAgregarNuevo}
            />
          ) : (
            <InfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={false}
              cooldownMs={180}
              animationVariant="slideUp"
              loader={
                <Loading
                  variant="inline"
                  size="sm"
                  label="Cargando más productos…"
                  delay={0}
                  minDuration={300}
                />
              }
              endMessage={
                <InfiniteScrollEnd label="Has visualizado todos los platillos y bebidas del menú de Room Service." />
              }
            >
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:break-inside-avoid'
                }
              >
                {visibleProductos.map((item, idx) => {
                  const itemKey =
                    item.id ||
                    `${item.category_id || 'cat'}-${item.name}-${idx}`;

                  return (
                    <InfiniteScrollAnimatedItem
                      key={itemKey}
                      variant="slideUp"
                      viewportMargin="-100px"
                      estimatedHeight={340}
                      className={
                        viewMode === 'grid'
                          ? 'h-full w-full'
                          : 'mb-6 break-inside-avoid'
                      }
                    >
                      <ItemMenuProductoCard
                        producto={item}
                        index={idx}
                        viewMode={viewMode}
                        categoriaInfo={resolverCategoriaDeProducto(
                          item.category_id,
                          categoriasMap
                        )}
                        onVerDetalle={setProductoSeleccionado}
                        onEditar={setProductoParaEditar}
                      />
                    </InfiniteScrollAnimatedItem>
                  );
                })}
              </div>
            </InfiniteScroll>
          )}
        </div>
      )}

      {/* Modal de Detalle al hacer clic en la fotografía del producto */}
      <ItemMenuProductoModalDetalle
        producto={productoSeleccionado}
        onClose={() => setProductoSeleccionado(null)}
      />

      {/* Drawer lateral para modificar las características del producto */}
      <EditarProductoDrawer
        producto={productoParaEditar}
        onClose={() => setProductoParaEditar(null)}
        onProductoActualizado={(updated) => {
          aplicarProductoActualizado(updated);
        }}
      />

      {/* Navbar flotante para alternar modo de visualización (Grid por defecto vs Masonry) */}
      <ProductosVisualizacionNavbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
}
