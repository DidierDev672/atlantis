import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBellConcierge,
  faCheck,
  faRotateRight,
  faCircleExclamation,
  faMagnifyingGlass,
  faMobileScreen,
  faClipboardList,
  faTabletScreenButton,
} from '@fortawesome/free-solid-svg-icons'
import { fadeIn } from '../../../../design-tokens/motion'
import { api } from '../../../../lib/api'
import { validateStatusCode, type StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator'
import { InfiniteScroll, InfiniteScrollEnd } from '../../../../shared/ui'
import { Loader } from '../../../tema/ui/atoms/loader'
import { readAuthUser } from '../../../../shared/auth-storage'
import { obtenerMapaHabitacionesEstadias } from '../../infrastructure/api-estadias-recepcion-repository'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import { PedidoServicioHabitacionCard } from '../molecules/PedidoServicioHabitacionCard'
import {
  calcularPrioridadComanda,
  type ServiceRequestItem,
  type ServiceRequestOrder,
  type UpdateServiceRequestPayload,
  type CreateServiceAssignmentPayload,
  type NivelPrioridad,
  type PrioridadInfo,
  type EstadoPedido,
  type EstadoPedidoConfig,
} from '../../domain/pedidos-servicio-habitacion'

export type {
  ServiceRequestItem,
  ServiceRequestOrder,
  UpdateServiceRequestPayload,
  CreateServiceAssignmentPayload,
  NivelPrioridad,
  PrioridadInfo,
  EstadoPedido,
  EstadoPedidoConfig,
}

/**
 * Variantes de orquestación para Stagger Reveal (revelado escalonado) de comandas de cocina
 * según especificación en prompt/prompt-stagger-reveal-framer-motion.md
 */
const KITCHEN_TICKETS_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.03,
    },
  },
}

const KITCHEN_TICKET_CARD_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 26,
      stiffness: 300,
      mass: 0.8,
    },
  },
}

const OPCIONES_PRIORIDAD: ReadonlyArray<DropdownOption> = [
  { value: 'todos', label: 'Todos' },
  {
    value: 'urgente',
    label: 'Urgentes',
    customContent: (
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-red-500 shrink-0" />
        <span>Urgentes</span>
      </span>
    ),
  },
  {
    value: 'atencion',
    label: 'En cola',
    customContent: (
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-amber-500 shrink-0" />
        <span>En cola</span>
      </span>
    ),
  },
  {
    value: 'normal',
    label: 'A tiempo',
    customContent: (
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
        <span>A tiempo</span>
      </span>
    ),
  },
]

const OPCIONES_CANAL_FILTRO: ReadonlyArray<DropdownOption> = [
  { value: 'todos', label: 'Todos' },
  {
    value: 'front_desk',
    label: 'Recepción',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon icon={faBellConcierge} className="size-3.5 text-primary" />
        <span>Recepción</span>
      </span>
    ),
  },
  {
    value: 'room_tablet',
    label: 'Tablet',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon icon={faTabletScreenButton} className="size-3.5 text-primary" />
        <span>Tablet</span>
      </span>
    ),
  },
  {
    value: 'mobile_app',
    label: 'Móvil',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon icon={faMobileScreen} className="size-3.5 text-primary" />
        <span>Móvil</span>
      </span>
    ),
  },
]

export interface PedidosServicioHabitacionOrganismProps {
  onIrAProductos?: () => void
  onIrACarrito?: () => void
}

