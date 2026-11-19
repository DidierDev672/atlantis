import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator';
import type { LoadingProps } from '../../../../shared/loading';
import { useItemMenuProductos } from '../../application/use-item-menu-productos';
import type { ItemMenuProducto } from '../../domain/item-menu';
import { ProductosMasonryNavbar } from '../molecules/ProductosMasonryNavbar';
import { ProductosVisualizacionNavbar } from '../molecules/ProductosVisualizacionNavbar';
import { ItemMenuProductosEmptyState } from '../molecules/ItemMenuProductosEmptyState';
import { ImageBalancerStatusBanner } from '../molecules/ImageBalancerStatusBanner';
import { ProductosCatalogoGrid } from '../molecules/ProductosCatalogoGrid';
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch';

// Carga perezosa bajo demanda: evita montar/descargar Loading pesado, Modal y Drawer cuando no se requieren
const LazySharedLoading = lazy<ComponentType<LoadingProps>>(async () => {
  try {
    const mod = await import('../../../../shared/loading');
    return { default: mod.Loading };
  } catch (error) {
    console.error('Error cargando componente Loading:', error);
    return { default: () => null };
  }
});

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

type AgregarProductoDrawerProps = ComponentProps<
  typeof import('./AgregarProductoDrawer')['AgregarProductoDrawer']
>;

const LazyAgregarProductoDrawer = lazy<ComponentType<AgregarProductoDrawerProps>>(
  async () => {
    try {
      const mod = await import('./AgregarProductoDrawer');
      return { default: mod.AgregarProductoDrawer };
    } catch (error) {
      console.error('Error cargando drawer de alta de producto:', error);
      const Fallback: ComponentType<AgregarProductoDrawerProps> = () => null;
      return { default: Fallback };
    }
  }
);

export interface ItemMenuProductosMasonryProps {
  onAgregarNuevo?: () => void;
  /** Incrementar para refrescar el catálogo tras registrar un producto externamente */
  refreshVersion?: number;
}

/**
 * Organismo: Catálogo principal de productos gastronómicos (`/item-menu`).
 * Sin `backdrop-blur` en refresco manual, con virtualización compartida
 * y carga perezosa para loader inicial, modal y drawer.
 */
export function ItemMenuProductosMasonry({
  onAgregarNuevo,
  refreshVersion = 0,
}: ItemMenuProductosMasonryProps) {
  const {
    productos,
    productosFiltrados,
    visibleProductos,
    categoriasMap,
    categoriaOptions,
    loading,
    feedback,
    setFeedback,
    busqueda,
    disponibilidad,
    categoriasSeleccionadas,
    ordenesSeleccionados,
    hasMore,
    handleLoadMore,
    mostrarCincoMas,
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
  const [isAgregarDrawerOpen, setIsAgregarDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<LayoutViewMode>('grid');
  const lastRefreshVersionRef = useRef(refreshVersion);

  useEffect(() => {
    if (refreshVersion <= 0 || refreshVersion === lastRefreshVersionRef.current) {
      return;
    }
    lastRefreshVersionRef.current = refreshVersion;
    void Promise.resolve().then(() => cargarProductos());
  }, [cargarProductos, refreshVersion]);

  const handleRefrescar = useCallback(() => {
    void cargarProductos();
  }, [cargarProductos]);

  const handleAbrirAgregarProducto = useCallback(() => {
    try {
      if (onAgregarNuevo) {
        onAgregarNuevo();
      } else {
        setIsAgregarDrawerOpen(true);
      }
    } catch (error) {
      console.error('Error al abrir drawer de agregar producto:', error);
    }
  }, [onAgregarNuevo]);

  const handleCerrarAgregarProducto = useCallback(() => {
    setIsAgregarDrawerOpen(false);
  }, []);

  const handleProductoCreadoLocal = useCallback(() => {
    try {
      void cargarProductos();
    } catch (error) {
      console.error('Error al recargar catálogo tras crear producto:', error);
    }
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
        onAgregarNuevo={handleAbrirAgregarProducto}
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
          <Suspense
            fallback={
              <span className="text-ink-muted text-xs font-medium">
                Cargando productos del menú…
              </span>
            }
          >
            <LazySharedLoading
              visible={true}
              variant="block"
              size="lg"
              label="Cargando productos del menú…"
              description="Consultando catálogo (/item-menu)"
              delay={0}
              minDuration={0}
            />
          </Suspense>
        </div>
      ) : (
        <div className="space-y-4 rounded-3xl">
          {/* Refresco manual ligero sin backdrop-blur-sm ni SaturnLoader sobre toda la grilla */}
          {loading && productos.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="border-line bg-panel text-ink-muted flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold shadow-2xs"
            >
              <FontAwesomeIcon
                icon={faArrowsRotate}
                spin
                className="text-primary size-3.5"
                aria-hidden="true"
              />
              <span>Actualizando catálogo de productos…</span>
            </div>
          )}

          {productosFiltrados.length === 0 ? (
            <ItemMenuProductosEmptyState
              totalProductos={productos.length}
              onAgregarNuevo={handleAbrirAgregarProducto}
            />
          ) : (
            <ProductosCatalogoGrid
              productos={visibleProductos}
              totalFiltrados={productosFiltrados.length}
              viewMode={viewMode}
              categoriasMap={categoriasMap}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onMostrarCincoMas={mostrarCincoMas}
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

      {isAgregarDrawerOpen && (
        <Suspense fallback={null}>
          <LazyAgregarProductoDrawer
            categoria={null}
            isOpen={isAgregarDrawerOpen}
            onClose={handleCerrarAgregarProducto}
            onProductoGuardado={handleProductoCreadoLocal}
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
