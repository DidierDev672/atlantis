import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useState,
  type ComponentProps,
  type ComponentType,
} from 'react';
import { Loading } from '../../../../shared/loading';
import { canManageMenuCatalog } from '../../../../shared/auth-storage';
import { useCarritoStore } from '../../application/carrito-store';
import type { MenuCategoria } from '../../domain/menu-categoria';
import {
  invalidarCacheCategoriasMenu,
  invalidarCacheProductosMenu,
} from '../../infrastructure/catalogo-productos-cache';
import { invalidarPedidosServicioCache } from '../../infrastructure/pedidos-cache';
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch';
import {
  MenuServiciosNavbar,
  type MenuServicioVistaActiva,
} from '../molecules/MenuServiciosNavbar';
import type { AgregarProductoDrawerProps } from '../organisms/AgregarProductoDrawer';
import type { CarritoProductosDrawerProps } from '../organisms/CarritoProductosDrawer';
import { ItemMenuProductosMasonry } from '../organisms/ItemMenuProductosMasonry';
import type { RegistrarCategoriaDrawerProps } from '../organisms/RegistrarCategoriaDrawer';

type MenuCategoriasGridProps = ComponentProps<
  typeof import('../organisms/MenuCategoriasGrid')['MenuCategoriasGrid']
>;
type PedidosServicioHabitacionOrganismProps = ComponentProps<
  typeof import('../organisms/PedidosServicioHabitacionOrganism')['PedidosServicioHabitacionOrganism']
>;
type FormularioServicioHabitacionCardProps = ComponentProps<
  typeof import('../organisms/FormularioServicioHabitacionCard')['FormularioServicioHabitacionCard']
>;

function lazyWithFallback<TProps extends object>(
  loader: () => Promise<ComponentType<TProps>>,
  label: string
) {
  return lazy<ComponentType<TProps>>(async () => {
    try {
      const Component = await loader();
      return { default: Component };
    } catch (error) {
      console.error(`Error cargando ${label}:`, error);
      return { default: () => null };
    }
  });
}

const LazyMenuCategoriasGrid = lazyWithFallback<MenuCategoriasGridProps>(
  () =>
    import('../organisms/MenuCategoriasGrid').then((m) => m.MenuCategoriasGrid),
  'vista de categorías'
);

const LazyPedidosServicioHabitacionOrganism =
  lazyWithFallback<PedidosServicioHabitacionOrganismProps>(
    () =>
      import('../organisms/PedidosServicioHabitacionOrganism').then(
        (m) => m.PedidosServicioHabitacionOrganism
      ),
    'historial de pedidos'
  );

const LazyFormularioServicioHabitacionCard =
  lazyWithFallback<FormularioServicioHabitacionCardProps>(
    () =>
      import('../organisms/FormularioServicioHabitacionCard').then(
        (m) => m.FormularioServicioHabitacionCard
      ),
    'formulario de categoría'
  );

const LazyAgregarProductoDrawer = lazyWithFallback<AgregarProductoDrawerProps>(
  () =>
    import('../organisms/AgregarProductoDrawer').then(
      (m) => m.AgregarProductoDrawer
    ),
  'drawer para agregar producto'
);

const LazyRegistrarCategoriaDrawer =
  lazyWithFallback<RegistrarCategoriaDrawerProps>(
    () =>
      import('../organisms/RegistrarCategoriaDrawer').then(
        (m) => m.RegistrarCategoriaDrawer
      ),
    'drawer para registrar categoría'
  );

const LazyCarritoProductosDrawer = lazyWithFallback<CarritoProductosDrawerProps>(
  () =>
    import('../organisms/CarritoProductosDrawer').then(
      (m) => m.CarritoProductosDrawer
    ),
  'drawer del carrito'
);

const TAB_FALLBACK = (
  <div className="border-line bg-panel flex min-h-[220px] items-center justify-center rounded-3xl border">
    <Loading
      visible={true}
      variant="inline"
      size="sm"
      label="Cargando vista…"
      delay={0}
      minDuration={0}
    />
  </div>
);

