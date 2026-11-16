import { useEffect, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBellConcierge,
  faCheck,
  faChevronDown,
  faClock,
  faDoorOpen,
  faIdCard,
  faMobileScreen,
  faPhone,
  faQrcode,
  faRotateRight,
  faTabletScreenButton,
  faTag,
  faTriangleExclamation,
  faTruck,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../../../../lib/api';
import { validateStatusCode } from '../../../../shared/lib/status-code-validator';
import { executeBalancedRequest } from '../../../reservas/infrastructure/api-load-balancer';
import { Loading } from '../../../../shared/loading';
import { Accordion, type AccordionItem } from '../../../../shared/ui';
import { CubiertosRozandoAnimados } from '../atoms/CubiertosRozandoAnimados';
import { TicketImpresoraAnimado } from '../atoms/TicketImpresoraAnimado';
import { formatearMonedaCOP } from '../../domain/item-menu';
import {
  ESTADOS_PEDIDO_CONFIG,
  type EstadoPedido,
  type PrioridadInfo,
  type ServiceRequestItem,
} from '../../domain/pedidos-servicio-habitacion';

interface PersonaServicioHabitacionApi {
  id: string;
  document_type?: string;
  document_number?: string;
  name?: string;
  phone_number?: string;
  email?: string;
  nationality?: string;
}

interface ItemMenuApiItem {
  id?: string;
  _id?: string;
  category_id?: string;
}

interface MenuCategoryApi {
  id?: string;
  _id?: string;
  headquartes_id?: string;
  sub_headquartes_id?: string;
  building_id?: string;
  name?: string;
  description?: string;
  order?: number;
  asset?: string;
}

interface CategoriaMenuInfo {
  name: string;
  asset?: string;
}

let itemMenuCatalogPromise: Promise<ItemMenuApiItem[]> | null = null;
let menuCategoryCatalogPromise: Promise<MenuCategoryApi[]> | null = null;
const categoriaPorIdCache = new Map<string, Promise<CategoriaMenuInfo | null>>();

function extraerListaApi<T>(raw: unknown, extraKeys: string[] = []): T[] {
  if (Array.isArray(raw)) {
    return raw as T[];
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of ['data', ...extraKeys]) {
      const val = obj[key];
      if (Array.isArray(val)) return val as T[];
      if (val && typeof val === 'object') return [val as T];
    }
    if ('id' in obj || '_id' in obj || 'category_id' in obj || 'name' in obj) {
      return [raw as T];
    }
  }
  return [];
}

async function obtenerCatalogoItemMenu(): Promise<ItemMenuApiItem[]> {
  if (!itemMenuCatalogPromise) {
    itemMenuCatalogPromise = executeBalancedRequest(() =>
      api.get<
        ItemMenuApiItem[] | ItemMenuApiItem | { data?: ItemMenuApiItem[] | ItemMenuApiItem }
      >('/item-menu', {
        skipAuth: true,
        validateStatus: () => true,
      })
    )
      .then((response) => {
        const validation = validateStatusCode(response.status);
        if (!validation.isValid) {
          itemMenuCatalogPromise = null;
          return [];
        }
        return extraerListaApi<ItemMenuApiItem>(response.data, ['items', 'results']);
      })
      .catch(() => {
        itemMenuCatalogPromise = null;
        return [];
      });
  }

  return itemMenuCatalogPromise;
}

async function obtenerCatalogoCategorias(): Promise<MenuCategoryApi[]> {
  if (!menuCategoryCatalogPromise) {
    menuCategoryCatalogPromise = executeBalancedRequest(() =>
      api.get<
        MenuCategoryApi[] | MenuCategoryApi | { data?: MenuCategoryApi[] | MenuCategoryApi }
      >('/menu-category', {
        skipAuth: true,
        validateStatus: () => true,
      })
    )
      .then((response) => {
        const validation = validateStatusCode(response.status);
        if (!validation.isValid) {
          menuCategoryCatalogPromise = null;
          return [];
        }
        return extraerListaApi<MenuCategoryApi>(response.data, ['categories', 'items']);
      })
      .catch(() => {
        menuCategoryCatalogPromise = null;
        return [];
      });
  }

  return menuCategoryCatalogPromise;
}

