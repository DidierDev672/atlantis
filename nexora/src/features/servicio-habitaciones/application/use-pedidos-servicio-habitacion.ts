import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { sleep } from '../../reservas/infrastructure/api-load-balancer'
import { formatearMonedaCOP } from '../domain/item-menu'
import { obtenerMapaHabitacionesEstadias } from '../infrastructure/api-estadias-recepcion-repository'
import {
  actualizarOrdenYAsignacionApi,
  fetchPedidosServiceRequestApi,
} from '../infrastructure/api-pedidos-servicio-repository'
import {
  construirEtiquetaCategoriaOrden,
  resolverMapaItemCategoriaPedidos,
  resolverNombresHuespedesPedidos,
} from '../infrastructure/pedidos-metadatos-resolver'
import {
  calcularPrioridadComanda,
  dateToLocalIsoKey,
  esPedidoEntregado,
  formatearFechaVenta,
  resolverEstadoPedidoNormalizado,
  resolverFechaVentaClave,
  type EstadoPedido,
  type NivelPrioridad,
  type PrioridadInfo,
  type ServiceRequestOrder,
} from '../domain/pedidos-servicio-habitacion'
import type { ServiceRequestBackendStatus } from '../domain/service-request-status'

export type EstadoActualizablePedido = EstadoPedido | ServiceRequestBackendStatus

export interface PedidoComandaIndexado {
  orden: ServiceRequestOrder
  ordenKey: string
  huespedNombre: string
  categoriaNombre: string
  precioTotal: number
  precioFormateado: string
  fechaVentaTexto: string
  fechaVentaClave: string | null
  prioridad: PrioridadInfo
  habitacionEtiqueta: string
  estadoNormalizado: EstadoPedido | null
  isDelivered: boolean
}

const PAGE_SIZE_PEDIDOS = 10
const INCREMENT_STEP_PEDIDOS = 5

function resolverOrdenKey(orden: ServiceRequestOrder, index: number): string {
  return orden.id || orden.order_number || `orden-${index}`
}

function calcularPrecioTotalPedido(orden: ServiceRequestOrder): number {
  try {
    const subtotal = (orden.items ?? []).reduce((acc, item) => {
      const unit = Number(item.price_unit) || 0
      const qty = Number(item.amount) || 0
      return acc + unit * qty
    }, 0)
    const propina = Number(orden.tip) || 0
    return subtotal + propina
  } catch (error) {
    console.error('Error al calcular precio total del pedido:', error)
    return 0
  }
}

/**
 * Hook de aplicación para la tabla de historial de ventas (`/service-request`).
 * Resuelve en paralelo nombres de huéspedes, categorías y habitaciones una sola vez
 * por carga (`pedidosIndexados`), optimizando filtros, memoria y re-renders.
 */