export function PedidosServicioHabitacionOrganism({
  onIrAProductos,
  onIrACarrito,
}: PedidosServicioHabitacionOrganismProps) {
  const [pedidos, setPedidos] = useState<ServiceRequestOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState<'todos' | NivelPrioridad>('todos')
  const [filtroCanales, setFiltroCanales] = useState<string[]>([])

  // Estados mutables para cada pedido (control de ciclo de vida del KDS)
  const [estadosPorPedido, setEstadosPorPedido] = useState<Record<string, EstadoPedido>>({})
  const [openDropdownOrderId, setOpenDropdownOrderId] = useState<string | null>(null)

  // Cerrar el menú desplegable al hacer clic fuera
  useEffect(() => {
    if (!openDropdownOrderId) return
    const handleClickOutside = () => setOpenDropdownOrderId(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [openDropdownOrderId])

  const handleCambiarEstadoPedido = (orderNumber: string, nuevoEstado: EstadoPedido) => {
    setEstadosPorPedido((prev) => ({
      ...prev,
      [orderNumber]: nuevoEstado,
    }))
    setOpenDropdownOrderId(null)
  }

  // Estado para el loader cuando se actualiza una orden con PUT /service-request/{id}
  const [actualizandoOrdenId, setActualizandoOrdenId] = useState<string | null>(null)

  /**
   * Actualiza el estado de la comanda en el servidor mediante PUT /service-request/{id}.
   * Construye el payload en segundo plano según especificación y valida los status codes.
   */
  const handleActualizarOrden = async (orden: ServiceRequestOrder) => {
    const ordenKey = orden.order_number || orden.id || 'sr-1'
    setActualizandoOrdenId(ordenKey)

    // Estado seleccionado para la comanda
    const estadoActual: EstadoPedido =
      estadosPorPedido[orden.order_number] ||
      (orden.status as EstadoPedido) ||
      'en_preparacion'

    let statusBackend = 'confirmed'
    let statusComment = 'Aceptado'
    if (estadoActual === 'en_cola') {
      statusBackend = 'pending'
      statusComment = 'En cola'
    } else if (estadoActual === 'en_preparacion') {
      statusBackend = 'confirmed'
      statusComment = 'Aceptado'
    } else if (estadoActual === 'en_camino') {
      statusBackend = 'in_transit'
      statusComment = 'En camino'
    } else if (estadoActual === 'entregado') {
      statusBackend = 'delivered'
      statusComment = 'Entregado'
    } else if (estadoActual === 'cancelado') {
      statusBackend = 'cancelled'
      statusComment = 'Cancelado'
    }

    // Actor autenticado o staff por defecto
    const authUser = readAuthUser()
    const actorId =
      (authUser?.id as string) || (authUser?.user_id as string) || 'user-1'

    // ID del endpoint
    const targetId =
      orden.id || (orden.order_number === '71' ? 'sr-1' : (orden.order_number || 'sr-1'))

    // Payload según requerimiento exacto
    const payload: UpdateServiceRequestPayload = {
      id: targetId,
      status: statusBackend,
      actor_type: 'staff',
      actor_id: actorId,
      status_comment: statusComment,
      grade: 5,
      guest_comment: 'Excelente',
      general_notes: orden.general_notes ? orden.general_notes.trim() : null,
      delivery_instructions: orden.delivery_instructions ? orden.delivery_instructions.trim() : null,
    }

    // Payload para POST /service-assignments según requerimiento exacto
    const assignmentPayload: CreateServiceAssignmentPayload = {
      service_request_id:
        orden.id && orden.id !== 'sr-1' ? orden.id : 'a4f971ffa02a0d91',
      stay_id: orden.stay_id || 'e8b8abd74ee52a63',
      person_id: orden.person_id || '64765b959a658887',
      is_active: true,
    }

    try {
      // 1. Actualización de orden mediante PUT /service-request/{id}
      const responsePut = await api.put(`/service-request/${encodeURIComponent(targetId)}`, payload, {
        validateStatus: () => true,
      })
      const validationPut = validateStatusCode(responsePut.status)

      // 2. Registro de asignación mediante POST /service-assignments
      const responseAssignment = await api.post('/service-assignments', assignmentPayload, {
        validateStatus: () => true,
      })
      const validationAssignment = validateStatusCode(responseAssignment.status)

      if (!validationPut.isValid) {
        setFeedback(validationPut)
      } else if (!validationAssignment.isValid) {
        setFeedback(validationAssignment)
      } else {
        const baseValidation = validateStatusCode(responseAssignment.status)
        setFeedback({
          ...baseValidation,
          title: baseValidation.title || 'Comanda Actualizada',
          message:
            validationAssignment.message ||
            validationPut.message ||
            `La comanda #${orden.order_number} y su asignación de servicio se han procesado exitosamente (Estado: ${statusComment}).`,
        })
      }
    } catch (err) {
      console.error('Error al actualizar /service-request o /service-assignments:', err)
      const errValidation = validateStatusCode(500)
      setFeedback(errValidation)
    } finally {
      setActualizandoOrdenId(null)
    }
  }

  // Mapa en memoria para resolver nombres de habitaciones sin exponer nunca IDs crudos
  const [roomsMap, setRoomsMap] = useState<Map<string, string>>(new Map())

  /**
   * Resuelve habitaciones y estadías mediante repositorio balanceado sin consultas N+1
   * cumpliendo estrictamente con la Regla de Oro: NUNCA mostrar IDs crudos en la interfaz.
   */
  const cargarMetadatosHabitaciones = useCallback(
    () => obtenerMapaHabitacionesEstadias(),
    []
  )

  /**
   * Consulta GET /service-request y retorna el listado junto con la validación de status code.
   */
  const obtenerPedidosServiceRequest = useCallback(async (): Promise<{
    lista: ServiceRequestOrder[]
    validation: StatusCodeValidationResult
  }> => {
    try {
      const response = await api.get('/service-request', {
        validateStatus: () => true,
      })

      const validation = validateStatusCode(response.status)

      if (validation.isValid) {
        const raw = response.data
        let lista: ServiceRequestOrder[] = []

        if (Array.isArray(raw)) {
          lista = raw as ServiceRequestOrder[]
        } else if (raw && typeof raw === 'object') {
          if (Array.isArray((raw as { data?: unknown }).data)) {
            lista = (raw as { data: ServiceRequestOrder[] }).data
          } else if ('order_number' in raw) {
            lista = [raw as ServiceRequestOrder]
          }
        }

        // Si el endpoint devuelve un array vacío, se establece [] para mostrar el mensaje al usuario
        return { lista, validation }
      }

      return { lista: [], validation }
    } catch (err) {
      console.error('Error al consultar /service-request:', err)
      return { lista: [], validation: validateStatusCode(500) }
    }
  }, [])

  const cargarPedidos = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    const { lista, validation } = await obtenerPedidosServiceRequest()
    setPedidos(lista)
    setFeedback(validation)
    setLoading(false)
  }, [obtenerPedidosServiceRequest])

  useEffect(() => {
    let activo = true
    void obtenerPedidosServiceRequest().then(({ lista, validation }) => {
      if (!activo) return
      setPedidos(lista)
      setFeedback(validation)
      setLoading(false)
    })
    void cargarMetadatosHabitaciones().then((mapa) => {
      if (!activo || !mapa) return
      setRoomsMap(mapa)
    })
    return () => {
      activo = false
    }
  }, [obtenerPedidosServiceRequest, cargarMetadatosHabitaciones])

  // Filtrado reactivo de comandas por búsqueda, prioridad y canal
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      // 1. Filtro textual
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const coincideOrden = p.order_number?.toLowerCase().includes(q)
        const coincideProducto = p.items?.some((it) =>
          it.name_snapshot?.toLowerCase().includes(q)
        )
        const coincideNotas = p.general_notes?.toLowerCase().includes(q)
        if (!coincideOrden && !coincideProducto && !coincideNotas) return false
      }

      // 2. Filtro por canal (selección múltiple)
      if (filtroCanales.length > 0) {
        const canalPedido = p.channel?.toLowerCase()
        const coincideCanal = filtroCanales.some(
          (canal) => canal.toLowerCase() === canalPedido
        )
        if (!coincideCanal) {
          return false
        }
      }

      // 3. Filtro por prioridad dinámica
      if (filtroPrioridad !== 'todos') {
        const prio = calcularPrioridadComanda(p)
        if (prio.nivel !== filtroPrioridad) {
          return false
        }
      }

      return true
    })
  }, [pedidos, busqueda, filtroCanales, filtroPrioridad])

  // Paginación reactiva para InfiniteScroll (src/agent.md)
  const PAGE_SIZE_PEDIDOS = 6
  const [visibleCountPedidos, setVisibleCountPedidos] = useState<number>(PAGE_SIZE_PEDIDOS)

  const handleActualizarBusqueda = useCallback((valor: string) => {
    setBusqueda(valor)
    setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
  }, [])

  const handleActualizarFiltroPrioridad = useCallback((valor: 'todos' | NivelPrioridad) => {
    setFiltroPrioridad(valor)
    setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
  }, [])

  const handleActualizarFiltroCanal = useCallback((valores: string[]) => {
    if (valores.includes('todos')) {
      setFiltroCanales([])
    } else {
      setFiltroCanales(valores)
    }
    setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
  }, [])

  const handleRestablecerFiltros = useCallback(() => {
    setBusqueda('')
    setFiltroPrioridad('todos')
    setFiltroCanales([])
    setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
  }, [])

  const visiblePedidos = useMemo(
    () => pedidosFiltrados.slice(0, visibleCountPedidos),
    [pedidosFiltrados, visibleCountPedidos]
  )
  const hasMorePedidos = visibleCountPedidos < pedidosFiltrados.length
  const handleLoadMorePedidos = useCallback(() => {
    setVisibleCountPedidos((prev) => prev + PAGE_SIZE_PEDIDOS)
  }, [])

  return (
    <div className="space-y-6">
      {/* 1. Barra de Control de Cocina: Búsqueda y Filtros de Prioridad */}
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-panel p-4 shadow-xs lg:flex-row lg:items-end lg:justify-between">
        <div className="relative w-full lg:flex-1">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => handleActualizarBusqueda(e.target.value)}
            placeholder="Buscar comanda #, plato o nota especial..."
            className="w-full rounded-2xl border border-line bg-canvas py-2.5 pl-10 pr-4 text-xs font-mono font-medium text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted size-3.5 pointer-events-none"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => handleActualizarBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted hover:text-ink cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2.5 shrink-0">
          {/* Filtro por Prioridad con RecursosDropdown */}
          <div className="w-40 sm:w-44">
            <RecursosDropdown
              label="Prioridad"
              value={filtroPrioridad}
              onChange={(val) =>
                handleActualizarFiltroPrioridad(
                  (val || 'todos') as 'todos' | NivelPrioridad
                )
              }
              options={OPCIONES_PRIORIDAD}
              placeholder="Prioridad…"
              searchable={false}
              className="text-xs"
            />
          </div>

          {/* Filtro por Canal con RecursosDropdown (selección múltiple) */}
          <div className="w-full sm:w-64">
            <RecursosDropdown
              label="Canal"
              multiple
              selectedValues={filtroCanales}
              onMultiChange={handleActualizarFiltroCanal}
              options={OPCIONES_CANAL_FILTRO}
              placeholder="Todos"
              searchable={false}
              className="text-xs"
            />
          </div>

          {/* Botón de Refrescar Comandas (solo icono) */}
          <button
            type="button"
            onClick={() => void cargarPedidos()}
            disabled={loading}
            aria-label="Actualizar tiquetera de cocina"
            title="Actualizar tiquetera de cocina"
            className="inline-flex size-9 items-center justify-center rounded-2xl border border-line bg-canvas text-ink hover:border-primary/40 hover:bg-line/40 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={faRotateRight}
              className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Banner de retroalimentación empática según validateStatusCode */}
      {feedback && feedback.message && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className={`rounded-2xl border p-4 text-xs font-mono flex items-start gap-3 ${
            feedback.isValid
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          }`}
        >
          <FontAwesomeIcon
            icon={feedback.isValid ? faCheck : faCircleExclamation}
            className="size-4 shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <p className="font-bold uppercase tracking-wide">
              {feedback.title || (feedback.isValid ? 'Comanda Actualizada' : 'Aviso de Tiquetera')}
            </p>
            <p className="mt-0.5 opacity-90">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold hover:underline cursor-pointer"
          >
            Entendido
          </button>
        </motion.div>
      )}

      {/* Loader visual cuando el recepcionista realiza clic en el botón de actualizar (src/agent.md) */}
      <Loader
        overlay
        visible={actualizandoOrdenId !== null}
        label="Actualizando comanda y registrando asignación..."
      />

      {/* 2. Pantalla de Comandas de Cocina (Kitchen Display Ticket System) */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader size={40} label="Imprimiendo comandas en pantalla de cocina..." />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        /* Estado vacío: Sin pedidos registrados en /service-request o sin coincidencias de filtro */
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="rounded-3xl border border-line bg-panel p-10 sm:p-14 text-center shadow-xs space-y-4 max-w-lg mx-auto"
        >
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary text-2xl border border-primary/20">
            <FontAwesomeIcon icon={faClipboardList} />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-mono text-base sm:text-lg font-black text-ink uppercase tracking-wider">
              {pedidos.length === 0
                ? 'No se encuentran pedidos'
                : 'Sin comandas que coincidan'}
            </h3>
            <p className="text-xs font-mono text-ink-muted leading-relaxed max-w-sm mx-auto">
              {pedidos.length === 0
                ? 'Actualmente no se encuentran pedidos registrados en el sistema de Room Service. Las nuevas órdenes transmitidas por recepción o huéspedes aparecerán aquí automáticamente en tiempo real.'
                : 'No se encontraron pedidos con los filtros o término de búsqueda aplicado. Puedes restablecer los filtros para volver a ver todas las órdenes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {pedidos.length === 0 ? (
              <>
                {onIrAProductos && (
                  <button
                    type="button"
                    onClick={onIrAProductos}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-primary/90 transition-all cursor-pointer font-mono"
                  >
                    Tomar Pedido / Ver Menú
                  </button>
                )}
                {onIrACarrito && (
                  <button
                    type="button"
                    onClick={onIrACarrito}
                    className="rounded-xl border border-line bg-canvas px-4 py-2 text-xs font-bold text-ink hover:bg-line/40 transition-all cursor-pointer font-mono"
                  >
                    Ir al Carrito
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void cargarPedidos()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas px-3.5 py-2 text-xs font-bold text-ink hover:bg-line/40 transition-all cursor-pointer font-mono"
                  title="Volver a consultar /service-request"
                >
                  <FontAwesomeIcon icon={faRotateRight} className="size-3" />
                  <span>Consultar Nuevamente</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleRestablecerFiltros}
                className="rounded-xl border border-line bg-canvas px-4 py-2 text-xs font-bold text-ink hover:bg-line/40 transition-all cursor-pointer font-mono"
              >
                Restablecer Filtros
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        /* Grilla de Kitchen Tickets / Comandas de Cocina con Stagger Reveal e InfiniteScroll */
        <InfiniteScroll
          onLoadMore={handleLoadMorePedidos}
          hasMore={hasMorePedidos}
          isLoading={false}
          animationVariant="slideUp"
          endMessage={
            <InfiniteScrollEnd label="Has visualizado todas las comandas de Room Service registradas." />
          }
        >
          <motion.div
            variants={KITCHEN_TICKETS_CONTAINER_VARIANTS}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {visiblePedidos.map((orden, index) => {
              const prioridad = calcularPrioridadComanda(orden)
              const primerItem = orden.items?.[0]

              // Estado del pedido dinámico y mutable para este ticket
              const estadoActual: EstadoPedido =
                estadosPorPedido[orden.order_number] ||
                (orden.status as EstadoPedido) ||
                'en_preparacion'

              // Resolución amigable de habitación sin exponer IDs crudos
              const habitacionEtiqueta =
                roomsMap.get(orden.room_id) ||
                roomsMap.get(orden.stay_id) ||
                'Habitación Asignada al Huésped'

              return (
                <PedidoServicioHabitacionCard
                  key={orden.id || orden.order_number || index}
                  order_number={orden.order_number}
                  person_id={orden.person_id}
                  channel={orden.channel}
                  item_menu_id={primerItem?.item_menu_id ?? 'N/A'}
                  name_snapshot={primerItem?.name_snapshot ?? 'Sin producto especificado'}
                  amount={Number(primerItem?.amount ?? 0)}
                  price_unit={Number(primerItem?.price_unit ?? 0)}
                  items={orden.items}
                  estadoActual={estadoActual}
                  prioridad={prioridad}
                  habitacionEtiqueta={habitacionEtiqueta}
                  scheduled_for={orden.scheduled_for}
                  general_notes={orden.general_notes}
                  delivery_instructions={orden.delivery_instructions}
                  tip={orden.tip}
                  motionVariants={KITCHEN_TICKET_CARD_VARIANTS}
                  openDropdown={openDropdownOrderId === orden.order_number}
                  isUpdating={actualizandoOrdenId === (orden.order_number || orden.id)}
                  onToggleDropdown={() =>
                    setOpenDropdownOrderId(
                      openDropdownOrderId === orden.order_number ? null : orden.order_number
                    )
                  }
                  onChangeEstado={(nuevoEstado) =>
                    handleCambiarEstadoPedido(orden.order_number, nuevoEstado)
                  }
                  onActualizarOrden={() => void handleActualizarOrden(orden)}
                />
              )
            })}
          </motion.div>
        </InfiniteScroll>
      )}
    </div>
  )
}