export const MenuServiciosHabitacionPage = memo(
  function MenuServiciosHabitacionPage() {
    const isCatalogAdmin = canManageMenuCatalog();

    const [vistaActiva, setVistaActiva] =
      useState<MenuServicioVistaActiva>('productos');
    const [visitedTabs, setVisitedTabs] = useState<MenuServicioVistaActiva[]>([
      'productos',
    ]);
    const [viewModeCategorias, setViewModeCategorias] =
      useState<LayoutViewMode>('grid');
    const [isAgregarDrawerOpen, setIsAgregarDrawerOpen] = useState(false);
    const [categoriaDrawerProducto, setCategoriaDrawerProducto] =
      useState<MenuCategoria | null>(null);
    const [productosRefreshVersion, setProductosRefreshVersion] = useState(0);
    const [isCategoriaDrawerOpen, setIsCategoriaDrawerOpen] = useState(false);
    const [categoriasRefreshVersion, setCategoriasRefreshVersion] = useState(0);
    const [pedidosRefreshVersion, setPedidosRefreshVersion] = useState(0);
    const [isCarritoDrawerOpen, setIsCarritoDrawerOpen] = useState(false);

    const totalArticulos = useCarritoStore((s) =>
      s.items.reduce((acc, curr) => acc + curr.cantidad, 0)
    );

    const handleCambiarVista = useCallback((vista: MenuServicioVistaActiva) => {
      try {
        setVistaActiva(vista);
        setVisitedTabs((prev) =>
          prev.includes(vista) ? prev : [...prev, vista]
        );
      } catch (error) {
        console.error('Error al cambiar pestaña de servicios:', error);
      }
    }, []);

    const handleIrAProductos = useCallback(() => {
      handleCambiarVista('productos');
    }, [handleCambiarVista]);

    const handleAbrirCarrito = useCallback(() => {
      setIsCarritoDrawerOpen(true);
    }, []);

    const handleCerrarCarrito = useCallback(() => {
      setIsCarritoDrawerOpen(false);
    }, []);

    const handlePedidoConfirmado = useCallback(() => {
      try {
        setIsCarritoDrawerOpen(false);
        invalidarPedidosServicioCache();
        setPedidosRefreshVersion((prev) => prev + 1);
        handleCambiarVista('pedidos');
      } catch (error) {
        console.error('Error al confirmar pedido en carrito:', error);
      }
    }, [handleCambiarVista]);

    const handleAbrirDrawerProducto = useCallback((cat?: MenuCategoria) => {
      try {
        setCategoriaDrawerProducto(cat ?? null);
        setIsAgregarDrawerOpen(true);
      } catch (error) {
        console.error('Error al abrir drawer de agregar producto:', error);
      }
    }, []);

    const handleAbrirDrawerNuevoProducto = useCallback(() => {
      handleAbrirDrawerProducto();
    }, [handleAbrirDrawerProducto]);

    const handleCerrarDrawerProducto = useCallback(() => {
      try {
        setIsAgregarDrawerOpen(false);
        setCategoriaDrawerProducto(null);
      } catch (error) {
        console.error('Error al cerrar drawer de agregar producto:', error);
      }
    }, []);

    const handleProductoGuardadoDrawer = useCallback(() => {
      try {
        invalidarCacheProductosMenu();
        setProductosRefreshVersion((prev) => prev + 1);
      } catch (error) {
        console.error(
          'Error al invalidar caché tras registrar producto:',
          error
        );
      }
    }, []);

    const handleAbrirDrawerCategoria = useCallback(() => {
      try {
        setIsCategoriaDrawerOpen(true);
      } catch (error) {
        console.error('Error al abrir drawer de registrar categoría:', error);
      }
    }, []);

    const handleCerrarDrawerCategoria = useCallback(() => {
      try {
        setIsCategoriaDrawerOpen(false);
      } catch (error) {
        console.error('Error al cerrar drawer de registrar categoría:', error);
      }
    }, []);

    const handleCategoriaGuardada = useCallback(() => {
      try {
        invalidarCacheProductosMenu();
        invalidarCacheCategoriasMenu();
        setCategoriasRefreshVersion((prev) => prev + 1);
      } catch (error) {
        console.error('Error al refrescar categorías tras registro:', error);
      }
    }, []);

    return (
      <div className="space-y-6 pb-12">
        <MenuServiciosNavbar
          vistaActiva={vistaActiva}
          totalArticulos={totalArticulos}
          onCambiarVista={handleCambiarVista}
          onAbrirCarrito={handleAbrirCarrito}
        />

        {visitedTabs.includes('catalogo') && (
          <div
            className={vistaActiva === 'catalogo' ? 'block' : 'hidden'}
            aria-hidden={vistaActiva !== 'catalogo'}
          >
            <Suspense fallback={TAB_FALLBACK}>
              <LazyMenuCategoriasGrid
                viewMode={viewModeCategorias}
                onViewModeChange={setViewModeCategorias}
                refreshVersion={categoriasRefreshVersion}
                onNuevoRegistro={handleAbrirDrawerCategoria}
                onAgregarProducto={
                  isCatalogAdmin ? handleAbrirDrawerProducto : undefined
                }
              />
            </Suspense>
          </div>
        )}

        {visitedTabs.includes('productos') && (
          <div
            className={vistaActiva === 'productos' ? 'block' : 'hidden'}
            aria-hidden={vistaActiva !== 'productos'}
          >
            <ItemMenuProductosMasonry
              refreshVersion={productosRefreshVersion}
              onAgregarNuevo={
                isCatalogAdmin ? handleAbrirDrawerNuevoProducto : undefined
              }
              canEditCatalog={isCatalogAdmin}
            />
          </div>
        )}

        {visitedTabs.includes('pedidos') && (
          <div
            className={vistaActiva === 'pedidos' ? 'block' : 'hidden'}
            aria-hidden={vistaActiva !== 'pedidos'}
          >
            <Suspense fallback={TAB_FALLBACK}>
              <LazyPedidosServicioHabitacionOrganism
                refreshTrigger={pedidosRefreshVersion}
                onIrAProductos={handleIrAProductos}
                onIrACarrito={handleAbrirCarrito}
              />
            </Suspense>
          </div>
        )}

        {visitedTabs.includes('nuevo') && (
          <div
            className={
              vistaActiva === 'nuevo' ? 'mx-auto block max-w-4xl' : 'hidden'
            }
            aria-hidden={vistaActiva !== 'nuevo'}
          >
            <Suspense fallback={TAB_FALLBACK}>
              <LazyFormularioServicioHabitacionCard
                onCategoriaGuardada={handleCategoriaGuardada}
              />
            </Suspense>
          </div>
        )}

        {isAgregarDrawerOpen && (
          <Suspense fallback={null}>
            <LazyAgregarProductoDrawer
              isOpen={isAgregarDrawerOpen}
              categoria={categoriaDrawerProducto}
              onClose={handleCerrarDrawerProducto}
              onProductoGuardado={handleProductoGuardadoDrawer}
            />
          </Suspense>
        )}

        {isCategoriaDrawerOpen && (
          <Suspense fallback={null}>
            <LazyRegistrarCategoriaDrawer
              isOpen={isCategoriaDrawerOpen}
              onClose={handleCerrarDrawerCategoria}
              onCategoriaGuardada={handleCategoriaGuardada}
            />
          </Suspense>
        )}

        {isCarritoDrawerOpen && (
          <Suspense fallback={null}>
            <LazyCarritoProductosDrawer
              isOpen={isCarritoDrawerOpen}
              onClose={handleCerrarCarrito}
              onPedidoConfirmado={handlePedidoConfirmado}
            />
          </Suspense>
        )}
      </div>
    );
  }
);

export default MenuServiciosHabitacionPage;
