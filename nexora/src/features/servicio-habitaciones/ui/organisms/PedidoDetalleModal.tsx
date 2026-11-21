import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ComponentType,
} from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import {
  PlanetAlert,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'
import { Input } from '../../../../shared/ui/Input'
import type {
  EstadoActualizablePedido,
  PedidoComandaIndexado,
} from '../../application/use-pedidos-servicio-habitacion'
import type { ServiceRequestOrder } from '../../domain/pedidos-servicio-habitacion'
import {
  resolverDetalleHuespedPorId,
  resolverMapaImagenesItemMenuPedidos,
  type PersonaBasicaPedido,
} from '../../infrastructure/pedidos-metadatos-resolver'
import { VirtualizedCardSlot } from '../atoms/VirtualizedCardSlot'
import { ImageBalancerStatusBanner } from '../molecules/ImageBalancerStatusBanner'
import { PedidoDetalleHuespedCard } from '../molecules/PedidoDetalleHuespedCard'
import { PedidoDetalleModalFooter } from '../molecules/PedidoDetalleModalFooter'
import { PedidoDetalleModalHeader } from '../molecules/PedidoDetalleModalHeader'
import { PedidoDetalleProductoCard } from '../molecules/PedidoDetalleProductoCard'
import type { PedidoEstadoGuardadoOverlayProps } from '../molecules/PedidoEstadoGuardadoOverlay'

const LazyPedidoEstadoGuardadoOverlay = lazy<
  ComponentType<PedidoEstadoGuardadoOverlayProps>
>(async () => {
  try {
    const mod = await import('../molecules/PedidoEstadoGuardadoOverlay')
    return { default: mod.PedidoEstadoGuardadoOverlay }
  } catch (error) {
    console.error('Error loading PedidoEstadoGuardadoOverlay:', error)
    const Fallback: ComponentType<PedidoEstadoGuardadoOverlayProps> = () => null
    return { default: Fallback }
  }
})

export interface PedidoDetalleModalProps {
  pedido: PedidoComandaIndexado | null
  estadoActual: EstadoActualizablePedido
  isUpdating: boolean
  onClose: () => void
  onChangeEstadoById: (
    ordenKey: string,
    nuevoEstado: EstadoActualizablePedido,
  ) => void
  onActualizarOrden: (
    orden: ServiceRequestOrder,
    ordenKey: string,
    estadoActual: EstadoActualizablePedido,
  ) => Promise<StatusCodeValidationResult | void>
}

/**
 * Organismo: Modal optimizado para visualizar el detalle de un pedido desde recepción.
 * Incluye información básica del huésped, búsqueda en tiempo real con `Input`,
 * cards individuales de productos con foto/precio/cantidad, precio a pagar y estado en footer.
 */
export const PedidoDetalleModal = memo(function PedidoDetalleModal({
  pedido,
  estadoActual,
  isUpdating,
  onClose,
  onChangeEstadoById,
  onActualizarOrden,
}: PedidoDetalleModalProps) {
  const [busqueda, setBusqueda] = useState('')
  const busquedaDiferida = useDeferredValue(busqueda)

  const [personaState, setPersonaState] = useState<{
    resolvedForId: string
    persona: PersonaBasicaPedido | null
  }>({ resolvedForId: '', persona: null })

  const [imagenesItemsMap, setImagenesItemsMap] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [updateValidation, setUpdateValidation] =
    useState<StatusCodeValidationResult | null>(null)

  const orden = pedido?.orden
  const ordenKey = pedido?.ordenKey ?? ''
  const personId = orden?.person_id?.trim() || ''

  const handleSafeClose = useCallback(() => {
    try {
      if (!isUpdating) onClose()
    } catch (error) {
      console.error('Error al cerrar modal de detalle del pedido:', error)
    }
  }, [isUpdating, onClose])

  useEffect(() => {
    if (!pedido) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSafeClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSafeClose, pedido])

  useEffect(() => {
    let activo = true

    const cargarMetadatosModal = async () => {
      try {
        const [personaRes, imagenesRes] = await Promise.allSettled([
          personId ? resolverDetalleHuespedPorId(personId) : Promise.resolve(null),
          resolverMapaImagenesItemMenuPedidos(),
        ])
        if (!activo) return

        if (personId) {
          setPersonaState({
            resolvedForId: personId,
            persona: personaRes.status === 'fulfilled' ? personaRes.value : null,
          })
        }
        if (imagenesRes.status === 'fulfilled') {
          setImagenesItemsMap(imagenesRes.value)
        }
      } catch (error) {
        console.error('Error cargando detalles del pedido en modal:', error)
      }
    }

    void Promise.resolve().then(() => cargarMetadatosModal())

    return () => {
      activo = false
    }
  }, [personId])

  const handleBusquedaChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value)
  }, [])

  const handleLimpiarBusqueda = useCallback(() => {
    setBusqueda('')
  }, [])

  const handleChangeEstado = useCallback(
    (nuevoEstado: EstadoActualizablePedido) => {
      if (!ordenKey) return
      try {
        onChangeEstadoById(ordenKey, nuevoEstado)
      } catch (error) {
        console.error('Error al cambiar estado del pedido:', error)
      }
    },
    [onChangeEstadoById, ordenKey],
  )

  const handleActualizarEstado = useCallback(() => {
    if (!orden || !ordenKey) return
    setUpdateValidation(null)
    void (async () => {
      try {
        const result = await onActualizarOrden(orden, ordenKey, estadoActual)
        if (result) {
          setUpdateValidation(result)
        }
      } catch (error) {
        console.error('Error al guardar estado desde el modal:', error)
      }
    })()
  }, [estadoActual, onActualizarOrden, orden, ordenKey])

  const handleDismissValidation = useCallback(() => {
    setUpdateValidation(null)
  }, [])

  const itemsPedido = useMemo(() => orden?.items ?? [], [orden?.items])

  const itemsFiltrados = useMemo(() => {
    const query = busquedaDiferida.trim().toLowerCase()
    if (!query) return itemsPedido

    return itemsPedido.filter((item) => {
      const coincideNombre = item.name_snapshot?.toLowerCase().includes(query)
      const coincideNota = item.note?.toLowerCase().includes(query)
      return Boolean(coincideNombre || coincideNota)
    })
  }, [busquedaDiferida, itemsPedido])

  if (!pedido || !orden) return null

  const cargandoPersona = Boolean(personId) && personaState.resolvedForId !== personId
  const personaActual =
    personId && personaState.resolvedForId === personId ? personaState.persona : null

  return (
    <>
      <Suspense fallback={null}>
        <LazyPedidoEstadoGuardadoOverlay visible={isUpdating} />
      </Suspense>

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div
          onClick={handleSafeClose}
          className="bg-ink/60 fixed inset-0 transition-opacity"
          aria-hidden="true"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-detalle-pedido-titulo"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="border-line bg-panel relative z-10 my-8 flex w-full max-w-2xl flex-col overflow-visible rounded-3xl border font-sans shadow-2xl"
        >
          <PedidoDetalleModalHeader
            categoriaNombre={pedido.categoriaNombre}
            orderNumber={orden.order_number}
            filteredCount={itemsFiltrados.length}
            totalCount={itemsPedido.length}
            hasSearchQuery={Boolean(busqueda.trim())}
            isUpdating={isUpdating}
            onClose={handleSafeClose}
          />

        {/* Buscador en tiempo real con src/shared/ui/Input.tsx */}
        {itemsPedido.length > 0 && (
          <div className="border-line/70 bg-canvas/30 border-b px-6 py-3">
            <Input
              value={busqueda}
              onChange={handleBusquedaChange}
              placeholder="Buscar producto del pedido por nombre o nota..."
              aria-label="Buscar productos del pedido"
              icon={<FontAwesomeIcon icon={faMagnifyingGlass} className="size-3.5" />}
              action={
                busqueda ? (
                  <button
                    type="button"
                    onClick={handleLimpiarBusqueda}
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                    className="text-ink-muted hover:bg-canvas hover:text-ink grid size-6 cursor-pointer place-items-center rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="size-3" />
                  </button>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Cuerpo: Información del huésped + lista de cards de productos */}
        <div className="max-h-[55vh] space-y-4 overflow-y-auto p-6">
          {updateValidation?.alertProps && (
            <PlanetAlert
              {...updateValidation.alertProps}
              dismissible
              onClose={handleDismissValidation}
            />
          )}

          <PedidoDetalleHuespedCard
            huespedNombreFallback={pedido.huespedNombre}
            persona={personaActual}
            habitacionEtiqueta={pedido.habitacionEtiqueta}
            cargando={cargandoPersona}
          />

          <ImageBalancerStatusBanner />

          {itemsFiltrados.length > 0 ? (
            <div role="list" className="space-y-3">
              {itemsFiltrados.map((item, idx) => (
                <VirtualizedCardSlot
                  key={`${item.item_menu_id || item.name_snapshot}-${idx}`}
                  estimatedHeight={96}
                  className="w-full"
                >
                  <PedidoDetalleProductoCard
                    item={item}
                    imageUrl={
                      item.item_menu_id ? imagenesItemsMap.get(item.item_menu_id) : undefined
                    }
                  />
                </VirtualizedCardSlot>
              ))}
            </div>
          ) : (
            <div className="border-line bg-canvas/40 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-8 text-center">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-ink-muted size-5" />
              <div className="space-y-1">
                <p className="text-ink text-sm font-bold">
                  Sin productos que coincidan con "{busqueda}"
                </p>
                <p className="text-ink-muted text-xs">
                  Intenta con otro nombre o limpia el filtro de búsqueda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLimpiarBusqueda}
                className="border-line bg-panel text-ink hover:border-primary/40 cursor-pointer rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>

        {/* Footer: Precio a pagar del huésped + Estado del pedido + Cerrar */}
        <PedidoDetalleModalFooter
          precioFormateado={pedido.precioFormateado}
          tip={orden.tip}
          estadoActual={estadoActual}
          isUpdating={isUpdating}
          onChangeEstado={handleChangeEstado}
          onActualizarEstado={handleActualizarEstado}
          onClose={handleSafeClose}
        />
        </motion.div>
      </div>
    </>
  )
})
