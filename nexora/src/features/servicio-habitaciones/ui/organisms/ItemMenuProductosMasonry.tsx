import { useState, useEffect, useMemo, useRef, useSyncExternalStore, useTransition } from 'react'
import { AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import { requestProductosMenu } from '../../infrastructure/api-item-menu-repository'
import {
  getImageLoadBalancerSnapshot,
  subscribeImageLoadBalancer,
} from '../../infrastructure/image-load-balancer'
import { useCarritoStore } from '../../application/carrito-store'
import {
  StatusCodeAlert,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'
import { Loading, useDelayVisibility } from '../../../../shared/loading'
import { CarritoFlotanteFab } from '../atoms/CarritoFlotanteFab'
import { ItemMenuProductoCard } from '../molecules/ItemMenuProductoCard'
import { ItemMenuProductoModalDetalle } from '../molecules/ItemMenuProductoModalDetalle'
import {
  ProductosMasonryNavbar,
  type FiltroDieta,
} from '../molecules/ProductosMasonryNavbar'
import { ProductosVisualizacionNavbar } from '../molecules/ProductosVisualizacionNavbar'
import { ItemMenuProductosEmptyState } from '../molecules/ItemMenuProductosEmptyState'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import { CarritoProductosModal } from './CarritoProductosModal'
import {
  LazyAnimatedWrapper,
  InfiniteScroll,
  InfiniteScrollEnd,
} from '../../../../shared/ui'
import type { ItemMenuProducto } from '../../domain/item-menu'

const PAGE_SIZE = 8

export interface ItemMenuProductosMasonryProps {
  onAgregarNuevo?: () => void
  onIrACarrito?: () => void
}

export function ItemMenuProductosMasonry({
  onAgregarNuevo,
  onIrACarrito,
}: ItemMenuProductosMasonryProps) {
  const [productos, setProductos] = useState<ItemMenuProducto[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<ItemMenuProducto | null>(null)
  const [isCarritoModalOpen, setIsCarritoModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroDieta, setFiltroDieta] = useState<FiltroDieta>('todos')
  const [viewMode, setViewMode] = useState<LayoutViewMode>('grid')
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE)
  const [, startTransition] = useTransition()
  const isMountedRef = useRef(true)
  const totalArticulosCarrito = useCarritoStore((s) =>
    s.items.reduce((acc, curr) => acc + curr.cantidad, 0)
  )
  const [organizando, setOrganizando] = useState(false)
  const showOrganizando = useDelayVisibility(organizando, { delay: 0, minDuration: 400 })
  const showLoading = useDelayVisibility(loading, { delay: 0, minDuration: 450 })
  const imageBalancer = useSyncExternalStore(
    subscribeImageLoadBalancer,
    getImageLoadBalancerSnapshot
  )
  const showImageBalancerLoading = useDelayVisibility(
    imageBalancer.isRunning && !loading,
    { delay: 0, minDuration: 350 }
  )

  useEffect(() => {
    isMountedRef.current = true
    void requestProductosMenu().then((res) => {
      if (!isMountedRef.current) return
      setProductos(res.productos)
      setFeedback(res.feedback)
      setLoading(false)
    })
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const cargarProductos = async () => {
    setLoading(true)
    setFeedback(null)
    const res = await requestProductosMenu()
    if (!isMountedRef.current) return
    setProductos(res.productos)
    setFeedback(res.feedback)
    setLoading(false)
  }

  // Filtrado y ordenamiento reactivo fluido en memoria (Todos, Precio Alto, Precio Menor, Disponibles)
  const productosFiltrados = useMemo(() => {
    const filtrados = productos.filter((item) => {
      // 1. Filtro textual
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const coincideNombre = item.name.toLowerCase().includes(q)
        const coincideDesc = item.description ? item.description.toLowerCase().includes(q) : false
        if (!coincideNombre && !coincideDesc) return false
      }

      // 2. Filtro de disponibilidad
      if (filtroDieta === 'disponibles') {
        return item.available !== false
      }

      return true
    })

    // 3. Ordenamiento reactivo según el filtro de precio o alfabético seleccionado
    if (filtroDieta === 'precio-alto') {
      return [...filtrados].sort((a, b) => Number(b.price) - Number(a.price))
    }
    if (filtroDieta === 'precio-menor') {
      return [...filtrados].sort((a, b) => Number(a.price) - Number(b.price))
    }
    if (filtroDieta === 'orden-az') {
      return [...filtrados].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      )
    }
    if (filtroDieta === 'orden-za') {
      return [...filtrados].sort((a, b) =>
        b.name.localeCompare(a.name, 'es', { sensitivity: 'base' })
      )
    }

    return filtrados
  }, [productos, busqueda, filtroDieta])

  const visibleProductos = useMemo(
    () => productosFiltrados.slice(0, visibleCount),
    [productosFiltrados, visibleCount]
  )
  const hasMore = visibleCount < productosFiltrados.length
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const handleBusquedaChange = (val: string) => {
    startTransition(() => {
      setBusqueda(val)
      setVisibleCount(PAGE_SIZE)
    })
  }

  const handleLimpiarBusqueda = () => {
    setBusqueda('')
    setVisibleCount(PAGE_SIZE)
  }

  const handleFiltroChange = (nextFiltro: FiltroDieta) => {
    if (nextFiltro === filtroDieta) return
    setOrganizando(true)
    startTransition(() => {
      setFiltroDieta(nextFiltro)
      setVisibleCount(PAGE_SIZE)
    })
    setTimeout(() => {
      if (!isMountedRef.current) return
      setOrganizando(false)
    }, 450)
  }

  return (
    <div className="space-y-6">
      {/* Barra Superior Atomic Design: Buscador, Filtros y Acciones */}
      <ProductosMasonryNavbar
        busqueda={busqueda}
        filtroDieta={filtroDieta}
        totalProductos={productos.length}
        loading={loading}
        onBusquedaChange={handleBusquedaChange}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        onFiltroChange={handleFiltroChange}
        onRefrescar={() => void cargarProductos()}
        onAgregarNuevo={onAgregarNuevo}
      />

      {/* Alerta automática basada en status-code-validator.ts (silenciosa en 200 OK) */}
      <StatusCodeAlert
        validation={feedback}
        dismissible
        onClose={() => setFeedback(null)}
        actions={
          <button
            type="button"
            onClick={() => void cargarProductos()}
            disabled={loading}
            className="border-line bg-panel text-ink hover:border-primary/40 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              spin={loading}
              className="size-3"
            />
            <span>Reintentar</span>
          </button>
        }
      />

      {/* Indicador visual del balanceador de cargas de imágenes (/shared/loading) */}
      {showImageBalancerLoading && (
        <div className="border-line bg-panel/90 flex items-center justify-center rounded-2xl border px-4 py-1.5 shadow-2xs backdrop-blur-xs">
          <Loading
            visible={true}
            variant="inline"
            size="sm"
            label={`Balanceando carga de imágenes (${imageBalancer.activeCount} activas · ${imageBalancer.queuedCount} en cola)…`}
            delay={0}
            minDuration={350}
          />
        </div>
      )}

      {/* Estado de Carga y Contenido con /shared/loading */}
      {loading && productos.length === 0 ? (
        <div className="border-line bg-panel flex min-h-[260px] flex-col items-center justify-center rounded-3xl border shadow-xs">
          <Loading
            visible={loading || showLoading}
            variant="block"
            size="lg"
            label="Cargando productos del menú…"
            description="Consultando catálogo (/item-menu)"
            delay={0}
            minDuration={450}
          />
        </div>
      ) : (
        <div className="relative rounded-3xl">
          <Loading
            visible={showOrganizando || (showLoading && productos.length > 0)}
            variant="overlay"
            size="md"
            label={
              organizando
                ? 'Organizando productos gastronómicos…'
                : 'Actualizando productos (/item-menu)…'
            }
            description={
              organizando
                ? 'Reordenando carta según la opción seleccionada'
                : 'Consultando catálogo (/item-menu)'
            }
            delay={0}
            minDuration={400}
          />

          {productosFiltrados.length === 0 ? (
            <ItemMenuProductosEmptyState
              totalProductos={productos.length}
              onAgregarNuevo={onAgregarNuevo}
            />
          ) : (
            /* 🌊 Layout Dinámico: Cuadrícula (Grid) o Cascada (Masonry) con InfiniteScroll y LazyAnimatedWrapper */
            <InfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={false}
              animationVariant="slideUp"
              loader={
                <Loading
                  variant="inline"
                  size="sm"
                  label="Cargando más productos…"
                  delay={0}
                  minDuration={300}
                />
              }
              endMessage={
                <InfiniteScrollEnd label="Has visualizado todos los platillos y bebidas del menú de Room Service." />
              }
            >
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:break-inside-avoid'
                }
              >
                <AnimatePresence mode="popLayout">
                  {visibleProductos.map((item, idx) => {
                    // Clave inmutable y estable para la técnica FLIP
                    const itemKey =
                      item.id || `${item.category_id || 'cat'}-${item.name}-${idx}`

                    return (
                      <LazyAnimatedWrapper
                        key={itemKey}
                        layout
                        variant="slideUp"
                        viewportMargin="-100px"
                        once
                        className={
                          viewMode === 'grid' ? 'w-full h-full' : 'break-inside-avoid mb-6'
                        }
                      >
                        <ItemMenuProductoCard
                          producto={item}
                          index={idx}
                          viewMode={viewMode}
                          onVerDetalle={setProductoSeleccionado}
                        />
                      </LazyAnimatedWrapper>
                    )
                  })}
                </AnimatePresence>
              </div>
            </InfiniteScroll>
          )}
        </div>
      )}

      {/* Modal de Detalle al hacer clic en la fotografía del producto */}
      <ItemMenuProductoModalDetalle
        producto={productoSeleccionado}
        onClose={() => setProductoSeleccionado(null)}
      />

      {/* Navbar flotante para alternar modo de visualización (Grid por defecto vs Masonry) */}
      <ProductosVisualizacionNavbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Botón flotante y modal de productos agregados al carrito */}
      <CarritoFlotanteFab
        totalArticulos={totalArticulosCarrito}
        onClick={() => setIsCarritoModalOpen(true)}
      />

      <CarritoProductosModal
        isOpen={isCarritoModalOpen}
        onClose={() => setIsCarritoModalOpen(false)}
        onIrACarrito={onIrACarrito}
      />
    </div>
  )
}
