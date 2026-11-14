import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faUtensils,
  faBowlFood,
  faCartShopping,
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
import { CarritoServicioHabitacionOrganism } from '../organisms/CarritoServicioHabitacionOrganism';
import { PedidosServicioHabitacionOrganism } from '../organisms/PedidosServicioHabitacionOrganism';
import { EstadoPedidoAsignacionesOrganism } from '../organisms/EstadoPedidoAsignacionesOrganism';
import { useCarritoStore } from '../../application/carrito-store';
import type { MenuCategoria } from '../../domain/menu-categoria';

type VistaActiva =
  | 'catalogo'
  | 'productos'
  | 'nuevo'
  | 'agregar-producto'
  | 'carrito'
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
  { id: 'carrito', label: 'Carrito', icon: faCartShopping },
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
      {/* 1. Navbar flotante sin header contenedor */}
      <motion.nav
        aria-label="Navegación de servicios a la habitación"
        variants={slideIn}
        initial="hidden"
        animate="visible"
        className="border-line/80 bg-panel/85 sticky top-20 z-20 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border p-1.5 shadow-lg backdrop-blur-md"
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
              {item.id === 'carrito' && totalArticulos > 0 && (
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'text-primary bg-white'
                      : 'bg-primary text-white'
                  }`}
                >
                  {totalArticulos}
                </span>
              )}
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
              onIrACarrito={() => handleCambiarVista('carrito')}
            />
          </motion.div>
        ) : vistaActiva === 'carrito' ? (
          <motion.div
            key="carrito"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CarritoServicioHabitacionOrganism
              onIrAProductos={() => handleCambiarVista('productos')}
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
              onIrACarrito={() => handleCambiarVista('carrito')}
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
            <div className="mb-4">
              <button
                type="button"
                onClick={() => handleCambiarVista('catalogo')}
                className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-2 text-xs font-bold transition-colors"
              >
                <span>← Volver al catálogo de menús</span>
              </button>
            </div>
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
            <div className="mb-4">
              <button
                type="button"
                onClick={() => handleCambiarVista('productos')}
                className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-2 text-xs font-bold transition-colors"
              >
                <span>← Volver a productos</span>
              </button>
            </div>
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
    </div>
  );
}