export function usePedidosServicioHabitacion() {
  const [pedidos, setPedidos] = useState<ServiceRequestOrder[]>([])
  const [roomsMap, setRoomsMap] = useState<Map<string, string>>(() => new Map())
  const [personasMap, setPersonasMap] = useState<Map<string, string>>(() => new Map())
  const [itemCategoriaMap, setItemCategoriaMap] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [loading, setLoading] = useState(true)
  const [cargandoMetadatos, setCargandoMetadatos] = useState(false)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const busquedaDiferida = useDeferredValue(busqueda)
  const [filtroPrioridad, setFiltroPrioridad] = useState<'todos' | NivelPrioridad>('todos')
  const [filtroCanales, setFiltroCanales] = useState<string[]>([])
  const [filtroFechaVenta, setFiltroFechaVenta] = useState<Date | null>(null)
  const [estadosPorPedido, setEstadosPorPedido] = useState<
    Record<string, EstadoActualizablePedido>
  >({})
  const [openDropdownOrderId, setOpenDropdownOrderId] = useState<string | null>(null)
  const [actualizandoOrdenId, setActualizandoOrdenId] = useState<string | null>(null)
  const [ordenDetalleKey, setOrdenDetalleKey] = useState<string | null>(null)
  const [visibleCountPedidos, setVisibleCountPedidos] = useState<number>(PAGE_SIZE_PEDIDOS)

  const isMountedRef = useRef(true)

  useEffect(() => {
    if (!openDropdownOrderId) return
    const handleClickOutside = () => setOpenDropdownOrderId(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [openDropdownOrderId])

  const resolverMetadatosEnSegundoPlano = useCallback(
    async (listaPedidos: ReadonlyArray<ServiceRequestOrder>) => {
      if (isMountedRef.current) setCargandoMetadatos(true)
      try {
        const [roomsRes, categoriasRes, personasRes] = await Promise.allSettled([
          obtenerMapaHabitacionesEstadias(),
          resolverMapaItemCategoriaPedidos(),
          resolverNombresHuespedesPedidos(listaPedidos),
        ])
        if (!isMountedRef.current) return

        if (roomsRes.status === 'fulfilled' && roomsRes.value) {
          setRoomsMap(roomsRes.value)
        }
        if (categoriasRes.status === 'fulfilled') {
          setItemCategoriaMap(categoriasRes.value)
        }
        if (personasRes.status === 'fulfilled') {
          setPersonasMap(personasRes.value)
        }
      } catch (error) {
        console.error('Error al resolver metadatos de tabla de pedidos:', error)
      } finally {
        if (isMountedRef.current) setCargandoMetadatos(false)
      }
    },
    [],
  )

  const cargarPedidos = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const { lista, validation } = await fetchPedidosServiceRequestApi()
      if (!isMountedRef.current) return
      setPedidos(lista)
      setFeedback(validation)
      void resolverMetadatosEnSegundoPlano(lista)
    } catch (error) {
      console.error('Error al cargar historial de ventas (/service-request):', error)
      if (isMountedRef.current) {
        setFeedback(validateStatusCode(500))
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [resolverMetadatosEnSegundoPlano])

  useEffect(() => {
    isMountedRef.current = true
    void Promise.resolve().then(() => cargarPedidos())
    return () => {
      isMountedRef.current = false
    }
  }, [cargarPedidos])

  const handleToggleDropdownById = useCallback((ordenKey: string) => {
    setOpenDropdownOrderId((prev) => (prev === ordenKey ? null : ordenKey))
  }, [])

  const handleChangeEstadoById = useCallback(
    (ordenKey: string, nuevoEstado: EstadoActualizablePedido) => {
      setEstadosPorPedido((prev) => ({
        ...prev,
        [ordenKey]: nuevoEstado,
      }))
      setOpenDropdownOrderId(null)
    },
    [],
  )

  const handleActualizarOrden = useCallback(
    async (
      orden: ServiceRequestOrder,
      ordenKey: string,
      estadoActual: EstadoActualizablePedido,
    ): Promise<StatusCodeValidationResult> => {
      setActualizandoOrdenId(ordenKey)
      try {
        const [validation] = await Promise.all([
          actualizarOrdenYAsignacionApi(orden, estadoActual),
          sleep(1600),
        ])
        if (isMountedRef.current) {
          if (validation.isValid) {
            setPedidos((prev) =>
              prev.map((item, idx) =>
                resolverOrdenKey(item, idx) === ordenKey
                  ? { ...item, status: estadoActual }
                  : item,
              ),
            )
          }
          setFeedback(validation)
        }
        return validation
      } catch (error) {
        console.error('Error al actualizar comanda:', error)
        const fallbackError = validateStatusCode(500)
        if (isMountedRef.current) {
          setFeedback(fallbackError)
        }
        return fallbackError
      } finally {
        if (isMountedRef.current) {
          setActualizandoOrdenId(null)
        }
      }
    },
    [],
  )

  // Índice memoizado con Huésped (solo nombre), Categoría, Precio a pagar y Prioridad
  const pedidosIndexados = useMemo<PedidoComandaIndexado[]>(
    () =>
      pedidos.map((orden, index) => {
        const personId = orden.person_id?.trim()
        const nombreResuelto = personId ? personasMap.get(personId) : undefined
        const huespedNombre =
          nombreResuelto || (cargandoMetadatos ? 'Cargando huésped…' : 'Huésped registrado')
        const categoriaNombre = construirEtiquetaCategoriaOrden(orden, itemCategoriaMap)
        const precioTotal = calcularPrecioTotalPedido(orden)

        return {
          orden,
          ordenKey: resolverOrdenKey(orden, index),
          huespedNombre,
          categoriaNombre,
          precioTotal,
          precioFormateado: formatearMonedaCOP(precioTotal),
          fechaVentaTexto: formatearFechaVenta(orden),
          fechaVentaClave: resolverFechaVentaClave(orden),
          prioridad: calcularPrioridadComanda(orden),
          habitacionEtiqueta:
            roomsMap.get(orden.room_id) ||
            roomsMap.get(orden.stay_id) ||
            'Habitación Asignada al Huésped',
          estadoNormalizado: resolverEstadoPedidoNormalizado(orden.status),
          isDelivered: esPedidoEntregado(orden.status),
        }
      }),
    [cargandoMetadatos, itemCategoriaMap, pedidos, personasMap, roomsMap],
  )

  const filtroFechaClave = useMemo(
    () => dateToLocalIsoKey(filtroFechaVenta),
    [filtroFechaVenta],
  )

  const pedidosFiltrados = useMemo(() => {
    const query = busquedaDiferida.trim().toLowerCase()

    return pedidosIndexados.filter(
      ({ orden, huespedNombre, categoriaNombre, fechaVentaTexto, fechaVentaClave, prioridad }) => {
        if (filtroFechaClave && fechaVentaClave !== filtroFechaClave) {
          return false
        }

        if (query) {
          const coincideHuesped = huespedNombre.toLowerCase().includes(query)
          const coincideCategoria = categoriaNombre.toLowerCase().includes(query)
          const coincideOrden = orden.order_number?.toLowerCase().includes(query)
          const coincideFecha = fechaVentaTexto.toLowerCase().includes(query)
          const coincideProducto = orden.items?.some((it) =>
            it.name_snapshot?.toLowerCase().includes(query),
          )
          const coincideNotas = orden.general_notes?.toLowerCase().includes(query)
          if (
            !coincideHuesped &&
            !coincideCategoria &&
            !coincideOrden &&
            !coincideFecha &&
            !coincideProducto &&
            !coincideNotas
          ) {
            return false
          }
        }

        if (filtroCanales.length > 0) {
          const canalPedido = orden.channel?.toLowerCase()
          const coincideCanal = filtroCanales.some(
            (canal) => canal.toLowerCase() === canalPedido,
          )
          if (!coincideCanal) return false
        }

        if (filtroPrioridad !== 'todos' && prioridad.nivel !== filtroPrioridad) {
          return false
        }

        return true
      },
    )
  }, [busquedaDiferida, filtroCanales, filtroFechaClave, filtroPrioridad, pedidosIndexados])

  const pedidoDetalleSeleccionado = useMemo(() => {
    if (!ordenDetalleKey) return null
    return pedidosIndexados.find((p) => p.ordenKey === ordenDetalleKey) ?? null
  }, [ordenDetalleKey, pedidosIndexados])

  const handleActualizarBusqueda = useCallback((valor: string) => {
    setBusqueda(valor)
    setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
  }, [])

  const handleActualizarFiltroPrioridad = useCallback(
    (valor: 'todos' | NivelPrioridad) => {
      setFiltroPrioridad(valor)
      setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
    },
    [],
  )

  const handleActualizarFiltroCanal = useCallback((valores: string[]) => {
    if (valores.includes('todos')) {
      setFiltroCanales([])
    } else {
      setFiltroCanales(valores)
    }
    setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
  }, [])

  const handleActualizarFiltroFechaVenta = useCallback((fecha: Date | null) => {
    try {
      setFiltroFechaVenta(fecha)
      setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
    } catch (error) {
      console.error('Error al actualizar filtro de fecha de venta:', error)
    }
  }, [])

  const handleRestablecerFiltros = useCallback(() => {
    setBusqueda('')
    setFiltroPrioridad('todos')
    setFiltroCanales([])
    setFiltroFechaVenta(null)
    setVisibleCountPedidos(PAGE_SIZE_PEDIDOS)
  }, [])

  const visiblePedidos = useMemo(
    () => pedidosFiltrados.slice(0, visibleCountPedidos),
    [pedidosFiltrados, visibleCountPedidos],
  )
  const hasMorePedidos = visibleCountPedidos < pedidosFiltrados.length

  const handleLoadMorePedidos = useCallback(() => {
    setVisibleCountPedidos((prev) => prev + PAGE_SIZE_PEDIDOS)
  }, [])

  const handleMostrarCincoMas = useCallback(() => {
    setVisibleCountPedidos((prev) => prev + INCREMENT_STEP_PEDIDOS)
  }, [])

  const clearDraftStatusByKey = useCallback((ordenKey: string | null) => {
    if (!ordenKey) return
    try {
      setEstadosPorPedido((prev) => {
        if (!(ordenKey in prev)) return prev
        const next = { ...prev }
        delete next[ordenKey]
        return next
      })
    } catch (error) {
      console.error('Error al limpiar borrador de estado del pedido:', error)
    }
  }, [])

  const handleAbrirDetalle = useCallback(
    (ordenKey: string) => {
      clearDraftStatusByKey(ordenKey)
      setOrdenDetalleKey(ordenKey)
    },
    [clearDraftStatusByKey],
  )

  const handleCerrarDetalle = useCallback(() => {
    clearDraftStatusByKey(ordenDetalleKey)
    setOrdenDetalleKey(null)
    setOpenDropdownOrderId(null)
  }, [clearDraftStatusByKey, ordenDetalleKey])

  const handleDismissFeedback = useCallback(() => {
    setFeedback(null)
  }, [])

  return {
    pedidos,
    pedidosFiltrados,
    visiblePedidos,
    pedidoDetalleSeleccionado,
    loading,
    feedback,
    busqueda,
    filtroPrioridad,
    filtroCanales,
    filtroFechaVenta,
    estadosPorPedido,
    openDropdownOrderId,
    actualizandoOrdenId,
    hasMorePedidos,
    cargarPedidos,
    handleDismissFeedback,
    handleActualizarBusqueda,
    handleActualizarFiltroPrioridad,
    handleActualizarFiltroCanal,
    handleActualizarFiltroFechaVenta,
    handleRestablecerFiltros,
    handleLoadMorePedidos,
    handleMostrarCincoMas,
    handleAbrirDetalle,
    handleCerrarDetalle,
    handleToggleDropdownById,
    handleChangeEstadoById,
    handleActualizarOrden,
  }
}
