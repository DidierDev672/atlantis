import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMinus,
  faTrash,
  faCheck,
  faCartShopping,
  faUtensils,
  faArrowLeft,
  faClock,
  faCreditCard,
  faPhone,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';
import { fadeIn } from '../../../../design-tokens/motion';
import {
  InfiniteScroll,
  InfiniteScrollEnd,
  LazyAnimatedWrapper,
} from '../../../../shared/ui';
import {
  useCarritoStore,
  obtenerProductoKey,
} from '../../application/carrito-store';
import {
  formatearMonedaCOP,
  resolverImagenProducto,
} from '../../domain/item-menu';
import {
  OPCIONES_CANAL,
  OPCIONES_METODO_PAGO,
} from '../../domain/confirmar-pedido-cocina.constants';
import {
  ModalConfirmarPedidoCocina,
  type DatosOrdenCocina,
} from '../molecules/ModalConfirmarPedidoCocina';

export interface CarritoServicioHabitacionOrganismProps {
  onIrAProductos?: () => void;
}

function formatearFechaHoraLegible(val?: string): string {
  if (!val) return 'Despacho inmediato';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return val;
  }
}

export function CarritoServicioHabitacionOrganism({
  onIrAProductos,
}: CarritoServicioHabitacionOrganismProps) {
  const items = useCarritoStore((s) => s.items);
  const incrementarCantidad = useCarritoStore((s) => s.incrementarCantidad);
  const decrementarCantidad = useCarritoStore((s) => s.decrementarCantidad);
  const removerProducto = useCarritoStore((s) => s.removerProducto);
  const actualizarNotas = useCarritoStore((s) => s.actualizarNotas);
  const vaciarCarrito = useCarritoStore((s) => s.vaciarCarrito);

  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [habitacionDestino, setHabitacionDestino] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [datosOrden, setDatosOrden] = useState<DatosOrdenCocina | null>(null);

  // Cálculos financieros y contables de la orden
  const totalArticulos = items.reduce((acc, curr) => acc + curr.cantidad, 0);
  const subtotalNeto = items.reduce(
    (acc, curr) => acc + curr.producto.price * curr.cantidad,
    0
  );
  const totalImpuestos = items.reduce((acc, curr) => {
    const taxRate = (curr.producto.tax_percentage ?? 0) / 100;
    return acc + curr.producto.price * curr.cantidad * taxRate;
  }, 0);
  const totalGeneral = subtotalNeto + totalImpuestos;

  // Paginación reactiva para InfiniteScroll (src/agent.md)
  const PAGE_SIZE_CARRITO = 6;
  const [paginacionCarrito, setPaginacionCarrito] = useState<{
    count: number;
    itemsLength: number;
  }>({ count: PAGE_SIZE_CARRITO, itemsLength: items.length });

  const visibleCountCarrito =
    paginacionCarrito.itemsLength === items.length
      ? paginacionCarrito.count
      : PAGE_SIZE_CARRITO;

  const visibleItems = useMemo(
    () => items.slice(0, visibleCountCarrito),
    [items, visibleCountCarrito]
  );
  const hasMoreItems = visibleCountCarrito < items.length;
  const handleLoadMoreItems = () => {
    setPaginacionCarrito((prev) => ({
      count:
        (prev.itemsLength === items.length ? prev.count : PAGE_SIZE_CARRITO) +
        PAGE_SIZE_CARRITO,
      itemsLength: items.length,
    }));
  };

  const handleAbrirModal = () => {
    setIsModalOpen(true);
  };

  const handleConfirmarOrdenModal = (datos: DatosOrdenCocina) => {
    setDatosOrden(datos);
    setIsModalOpen(false);
    setPedidoConfirmado(true);
  };

  const handleNuevoPedido = () => {
    vaciarCarrito();
    setPedidoConfirmado(false);
    setDatosOrden(null);
    setHabitacionDestino('');
    if (onIrAProductos) onIrAProductos();
  };

  return (
    <div className="space-y-8">
      {/* Modal de Confirmación y Parámetros de Orden */}
      <ModalConfirmarPedidoCocina
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmar={handleConfirmarOrdenModal}
        totalArticulos={totalArticulos}
        totalGeneral={totalGeneral}
        recepcionInicial={habitacionDestino}
      />

      {/* Estado: Pedido Confirmado / Comanda Exitosa con datos completos */}
      {pedidoConfirmado && datosOrden ? (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="bg-panel mx-auto max-w-3xl space-y-6 rounded-3xl border border-emerald-500/30 p-6 shadow-xl sm:p-9"
        >
          <div className="space-y-3 text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-3xl text-emerald-500">
              <FontAwesomeIcon icon={faCheck} />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
              <span>N° de Comanda:</span>
              <span className="font-mono">{datosOrden.numeroOrden}</span>
            </div>

            <h2 className="text-ink font-serif text-2xl font-bold sm:text-3xl">
              ¡Comanda Transmitida a Cocina con Éxito!
            </h2>
            <p className="text-ink-muted mx-auto max-w-lg text-xs sm:text-sm">
              El pedido de Room Service ha sido registrado en la cola de cocina
              y notificado al equipo de servicio.
            </p>
          </div>

          {/* Grilla con los parámetros confirmados del formulario */}
          <div className="border-line bg-canvas/60 space-y-4 rounded-2xl border p-5 sm:p-6">
            <h4 className="text-ink-muted border-line border-b pb-2 text-xs font-bold tracking-wider uppercase">
              Ficha de Despacho y Parámetros de Servicio
            </h4>

            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              {/* Recepción */}
              <div className="border-line bg-panel rounded-xl border p-3">
                <span className="text-ink-muted block text-[11px] font-medium">
                  Huésped
                </span>
                <span className="text-ink mt-0.5 block text-sm font-bold">
                  {datosOrden.recepcion}
                </span>
              </div>

              {/* Horario de entrega */}
              <div className="border-line bg-panel rounded-xl border p-3">
                <span className="text-ink-muted block flex items-center gap-1.5 text-[11px] font-medium">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="text-ink-muted size-2.5"
                  />
                  <span>Horario de entrega programado</span>
                </span>
                <span className="text-ink mt-0.5 block text-sm font-bold">
                  {formatearFechaHoraLegible(datosOrden.horarioEntrega)}
                </span>
              </div>

              {/* Canal */}
              <div className="border-line bg-panel rounded-xl border p-3">
                <span className="text-ink-muted block flex items-center gap-1.5 text-[11px] font-medium">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="text-ink-muted size-2.5"
                  />
                  <span>Canal de solicitud</span>
                </span>
                <span className="text-ink mt-0.5 block text-sm font-bold">
                  {OPCIONES_CANAL.find((c) => c.value === datosOrden.canal)
                    ?.label || datosOrden.canal}
                </span>
              </div>

              {/* Método de pago */}
              <div className="border-line bg-panel rounded-xl border p-3">
                <span className="text-ink-muted block flex items-center gap-1.5 text-[11px] font-medium">
                  <FontAwesomeIcon
                    icon={faCreditCard}
                    className="text-ink-muted size-2.5"
                  />
                  <span>Método de pago</span>
                </span>
                <span className="text-ink mt-0.5 block text-sm font-bold">
                  {OPCIONES_METODO_PAGO.find(
                    (m) => m.value === datosOrden.metodoPago
                  )?.label || datosOrden.metodoPago}
                </span>
              </div>

              {/* Propina */}
              <div className="border-line bg-panel rounded-xl border p-3">
                <span className="text-ink-muted block flex items-center gap-1.5 text-[11px] font-medium">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    $
                  </span>
                  <span>Propina</span>
                </span>
                <span className="text-ink mt-0.5 block text-sm font-bold">
                  {datosOrden.propina > 0
                    ? formatearMonedaCOP(datosOrden.propina)
                    : 'Sin propina'}
                </span>
              </div>
            </div>

            {/* Instrucciones de delivery si existen */}
            {datosOrden.instruccionesDelivery && (
              <div className="border-primary/20 bg-primary/5 rounded-xl border p-3 text-xs">
                <span className="text-primary block flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
                  <FontAwesomeIcon icon={faTruck} className="size-3" />
                  <span>Instrucciones para el Delivery</span>
                </span>
                <p className="text-ink mt-1">
                  {datosOrden.instruccionesDelivery}
                </p>
              </div>
            )}

            {/* Notas generales si existen */}
            {datosOrden.notasGenerales && (
              <div className="border-line bg-panel rounded-xl border p-3 text-xs">
                <span className="text-ink-muted block text-[11px] font-bold tracking-wider uppercase">
                  Notas Generales de Cocina
                </span>
                <p className="text-ink mt-1">{datosOrden.notasGenerales}</p>
              </div>
            )}

            {/* Resumen de totales */}
            <div className="border-line flex flex-col items-start justify-between gap-2 border-t pt-3 sm:flex-row sm:items-center">
              <span className="text-ink-muted text-xs">
                Total artículos:{' '}
                <strong className="text-ink">{totalArticulos}</strong>
              </span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                Importe Total:{' '}
                {formatearMonedaCOP(totalGeneral + (datosOrden.propina || 0))}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleNuevoPedido}
              className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-md transition-all"
            >
              <FontAwesomeIcon icon={faUtensils} className="size-3.5" />
              <span>Crear Otro Pedido de Room Service</span>
            </button>
          </div>
        </motion.div>
      ) : items.length === 0 ? (
        /* Estado Vacío */
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="border-line bg-panel mx-auto max-w-xl space-y-6 rounded-3xl border p-10 text-center shadow-xs"
        >
          <div className="bg-primary/10 text-primary border-primary/20 mx-auto grid size-20 place-items-center rounded-3xl border text-3xl">
            <FontAwesomeIcon icon={faCartShopping} />
          </div>

          <div className="space-y-2">
            <h3 className="text-ink font-serif text-2xl font-bold">
              El Carrito de Room Service está Vacío
            </h3>
            <p className="text-ink-muted mx-auto max-w-md text-xs leading-relaxed sm:text-sm">
              Aún no has agregado productos al pedido. Abre el detalle de
              cualquier platillo o bebida de la carta y pulsa el botón con el
              icono de plus (+) para agregarlo a la comanda.
            </p>
          </div>

          {onIrAProductos && (
            <button
              type="button"
              onClick={onIrAProductos}
              className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-md transition-all"
            >
              <FontAwesomeIcon icon={faUtensils} className="size-3.5" />
              <span>Explorar Productos y Carta</span>
            </button>
          )}
        </motion.div>
      ) : (
        /* Vista con Artículos Agregados */
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Columna Izquierda: Lista de Productos en el Carrito (lg:col-span-8) */}
          <div className="space-y-4 lg:col-span-8">
            <div className="border-line flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-ink text-sm font-bold">
                  Artículos seleccionados ({totalArticulos})
                </span>
              </div>
              <button
                type="button"
                onClick={vaciarCarrito}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-rose-500 transition-colors hover:text-rose-600"
              >
                <FontAwesomeIcon icon={faTrash} className="size-3" />
                <span>Vaciar comanda</span>
              </button>
            </div>

            <InfiniteScroll
              onLoadMore={handleLoadMoreItems}
              hasMore={hasMoreItems}
              isLoading={false}
              animationVariant="slideUp"
              endMessage={
                items.length > 0 ? (
                  <InfiniteScrollEnd label="Todos los productos de tu comanda están listados arriba." />
                ) : null
              }
            >
              <div className="space-y-3">
                <AnimatePresence>
                  {visibleItems.map((item) => {
                    const itemKey = obtenerProductoKey(item.producto);
                    const isVegetariano = Boolean(
                      item.producto.isVegetarian ?? item.producto.is_vegetarian
                    );
                    const isVegano = Boolean(
                      item.producto.isVegan ?? item.producto.is_vegan
                    );
                    const subtotalItem = item.producto.price * item.cantidad;

                    return (
                      <LazyAnimatedWrapper
                        key={itemKey}
                        layout
                        variant="slideUp"
                        viewportMargin="-50px"
                        once
                        data-product-key={itemKey}
                        className="border-line bg-panel hover:border-primary/40 space-y-4 rounded-3xl border p-4 shadow-xs transition-all sm:p-5"
                      >
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                          {/* Fotografía del producto */}
                          <div className="border-line relative size-20 shrink-0 overflow-hidden rounded-2xl border bg-black/10 sm:size-24">
                            <img
                              src={resolverImagenProducto(item.producto)}
                              alt={item.producto.name}
                              className="size-full object-cover"
                            />
                          </div>

                          {/* Información del producto (sin IDs ni created_by según la regla de oro) */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              {isVegetariano && (
                                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                                  🌱 Vegetariano
                                </span>
                              )}
                              {isVegano && (
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  🌿 Vegano
                                </span>
                              )}
                              {item.producto.prep_time !== undefined && (
                                <span className="text-ink-muted text-[10px]">
                                  ⏱️ {item.producto.prep_time} min
                                </span>
                              )}
                            </div>

                            <h4 className="text-ink truncate font-serif text-base font-bold sm:text-lg">
                              {item.producto.name}
                            </h4>

                            <p className="text-ink-muted mt-0.5 line-clamp-1 text-xs">
                              {item.producto.description ||
                                'Sin notas descriptivas'}
                            </p>

                            <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Precio unitario:{' '}
                              {formatearMonedaCOP(item.producto.price)}
                            </div>
                          </div>

                          {/* Controles de Cantidad y Subtotal */}
                          <div className="border-line/60 flex w-full shrink-0 items-center justify-between gap-3 border-t pt-2 sm:w-auto sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                            {/* Selector de Cantidad */}
                            <div className="border-line bg-canvas flex items-center gap-1.5 rounded-2xl border p-1 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => decrementarCantidad(itemKey)}
                                className="bg-panel text-ink-muted hover:text-ink hover:bg-canvas border-line/50 grid size-8 cursor-pointer place-items-center rounded-xl border transition-colors"
                                title="Reducir cantidad"
                              >
                                <FontAwesomeIcon
                                  icon={faMinus}
                                  className="size-2.5"
                                />
                              </button>
                              <span className="text-ink w-8 text-center text-xs font-bold">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => incrementarCantidad(itemKey)}
                                className="bg-primary hover:bg-primary/90 grid size-8 cursor-pointer place-items-center rounded-xl text-white shadow-xs transition-colors"
                                title="Aumentar cantidad"
                              >
                                <FontAwesomeIcon
                                  icon={faPlus}
                                  className="size-2.5"
                                />
                              </button>
                            </div>

                            {/* Subtotal de línea */}
                            <div className="text-right">
                              <span className="text-ink font-sans text-sm font-extrabold sm:text-base">
                                {formatearMonedaCOP(subtotalItem)}
                              </span>
                            </div>

                            {/* Botón eliminar */}
                            <button
                              type="button"
                              onClick={() => removerProducto(itemKey)}
                              className="text-ink-muted cursor-pointer p-1 transition-colors hover:text-rose-500"
                              title="Eliminar este platillo del carrito"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="size-3"
                              />
                            </button>
                          </div>
                        </div>

                        {/* Campo opcional de notas de preparación para la cocina */}
                        <div className="border-line/50 border-t pt-2">
                          <input
                            type="text"
                            value={item.notas || ''}
                            onChange={(e) =>
                              actualizarNotas(itemKey, e.target.value)
                            }
                            placeholder="Indicaciones especiales para la cocina (ej: salsa aparte, término medio...)"
                            className="border-line/80 bg-canvas/60 text-ink placeholder:text-ink-muted/70 focus:border-primary focus:bg-canvas w-full rounded-xl border px-3.5 py-1.5 text-xs transition-all focus:outline-hidden"
                          />
                        </div>
                      </LazyAnimatedWrapper>
                    );
                  })}
                </AnimatePresence>
              </div>
            </InfiniteScroll>

            {onIrAProductos && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onIrAProductos}
                  className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-2 text-xs font-bold transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="size-3" />
                  <span>Seguir agregando productos de la carta</span>
                </button>
              </div>
            )}
          </div>

          {/* Columna Derecha: Tarjeta de Liquidación y Confirmación (lg:col-span-4) */}
          <div className="sticky top-6 space-y-4 lg:col-span-4">
            <div className="border-line bg-panel space-y-6 rounded-3xl border p-6 shadow-md">
              <div className="border-line flex items-center justify-between border-b pb-3">
                <h3 className="text-ink font-serif text-lg font-bold">
                  Resumen de la Comanda
                </h3>
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {totalArticulos} {totalArticulos === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Asignación de Habitación */}
              <div className="space-y-1.5">
                <label className="text-ink-muted block text-xs font-bold tracking-wider uppercase">
                  Habitación del Huésped
                </label>
                <input
                  type="text"
                  value={habitacionDestino}
                  onChange={(e) => setHabitacionDestino(e.target.value)}
                  placeholder="Ej: Habitación 304 - Suite Deluxe"
                  className="border-line bg-canvas text-ink placeholder:text-ink-muted/70 focus:border-primary w-full rounded-2xl border px-4 py-2.5 text-xs transition-all focus:outline-hidden"
                />
              </div>

              {/* Desglose de Precios */}
              <div className="space-y-2.5 text-xs">
                <div className="text-ink-muted flex justify-between">
                  <span>Subtotal alimentos y bebidas</span>
                  <span className="text-ink font-semibold">
                    {formatearMonedaCOP(subtotalNeto)}
                  </span>
                </div>
                <div className="text-ink-muted flex justify-between">
                  <span>Impuesto estimado (IVA)</span>
                  <span className="text-ink font-semibold">
                    {formatearMonedaCOP(totalImpuestos)}
                  </span>
                </div>
                <div className="text-ink-muted flex justify-between">
                  <span>Cargo por servicio a habitación</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Incluido
                  </span>
                </div>

                <div className="border-line flex items-baseline justify-between border-t pt-3">
                  <span className="text-ink text-sm font-bold">
                    Total a Cargar
                  </span>
                  <span className="font-sans text-xl font-black tracking-tight text-emerald-600 sm:text-2xl dark:text-emerald-400">
                    {formatearMonedaCOP(totalGeneral)}
                  </span>
                </div>
              </div>

              {/* Botón de Confirmación que abre el modal */}
              <button
                type="button"
                onClick={handleAbrirModal}
                className="bg-primary hover:bg-primary/90 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold text-white shadow-md transition-all active:scale-98"
              >
                <FontAwesomeIcon icon={faCheck} className="size-3.5" />
                <span>Confirmar y Enviar a Cocina</span>
              </button>

              <p className="text-ink-muted text-center text-[11px] leading-relaxed">
                El pedido se transmitirá en tiempo real a la estación de Room
                Service del hotel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