async function obtenerCategoryIdDesdeItemMenu(
  itemMenuId: string
): Promise<string | null> {
  const catalogo = await obtenerCatalogoItemMenu();
  const itemEncontrado =
    catalogo.find((item) => (item.id ?? item._id) === itemMenuId) ||
    (catalogo.length === 1 && !catalogo[0]?.id && !catalogo[0]?._id
      ? catalogo[0]
      : undefined);

  if (itemEncontrado?.category_id) {
    return itemEncontrado.category_id;
  }

  // Fallback puntual a GET /item-menu/{id} si no apareció en el listado cacheado
  const response = await executeBalancedRequest(() =>
    api.get<ItemMenuApiItem | { data?: ItemMenuApiItem }>(
      `/item-menu/${encodeURIComponent(itemMenuId)}`,
      {
        skipAuth: true,
        validateStatus: () => true,
      }
    )
  );
  const validation = validateStatusCode(response.status);
  if (!validation.isValid) {
    return null;
  }

  const [itemData] = extraerListaApi<ItemMenuApiItem>(response.data);
  return itemData?.category_id || null;
}

async function obtenerMenuCategoryPorId(
  categoryId: string
): Promise<CategoriaMenuInfo | null> {
  const cached = categoriaPorIdCache.get(categoryId);
  if (cached) {
    return cached;
  }

  const req = executeBalancedRequest(() =>
    api.get<MenuCategoryApi | MenuCategoryApi[] | { data?: MenuCategoryApi }>(
      `/menu-category/${encodeURIComponent(categoryId)}`,
      {
        skipAuth: true,
        validateStatus: () => true,
      }
    )
  )
    .then(async (response): Promise<CategoriaMenuInfo | null> => {
      const validation = validateStatusCode(response.status);
      if (validation.isValid) {
        const [categoriaObj] = extraerListaApi<MenuCategoryApi>(response.data, [
          'category',
        ]);
        if (categoriaObj?.name) {
          return {
            name: categoriaObj.name,
            asset: categoriaObj.asset,
          };
        }
      }

      // Fallback al listado GET /menu-category si /:id no existe o el producto antiguo guardó headquartes_id
      const catalogo = await obtenerCatalogoCategorias();
      const coincidencia =
        catalogo.find((c) => (c.id ?? c._id) === categoryId) ||
        catalogo.find((c) => c.headquartes_id === categoryId);

      if (coincidencia?.name) {
        return {
          name: coincidencia.name,
          asset: coincidencia.asset,
        };
      }

      categoriaPorIdCache.delete(categoryId);
      return null;
    })
    .catch(() => {
      categoriaPorIdCache.delete(categoryId);
      return null;
    });

  categoriaPorIdCache.set(categoryId, req);
  return req;
}

async function obtenerCategoriaPorItemMenuId(
  itemMenuId: string
): Promise<CategoriaMenuInfo | null> {
  const categoryId = await obtenerCategoryIdDesdeItemMenu(itemMenuId);
  if (!categoryId) {
    return null;
  }
  return obtenerMenuCategoryPorId(categoryId);
}

