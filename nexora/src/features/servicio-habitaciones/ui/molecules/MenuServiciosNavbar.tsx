import { memo } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBowlFood,
  faClipboardList,
  faPlus,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { slideIn } from '../../../../design-tokens/motion';
import { CarritoFlotanteFab } from '../atoms/CarritoFlotanteFab';

export type MenuServicioVistaActiva =
  | 'catalogo'
  | 'productos'
  | 'nuevo'
  | 'pedidos';

interface NavTabItem {
  id: MenuServicioVistaActiva;
  label: string;
  icon: IconDefinition;
}

const NAV_ITEMS: ReadonlyArray<NavTabItem> = [
  { id: 'catalogo', label: 'Categorías', icon: faUtensils },
  { id: 'productos', label: 'Productos', icon: faBowlFood },
  { id: 'pedidos', label: 'Historial de Ventas', icon: faClipboardList },
  { id: 'nuevo', label: 'Crea nueva categoría', icon: faPlus },
];

export interface MenuServiciosNavbarProps {
  vistaActiva: MenuServicioVistaActiva;
  totalArticulos: number;
  onCambiarVista: (vista: MenuServicioVistaActiva) => void;
  onAbrirCarrito: () => void;
}

/**
 * Molécula: Barra de navegación flotante de Servicio a la Habitación
 * con el ítem "Crea nueva categoría" para abrir FormularioServicioHabitacionCard.
 */
export const MenuServiciosNavbar = memo(function MenuServiciosNavbar({
  vistaActiva,
  totalArticulos,
  onCambiarVista,
  onAbrirCarrito,
}: MenuServiciosNavbarProps) {
  return (
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
              onClick={() => onCambiarVista(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-muted hover:bg-canvas/70 hover:text-ink'
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="size-3.5"
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </motion.nav>

      <div className="flex justify-end">
        <CarritoFlotanteFab
          totalArticulos={totalArticulos}
          onClick={onAbrirCarrito}
        />
      </div>
    </div>
  );
});

export default MenuServiciosNavbar;
