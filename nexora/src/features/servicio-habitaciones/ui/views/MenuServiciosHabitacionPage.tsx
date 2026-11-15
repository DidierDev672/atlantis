import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faUtensils,
  faBowlFood,
  faClipboardList,
  faPlus,
  faListCheck,
} from '@fortawesome/free-solid-svg-icons';
import { slideIn, fadeIn } from '../../../../design-tokens/motion';
import { MenuCategoriasGrid } from '../organisms/MenuCategoriasGrid';
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch';
import { ItemMenuProductosMasonry } from '../organisms/ItemMenuProductosMasonry';
import { FormularioServicioHabitacionCard } from '../organisms/FormularioServicioHabitacionCard';
import { FormularioAgregarProductoCard } from '../organisms/FormularioAgregarProductoCard';
import { PedidosServicioHabitacionOrganism } from '../organisms/PedidosServicioHabitacionOrganism';
import { EstadoPedidoAsignacionesOrganism } from '../organisms/EstadoPedidoAsignacionesOrganism';
import { CarritoFlotanteFab } from '../atoms/CarritoFlotanteFab';
import { CarritoProductosDrawer } from '../organisms/CarritoProductosDrawer';
import { useCarritoStore } from '../../application/carrito-store';
import type { MenuCategoria } from '../../domain/menu-categoria';

type VistaActiva =
  | 'catalogo'
  | 'productos'
  | 'nuevo'
  | 'agregar-producto'
  | 'pedidos'
  | 'estado-pedido';

interface NavTabItem {
  id: Exclude<VistaActiva, 'agregar-producto'>;
  label: string;
  icon: IconDefinition;
}

const NAV_ITEMS: NavTabItem[] = [
  { id: 'catalogo', label: 'Categoría', icon: faUtensils },
  { id: 'productos', label: 'Producto', icon: faBowlFood },
  { id: 'pedidos', label: 'Pedido', icon: faClipboardList },
  { id: 'estado-pedido', label: 'Estado Pedido', icon: faListCheck },
  { id: 'nuevo', label: 'Nueva Categoría', icon: faPlus },
];

export function MenuServiciosHabitacionPage() {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('productos');
  const [viewModeCategorias, setViewModeCategorias] =
    useState<LayoutViewMode>('grid');
  const [categoriaParaProducto, setCategoriaParaProducto] =
    useState<MenuCategoria | null>(null);
  const [isCarritoDrawerOpen, setIsCarritoDrawerOpen] = useState(false);

  // Reactividad del total de productos en el carrito de Zustand
  const totalArticulos = useCarritoStore((s) =>
    s.items.reduce((acc, curr) => acc + curr.cantidad, 0)
  );

  const handleCambiarVista = (vista: VistaActiva) => {
    if (vista !== 'agregar-producto') {
      setCategoriaParaProducto(null);
    }
    setVistaActiva(vista);
  };

  const handleIrAgregarProducto = (cat?: MenuCategoria) => {
    setCategoriaParaProducto(cat ?? null);
    setVistaActiva('agregar-producto');
  };

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
          className="border-line/80 bg-panel/85 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border p-1.5 shadow-lg backdrop-blur-md"
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

          {vistaActiva === 'agregar-producto' && (
            <span
              aria-current="page"
              className="bg-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              <span>✨ Alta de Producto</span>
            </span>
          )}
        </motion.nav>

        <div className="flex justify-end">
          <CarritoFlotanteFab
            totalArticulos={totalArticulos}
            onClick={() => setIsCarritoDrawerOpen(true)}
          />
        </div>
      </div>

      {/* 2. Contenido según la vista activa */}
      <AnimatePresence mode="wait">
        {vistaActiva === 'catalogo' ? (
          <motion.div
            key="catalogo"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <MenuCategoriasGrid
              viewMode={viewModeCategorias}
              onViewModeChange={setViewModeCategorias}
              onNuevoRegistro={() => handleCambiarVista('nuevo')}
              onAgregarProducto={(cat) => handleIrAgregarProducto(cat)}
            />
          </motion.div>
        ) : vistaActiva === 'productos' ? (
          <motion.div
            key="productos"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ItemMenuProductosMasonry
              onAgregarNuevo={() => handleIrAgregarProducto()}
            />
          </motion.div>
        ) : vistaActiva === 'pedidos' ? (
          <motion.div
            key="pedidos"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PedidosServicioHabitacionOrganism
              onIrAProductos={() => handleCambiarVista('productos')}
              onIrACarrito={() => setIsCarritoDrawerOpen(true)}
              onIrAEstadoPedido={() => handleCambiarVista('estado-pedido')}
            />
          </motion.div>
        ) : vistaActiva === 'estado-pedido' ? (
          <motion.div
            key="estado-pedido"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <EstadoPedidoAsignacionesOrganism
              onIrAPedidos={() => handleCambiarVista('pedidos')}
              onIrAProductos={() => handleCambiarVista('productos')}
            />
          </motion.div>
        ) : vistaActiva === 'nuevo' ? (
          <motion.div
            key="nuevo"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mx-auto max-w-4xl"
          >
            <FormularioServicioHabitacionCard />
          </motion.div>
        ) : (
          <motion.div
            key="agregar-producto"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mx-auto max-w-4xl"
          >
            <FormularioAgregarProductoCard
              categoriaInicial={categoriaParaProducto}
              onProductoGuardado={() => {
                // Se mantiene en el formulario para permitir seguir registrando información
              }}
              onCancelar={() => handleCambiarVista('productos')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer lateral de productos del carrito con botón "Confirmar y Enviar a Cocina" */}
      <CarritoProductosDrawer
        isOpen={isCarritoDrawerOpen}
        onClose={() => setIsCarritoDrawerOpen(false)}
        onPedidoConfirmado={() => handleCambiarVista('pedidos')}
      />
    </div>
  );
}