function ProductoCategoriaBadge({ itemMenuId }: { itemMenuId: string }) {
  const [estado, setEstado] = useState<{
    resolvedForId: string | null;
    categoria: CategoriaMenuInfo | null;
    failedAssetUrl: string | null;
  }>({ resolvedForId: null, categoria: null, failedAssetUrl: null });

  const tieneId = Boolean(
    itemMenuId && itemMenuId.trim() && itemMenuId !== 'N/A'
  );
  const cargando = tieneId && estado.resolvedForId !== itemMenuId;
  const categoria =
    tieneId && estado.resolvedForId === itemMenuId ? estado.categoria : null;

  useEffect(() => {
    if (!tieneId) return;

    let activo = true;
    void obtenerCategoriaPorItemMenuId(itemMenuId)
      .then((data) => {
        if (!activo) return;
        setEstado((prev) => ({
          ...prev,
          resolvedForId: itemMenuId,
          categoria: data,
        }));
      })
      .catch(() => {
        if (!activo) return;
        setEstado((prev) => ({
          ...prev,
          resolvedForId: itemMenuId,
          categoria: null,
        }));
      });

    return () => {
      activo = false;
    };
  }, [itemMenuId, tieneId]);

  if (!tieneId) {
    return null;
  }

  const mostrarImagenAsset =
    Boolean(categoria?.asset) && estado.failedAssetUrl !== categoria?.asset;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-ink-muted">Categoría / Servicio:</span>

      <AnimatePresence mode="wait" initial={false}>
        {cargando ? (
          <motion.div
            key="categoria-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <Loading
              variant="inline"
              delay={0}
              minDuration={250}
              label="Cargando categoría…"
              className="py-0"
            />
          </motion.div>
        ) : categoria ? (
          <motion.div
            key={`categoria-${categoria.name}`}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-primary"
          >
            {mostrarImagenAsset ? (
              <img
                src={categoria.asset}
                alt={categoria.name}
                onError={() =>
                  setEstado((prev) => ({
                    ...prev,
                    failedAssetUrl: categoria.asset ?? null,
                  }))
                }
                className="size-4 rounded-full object-cover shrink-0"
              />
            ) : (
              <FontAwesomeIcon icon={faTag} className="size-3 shrink-0" />
            )}
            <span className="truncate max-w-44">{categoria.name}</span>
          </motion.div>
        ) : (
          <motion.span
            key="categoria-fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-ink font-semibold"
          >
            Servicio de Habitación
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

async function obtenerPersonaPorId(
  personId: string
): Promise<PersonaServicioHabitacionApi | null> {
  const response = await executeBalancedRequest(() =>
    api.get<
      PersonaServicioHabitacionApi | { data?: PersonaServicioHabitacionApi }
    >(`/person/${encodeURIComponent(personId)}`, {
      validateStatus: () => true,
    })
  );

  const validation = validateStatusCode(response.status);
  if (!validation.isValid) {
    return null;
  }

  const raw = response.data;
  const persona =
    raw && typeof raw === 'object' && 'data' in raw && raw.data
      ? raw.data
      : (raw as PersonaServicioHabitacionApi);

  return persona && typeof persona === 'object' ? persona : null;
}

export interface PedidoServicioHabitacionCardProps {
  order_number: string;
  person_id: string;
  channel?: string;
  item_menu_id: string;
  name_snapshot: string;
  amount: number;
  price_unit: number;
  /** Lista opcional de ítems cuando una orden incluye múltiples productos */
  items?: ServiceRequestItem[];
  /** Controla si el acordeón de Detalle del Producto permite un solo ítem abierto a la vez */
  singleOpenDetalle?: boolean;
  /** Propiedades opcionales para gestión en pantalla de cocina (KDS) */
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
    if (isNaN(fecha.getTime())) return isoString;
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function PedidoServicioHabitacionCard({
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
  const canalInfo = formatearCanalPedido(channel);
  const estadoConfig =
    ESTADOS_PEDIDO_CONFIG[estadoActual] || ESTADOS_PEDIDO_CONFIG.en_preparacion;

  const [personaEstado, setPersonaEstado] = useState<{
    resolvedForId: string | null;
    persona: PersonaServicioHabitacionApi | null;
  }>({ resolvedForId: null, persona: null });

  const tienePersonId = Boolean(person_id && person_id.trim());
  const cargandoPersona =
    tienePersonId && personaEstado.resolvedForId !== person_id;
  const persona =
    tienePersonId && personaEstado.resolvedForId === person_id
      ? personaEstado.persona
      : null;

  useEffect(() => {
    if (!person_id || !person_id.trim()) return;

    let activo = true;
    void obtenerPersonaPorId(person_id)
      .then((data) => {
        if (!activo) return;
        setPersonaEstado({ resolvedForId: person_id, persona: data });
      })
      .catch(() => {
        if (!activo) return;
        setPersonaEstado({ resolvedForId: person_id, persona: null });
      });

    return () => {
      activo = false;
    };
  }, [person_id]);

  const detalleItems: ServiceRequestItem[] =
    items && items.length > 0
      ? items
      : [
          {
            item_menu_id,
            name_snapshot,
            amount,
            price_unit,
          },
        ];

  const totalUnidades = detalleItems.reduce(
    (acc, it) => acc + (Number(it.amount) || 0),
    0
  );
  const subtotalProductos = detalleItems.reduce(
    (acc, it) => acc + (Number(it.price_unit) || 0) * (Number(it.amount) || 0),
    0
  );
  const totalPedido = subtotalProductos + (Number(tip) || 0);

  const tieneControlesEstado = Boolean(onToggleDropdown && onChangeEstado);

  return (
    <motion.article
      variants={motionVariants}
      className="group border-line/80 bg-panel hover:border-primary/40 relative flex flex-col justify-between rounded-3xl border shadow-lg transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl"
    >
      {/* Cabecera semántica de la tarjeta */}
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
          {/* Badge de Canal */}
          <span className="border-line bg-panel text-ink inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold shadow-2xs">
            <FontAwesomeIcon
              icon={canalInfo.icon}
              className="text-primary size-3"
            />
            <span>{canalInfo.label}</span>
          </span>

          {/* Control de estado (opcional cuando se usa dentro del KDS) */}
          {tieneControlesEstado && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDropdown?.();
                }}
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
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="border-line bg-panel text-ink absolute top-full right-0 z-40 mt-1.5 w-44 space-y-0.5 rounded-2xl border p-1.5 font-mono text-xs shadow-xl backdrop-blur-md"
                >
                  <div className="text-ink-muted border-line/60 border-b px-2 py-1 text-[9px] font-black tracking-wider uppercase">
                    Actualizar Estado
                  </div>
                  {(Object.keys(ESTADOS_PEDIDO_CONFIG) as EstadoPedido[]).map(
                    (estadoKey) => {
                      const conf = ESTADOS_PEDIDO_CONFIG[estadoKey];
                      const esSeleccionado = estadoActual === estadoKey;

                      return (
                        <button
                          key={estadoKey}
                          type="button"
                          onClick={() => onChangeEstado?.(estadoKey)}
                          className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-[10px] font-bold transition-colors ${
                            esSeleccionado
                              ? 'bg-primary text-white shadow-2xs'
                              : 'hover:bg-line/40 text-ink'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <FontAwesomeIcon
                              icon={conf.icon}
                              className="size-2.5"
                            />
                            <span>{conf.label}</span>
                          </span>
                          {esSeleccionado && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="size-2.5"
                            />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}

          {onActualizarOrden && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onActualizarOrden();
              }}
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

      {/* Cuerpo semántico de la tarjeta */}
      <div className="flex-1 space-y-4 p-5">
        {/* Sección de Huésped consumida desde GET /person/{id} (sin exponer IDs crudos) */}
        <section
          aria-label="Información del solicitante"
          className="border-line/70 bg-canvas/50 rounded-2xl border px-3.5 py-3 text-xs"
        >
          <AnimatePresence mode="wait" initial={false}>
            {cargandoPersona ? (
              <motion.div
                key="persona-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-between gap-2"
              >
                <Loading
                  variant="inline"
                  delay={0}
                  minDuration={300}
                  label="Cargando datos del huésped…"
                />
                {habitacionEtiqueta && (
                  <div className="text-ink-muted flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                    <FontAwesomeIcon
                      icon={faDoorOpen}
                      className="text-primary size-3"
                    />
                    <span
                      className="max-w-36 truncate"
                      title={habitacionEtiqueta}
                    >
                      {habitacionEtiqueta}
                    </span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="persona-loaded"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-primary size-3.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-ink-muted block font-mono text-[10px] tracking-wider uppercase">
                        Huésped
                      </span>
                      <span
                        className="text-ink block truncate font-mono font-bold"
                        title={persona?.name || 'Huésped Titular'}
                      >
                        {persona?.name || 'Huésped Titular'}
                      </span>
                    </div>
                  </div>

                  {habitacionEtiqueta && (
                    <div className="text-ink-muted flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                      <FontAwesomeIcon
                        icon={faDoorOpen}
                        className="text-primary size-3"
                      />
                      <span
                        className="max-w-44 truncate"
                        title={habitacionEtiqueta}
                      >
                        {habitacionEtiqueta}
                      </span>
                    </div>
                  )}
                </div>

                {(persona?.document_number || persona?.phone_number) && (
                  <div className="border-line/60 text-ink-muted flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2 font-mono text-[11px]">
                    {persona.document_number && (
                      <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={faIdCard}
                          className="text-primary size-3 shrink-0"
                        />
                        <span>{persona.document_number}</span>
                      </span>
                    )}

                    {persona.phone_number && (
                      <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={faPhone}
                          className="text-primary size-3 shrink-0"
                        />
                        <span>{persona.phone_number}</span>
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Prioridad si aplica en vista KDS */}
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

        {/* Detalle de productos con Accordion */}
        <section aria-label="Detalle del pedido" className="space-y-2.5">
          <div className="text-ink-muted flex items-center justify-between font-mono text-[11px] font-bold tracking-wider uppercase">
            <motion.span
              initial="rest"
              animate="rest"
              whileHover="hover"
              className="inline-flex cursor-pointer items-center gap-1.5"
            >
              <CubiertosRozandoAnimados className="text-primary" />
              <span>Detalle del Producto</span>
            </motion.span>
          </div>

          <Accordion
            singleOpen={singleOpenDetalle}
            items={detalleItems.map((item, idx): AccordionItem => {
              const cantidad = Number(item.amount) || 0;
              const precioUnitario = Number(item.price_unit) || 0;
              const subtotalItem = cantidad * precioUnitario;

              return {
                id: `${item.item_menu_id}-${idx}`,
                title: (
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="bg-primary/15 text-primary inline-flex h-6 min-w-7 shrink-0 items-center justify-center rounded-lg px-1.5 font-mono text-[11px] font-black">
                        {cantidad}x
                      </span>
                      <span className="text-ink truncate text-xs font-bold sm:text-sm">
                        {item.name_snapshot}
                      </span>
                      {item.note && item.note.trim() && (
                        <FontAwesomeIcon
                          icon={faTriangleExclamation}
                          className="size-3 shrink-0 text-red-500"
                          title="Incluye nota de preparación"
                        />
                      )}
                    </div>

                    <span className="text-ink shrink-0 font-mono text-xs font-extrabold">
                      {formatearMonedaCOP(subtotalItem)}
                    </span>
                  </div>
                ),
                content: (
                  <div className="space-y-2 font-mono text-[11px]">
                    <ProductoCategoriaBadge itemMenuId={item.item_menu_id} />

                    <div className="text-ink-muted flex flex-wrap items-center justify-between gap-2">
                      <span>Cantidad: {cantidad}</span>
                      <span>
                        Unitario:{' '}
                        <strong className="text-ink">
                          {formatearMonedaCOP(precioUnitario)}
                        </strong>
                      </span>
                    </div>

                    <div className="text-ink-muted flex items-center justify-between">
                      <span>Producto: {item.name_snapshot}</span>
                      <span>
                        Subtotal:{' '}
                        <strong className="text-ink">
                          {formatearMonedaCOP(subtotalItem)}
                        </strong>
                      </span>
                    </div>

                    {item.note && item.note.trim() && (
                      <p className="flex items-start gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                        <FontAwesomeIcon
                          icon={faTriangleExclamation}
                          className="mt-0.5 size-3 shrink-0"
                        />
                        <span>{item.note}</span>
                      </p>
                    )}
                  </div>
                ),
              };
            })}
          />
        </section>

        {/* Notas generales o instrucciones de despacho si existen */}
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

      {/* Pie semántico con totales */}
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
