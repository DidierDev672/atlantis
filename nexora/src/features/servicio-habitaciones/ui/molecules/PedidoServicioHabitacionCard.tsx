import { Suspense, memo, useCallback, useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBellConcierge,
  faChevronDown,
  faClock,
  faMobileScreen,
  faPhone,
  faQrcode,
  faRotateRight,
  faTabletScreenButton,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';
import { lazyWithFallback } from '../../application/lazy-with-fallback';
import { formatearMonedaCOP } from '../../domain/item-menu';
import {
  ESTADOS_PEDIDO_CONFIG,
  type EstadoPedido,
  type PrioridadInfo,
  type ServiceRequestItem,
} from '../../domain/pedidos-servicio-habitacion';
import { TicketImpresoraAnimado } from '../atoms/TicketImpresoraAnimado';
import type { PedidoEstadoDropdownMenuProps } from '../atoms/PedidoEstadoDropdownMenu';
import { PedidoCardHuespedSection } from './PedidoCardHuespedSection';
import { PedidoCardDetalleAccordion } from './PedidoCardDetalleAccordion';

const LazyPedidoEstadoDropdownMenu = lazyWithFallback<PedidoEstadoDropdownMenuProps>(
  () =>
    import('../atoms/PedidoEstadoDropdownMenu').then(
      (m) => m.PedidoEstadoDropdownMenu
    ),
  'PedidoEstadoDropdownMenu'
);

export interface PedidoServicioHabitacionCardProps {
  order_number: string;
  person_id: string;
  channel?: string;
  item_menu_id: string;
  name_snapshot: string;
  amount: number;
  price_unit: number;
  items?: ServiceRequestItem[];
  singleOpenDetalle?: boolean;
  estadoActual?: EstadoPedido;
  prioridad?: PrioridadInfo;
  habitacionEtiqueta?: string;
  scheduled_for?: string;
  general_notes?: string;
  delivery_instructions?: string;
  tip?: number;
  openDropdown?: boolean;
  isUpdating?: boolean;
  motionVariants?: Variants;
  onToggleDropdown?: () => void;
  onChangeEstado?: (nuevoEstado: EstadoPedido) => void;
  onActualizarOrden?: () => void;
}

function formatearCanalPedido(channel?: string) {
  switch (channel?.toLowerCase()) {
    case 'front_desk':
    case 'recepcion':
      return { label: 'Recepción', icon: faBellConcierge };
    case 'mobile_app':
    case 'movil':
      return { label: 'Móvil', icon: faMobileScreen };
    case 'room_tablet':
    case 'tablet':
      return { label: 'Tablet', icon: faTabletScreenButton };
    case 'qr_code':
    case 'codigo_qr':
      return { label: 'Código QR', icon: faQrcode };
    case 'phone':
    case 'telefono':
      return { label: 'Teléfono', icon: faPhone };
    default:
      return { label: channel || 'Room Service', icon: faBellConcierge };
  }
}

function formatearFechaEntrega(isoString?: string): string {
  if (!isoString) return 'Entrega inmediata';
  try {
    const fecha = new Date(isoString);
    if (Number.isNaN(fecha.getTime())) return isoString;
    return fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Molécula: Tarjeta interactiva de comanda (KDS) para pedidos de habitación.
 * Refactorizada en subcomponentes atómicos memorizados (`React.memo`),
 * dropdown perezoso (`React.lazy`) y cachés compartidas de red/imágenes.
 */
export const PedidoServicioHabitacionCard = memo(
  function PedidoServicioHabitacionCard({
    order_number,
    person_id,
    channel,
    item_menu_id,
    name_snapshot,
    amount,
    price_unit,
    items,
    singleOpenDetalle = false,
    estadoActual = 'en_preparacion',
    prioridad,
    habitacionEtiqueta,
    scheduled_for,
    general_notes,
    delivery_instructions,
    tip = 0,
    openDropdown = false,
    isUpdating = false,
    motionVariants,
    onToggleDropdown,
    onChangeEstado,
    onActualizarOrden,
  }: PedidoServicioHabitacionCardProps) {
    const canalInfo = useMemo(() => formatearCanalPedido(channel), [channel]);
    const estadoConfig =
      ESTADOS_PEDIDO_CONFIG[estadoActual] || ESTADOS_PEDIDO_CONFIG.en_preparacion;

    const detalleItems = useMemo<ServiceRequestItem[]>(
      () =>
        items && items.length > 0
          ? items
          : [{ item_menu_id, name_snapshot, amount, price_unit }],
      [amount, item_menu_id, items, name_snapshot, price_unit]
    );

    const totalUnidades = useMemo(
      () =>
        detalleItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0),
      [detalleItems]
    );

    const totalPedido = useMemo(() => {
      const subtotal = detalleItems.reduce(
        (acc, it) =>
          acc + (Number(it.price_unit) || 0) * (Number(it.amount) || 0),
        0
      );
      return subtotal + (Number(tip) || 0);
    }, [detalleItems, tip]);

    const handleToggleDropdownClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        try {
          onToggleDropdown?.();
        } catch (error) {
          console.error('Error al alternar menú de estado:', error);
        }
      },
      [onToggleDropdown]
    );

    const handleActualizarClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        try {
          onActualizarOrden?.();
        } catch (error) {
          console.error('Error al actualizar orden:', error);
        }
      },
      [onActualizarOrden]
    );

    const tieneControlesEstado = Boolean(onToggleDropdown && onChangeEstado);

    return (
      <motion.article
        variants={motionVariants}
        className="group border-line/80 bg-panel hover:border-primary/40 relative flex flex-col justify-between rounded-3xl border shadow-lg transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl"
      >
        <header className="border-line/70 bg-canvas/60 flex flex-wrap items-center justify-between gap-3 rounded-t-3xl border-b px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              initial="rest"
              animate="rest"
              whileHover="hover"
              className="bg-primary/10 text-primary border-primary/20 grid size-10 shrink-0 cursor-pointer place-items-center rounded-2xl border transition-colors hover:bg-primary/15"
            >
              <TicketImpresoraAnimado />
            </motion.div>
            <div className="min-w-0">
              <p className="text-ink-muted font-mono text-[10px] font-bold tracking-wider uppercase">
                Pedido
              </p>
              <h3 className="text-ink truncate font-mono text-base font-black tracking-tight">
                #{order_number}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="border-line bg-panel text-ink inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold shadow-2xs">
              <FontAwesomeIcon
                icon={canalInfo.icon}
                className="text-primary size-3"
              />
              <span>{canalInfo.label}</span>
            </span>

            {tieneControlesEstado && (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleDropdownClick}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-black tracking-wider uppercase transition-all ${estadoConfig.colorBadge}`}
                  title="Cambiar estado del pedido"
                >
                  <span
                    className={`size-1.5 rounded-full ${estadoConfig.dotColor}`}
                  />
                  <span>{estadoConfig.label}</span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="size-2 opacity-80"
                  />
                </button>

                {openDropdown && (
                  <Suspense fallback={null}>
                    <LazyPedidoEstadoDropdownMenu
                      estadoActual={estadoActual}
                      onChangeEstado={onChangeEstado}
                    />
                  </Suspense>
                )}
              </div>
            )}

            {onActualizarOrden && (
              <button
                type="button"
                onClick={handleActualizarClick}
                disabled={isUpdating}
                className="border-line bg-panel text-ink-muted hover:text-primary hover:border-primary/40 inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:opacity-50"
                title="Actualizar estado del pedido"
              >
                <FontAwesomeIcon
                  icon={faRotateRight}
                  className={`size-3 ${isUpdating ? 'animate-spin' : ''}`}
                />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 space-y-4 p-5">
          <PedidoCardHuespedSection
            personId={person_id}
            habitacionEtiqueta={habitacionEtiqueta}
          />

          {prioridad && (
            <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] ${prioridad.badgeClase}`}
              >
                <FontAwesomeIcon icon={prioridad.icon} className="size-2.5" />
                <span>{prioridad.tiempoTexto}</span>
              </span>
              {scheduled_for && (
                <span className="text-ink-muted inline-flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="size-3" />
                  <span>{formatearFechaEntrega(scheduled_for)}</span>
                </span>
              )}
            </div>
          )}

          <PedidoCardDetalleAccordion
            detalleItems={detalleItems}
            singleOpenDetalle={singleOpenDetalle}
          />

          {general_notes && general_notes.trim() && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-700 dark:text-red-300">
              <span className="mb-0.5 block text-[10px] font-black tracking-wider uppercase">
                Nota especial
              </span>
              <p className="leading-snug font-semibold">{general_notes}</p>
            </div>
          )}

          {delivery_instructions && delivery_instructions.trim() && (
            <div className="border-line/70 bg-canvas/40 text-ink-muted flex items-start gap-2 rounded-2xl border px-3 py-2 font-mono text-[11px]">
              <FontAwesomeIcon
                icon={faTruck}
                className="text-primary mt-0.5 size-3 shrink-0"
              />
              <span>{delivery_instructions}</span>
            </div>
          )}
        </div>

        <footer className="border-line/70 bg-canvas/50 flex items-center justify-between gap-3 rounded-b-3xl border-t px-5 py-3.5">
          <div className="text-ink-muted font-mono text-xs">
            Cantidad total:{' '}
            <strong className="text-ink font-black">{totalUnidades}</strong>
          </div>

          <div className="text-right">
            <span className="text-ink-muted block font-mono text-[10px] tracking-wider uppercase">
              Total
            </span>
            <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatearMonedaCOP(totalPedido)}
            </span>
          </div>
        </footer>
      </motion.article>
    );
  }
);
