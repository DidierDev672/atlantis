import { Suspense, lazy, useCallback, useState, type ComponentProps, type ComponentType } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faUtensils,
  faBowlFood,
  faClipboardList,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { slideIn } from '../../../../design-tokens/motion';
import { Loading } from '../../../../shared/loading';
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch';
import { ItemMenuProductosMasonry } from '../organisms/ItemMenuProductosMasonry';
import type { AgregarProductoDrawerProps } from '../organisms/AgregarProductoDrawer';
import type { RegistrarCategoriaDrawerProps } from '../organisms/RegistrarCategoriaDrawer';
import type { CarritoProductosDrawerProps } from '../organisms/CarritoProductosDrawer';
import { CarritoFlotanteFab } from '../atoms/CarritoFlotanteFab';
import { useCarritoStore } from '../../application/carrito-store';
import {
  invalidarCacheCategoriasMenu,
  invalidarCacheProductosMenu,
} from '../../infrastructure/catalogo-productos-cache';
import { invalidarPedidosServicioCache } from '../../infrastructure/pedidos-cache';
import type { MenuCategoria } from '../../domain/menu-categoria';

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
  () => import('../organisms/MenuCategoriasGrid').then((m) => m.MenuCategoriasGrid),
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

const LazyRegistrarCategoriaDrawer = lazyWithFallback<RegistrarCategoriaDrawerProps>(
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

type VistaActiva = 'catalogo' | 'productos' | 'nuevo' | 'pedidos';

interface NavTabItem {
  id: VistaActiva;
  label: string;
  icon: IconDefinition;
}

const NAV_ITEMS: NavTabItem[] = [
  { id: 'catalogo', label: 'Categorías', icon: faUtensils },
  { id: 'productos', label: 'Productos', icon: faBowlFood },
  { id: 'pedidos', label: 'Historial de Ventas', icon: faClipboardList },
  { id: 'nuevo', label: 'Nueva Categoría', icon: faPlus },
];

export function MenuServiciosHabitacionPage() {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('productos');
  const [visitedTabs, setVisitedTabs] = useState<VistaActiva[]>(['productos']);
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

  const handleCambiarVista = useCallback((vista: VistaActiva) => {
    setVistaActiva(vista);
    setVisitedTabs((prev) => (prev.includes(vista) ? prev : [...prev, vista]));
  }, []);

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
      console.error('Error al invalidar caché tras registrar producto:', error);
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

  const handleCategoriaGuardadaDrawer = useCallback(() => {
    try {
      invalidarCacheProductosMenu();
      invalidarCacheCategoriasMenu();
      setCategoriasRefreshVersion((prev) => prev + 1);
    } catch (error) {
      console.error('Error al refrescar categorías tras registro:', error);
    }
  }, []);

  const tabFallback = (
    <div className="border-line bg-panel flex min-h-[220px] items-center justify-center rounded-3xl border">
      <Loading visible={true} variant="inline" size="sm" label="Cargando vista…" delay={0} minDuration={0} />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Navbar flotante y botón de carrito en la parte superior */}
      <div className="sticky top-20 z-20 flex flex-wrap items-center justify-end gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <div className="hidden lg:block" aria-hidden="true" />

        <motion.nav
          aria-label="Navegación de servicios a la habitación"
          variants={slideIn}
          initial="hidden"
          animate="visible"
          className="border-line/80 bg-panel mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border p-1.5 shadow-lg"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = vistaActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCambiarVista(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-ink-muted hover:bg-canvas/70 hover:text-ink'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="size-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </motion.nav>

        <div className="flex justify-end">
          <CarritoFlotanteFab
            totalArticulos={totalArticulos}
            onClick={() => setIsCarritoDrawerOpen(true)}
          />
        </div>
      </div>

      {/* 2. Contenido según la vista activa (conserva montadas las pestañas visitadas para evitar re-fetches al cambiar de tab) */}
      {visitedTabs.includes('catalogo') && (
        <div
          className={vistaActiva === 'catalogo' ? 'block' : 'hidden'}
          aria-hidden={vistaActiva !== 'catalogo'}
        >
          <Suspense fallback={tabFallback}>
            <LazyMenuCategoriasGrid
              viewMode={viewModeCategorias}
              onViewModeChange={setViewModeCategorias}
              refreshVersion={categoriasRefreshVersion}
              onNuevoRegistro={handleAbrirDrawerCategoria}
              onAgregarProducto={handleAbrirDrawerProducto}
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
            onAgregarNuevo={handleAbrirDrawerNuevoProducto}
          />
        </div>
      )}

      {visitedTabs.includes('pedidos') && (
        <div
          className={vistaActiva === 'pedidos' ? 'block' : 'hidden'}
          aria-hidden={vistaActiva !== 'pedidos'}
        >
          <Suspense fallback={tabFallback}>
            <LazyPedidosServicioHabitacionOrganism
              refreshTrigger={pedidosRefreshVersion}
              onIrAProductos={() => handleCambiarVista('productos')}
              onIrACarrito={() => setIsCarritoDrawerOpen(true)}
            />
          </Suspense>
        </div>
      )}

      {visitedTabs.includes('nuevo') && (
        <div
          className={vistaActiva === 'nuevo' ? 'mx-auto block max-w-4xl' : 'hidden'}
          aria-hidden={vistaActiva !== 'nuevo'}
        >
          <Suspense fallback={tabFallback}>
            <LazyFormularioServicioHabitacionCard
              onCategoriaGuardada={handleCategoriaGuardadaDrawer}
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
            onCategoriaGuardada={handleCategoriaGuardadaDrawer}
          />
        </Suspense>
      )}

      {isCarritoDrawerOpen && (
        <Suspense fallback={null}>
          <LazyCarritoProductosDrawer
            isOpen={isCarritoDrawerOpen}
            onClose={() => setIsCarritoDrawerOpen(false)}
            onPedidoConfirmado={() => {
              setIsCarritoDrawerOpen(false);
              invalidarPedidosServicioCache();
              setPedidosRefreshVersion((prev) => prev + 1);
              handleCambiarVista('pedidos');
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
