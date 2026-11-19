import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMenuCategorias, type CriterioOrden } from '../../application/use-menu-categorias'
import type { DropdownOption } from '../../../recursos/ui/molecules/recursos-dropdown'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'
import { MenuCategoriasToolbar } from '../molecules/MenuCategoriasToolbar'
import { ImageBalancerStatusBanner } from '../molecules/ImageBalancerStatusBanner'
import { MenuCategoriasContenido } from '../molecules/MenuCategoriasContenido'
import { MenuCategoriasModalesHost } from '../molecules/MenuCategoriasModalesHost'
import { invalidarCacheProductosMenu } from '../../infrastructure/catalogo-productos-cache'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import { type MenuCategoria, resolverNombreEntidad } from '../../domain/menu-categoria'
import type { LazyAnimationVariant } from '../../../../shared/ui'

export interface MenuCategoriasGridProps {
  onNuevoRegistro?: () => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
  /** Incrementar para recargar el catálogo tras crear una categoría externamente */
  refreshVersion?: number
  /** Variante de animación opcional conservada por compatibilidad de API */
  animationVariant?: LazyAnimationVariant
  /** Modo de visualización: cascada dinámica ('masonry') o cuadrícula uniforme ('grid') */
  viewMode?: LayoutViewMode
  /** Callback al cambiar el modo de visualización */
  onViewModeChange?: (mode: LayoutViewMode) => void
}

const ORDEN_OPTIONS: DropdownOption[] = [
  { value: 'order-asc', label: 'Orden: Menor a Mayor (1→99)' },
  { value: 'order-desc', label: 'Orden: Mayor a Menor (99→1)' },
  { value: 'name-asc', label: 'Alfabético (A→Z)' },
  { value: 'name-desc', label: 'Alfabético (Z→A)' },
]

const PAGE_SIZE = 12
const INCREMENT_STEP = 5

/**
 * Organismo: Grilla / Cascada del catálogo de categorías de Room Service.
 * Aísla el balanceador de imágenes en `ImageBalancerStatusBanner`, virtualiza las tarjetas
 * mediante `CategoriasCatalogoGrid` y delega los modales perezosos a `MenuCategoriasModalesHost`.
 */
export function MenuCategoriasGrid({
  onNuevoRegistro,
  onAgregarProducto,
  refreshVersion = 0,
  viewMode: propViewMode,
  onViewModeChange,
}: MenuCategoriasGridProps) {
  const {
    categoriasFiltradas,
    categorias,
    loading,
    feedback,
    searchTerm,
    setSearchTerm,
    selectedBuilding,
    setSelectedBuilding,
    ordenes,
    setOrdenes,
    edificiosDisponibles,
    recargar,
    limpiarFiltros,
  } = useMenuCategorias()

  const [internalViewMode, setInternalViewMode] = useState<LayoutViewMode>('grid')
  const activeViewMode = propViewMode ?? internalViewMode

  const handleViewModeChange = useCallback(
    (mode: LayoutViewMode) => {
      if (onViewModeChange) {
        onViewModeChange(mode)
      } else {
        setInternalViewMode(mode)
      }
    },
    [onViewModeChange],
  )

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<MenuCategoria | null>(null)
  const [categoriaProductosModal, setCategoriaProductosModal] = useState<MenuCategoria | null>(
    null,
  )
  const [categoriaAgregarProducto, setCategoriaAgregarProducto] =
    useState<MenuCategoria | null>(null)
  const [isRegistrarCategoriaOpen, setIsRegistrarCategoriaOpen] = useState(false)
  const lastRefreshVersionRef = useRef(refreshVersion)

  useEffect(() => {
    if (refreshVersion <= 0 || refreshVersion === lastRefreshVersionRef.current) {
      return
    }
    lastRefreshVersionRef.current = refreshVersion
    void Promise.resolve().then(() => recargar())
  }, [recargar, refreshVersion])

  const edificioOptions: DropdownOption[] = useMemo(
    () => [
      { value: 'todos', label: 'Todos los edificios' },
      ...edificiosDisponibles.map((bId) => ({
        value: bId,
        label: resolverNombreEntidad(bId, 'Edificio'),
      })),
    ],
    [edificiosDisponibles],
  )

  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE)

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value)
      setVisibleCount(PAGE_SIZE)
    },
    [setSearchTerm],
  )

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setVisibleCount(PAGE_SIZE)
  }, [setSearchTerm])

  const handleBuildingChange = useCallback(
    (buildingId: string) => {
      setSelectedBuilding(buildingId)
      setVisibleCount(PAGE_SIZE)
    },
    [setSelectedBuilding],
  )

  const handleOrdersChange = useCallback(
    (newOrdenes: string[]) => {
      setOrdenes(newOrdenes as CriterioOrden[])
      setVisibleCount(PAGE_SIZE)
    },
    [setOrdenes],
  )

  const handleResetFilters = useCallback(() => {
    limpiarFiltros()
    setVisibleCount(PAGE_SIZE)
  }, [limpiarFiltros])

  const handleRecargar = useCallback(async () => {
    try {
      await recargar()
    } catch (error) {
      console.error('Error al recargar las categorías:', error)
    }
  }, [recargar])

  const visibleCategorias = useMemo(
    () => categoriasFiltradas.slice(0, visibleCount),
    [categoriasFiltradas, visibleCount],
  )
  const hasMore = visibleCount < categoriasFiltradas.length

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }, [])

  const handleMostrarCincoMas = useCallback(() => {
    setVisibleCount((prev) => prev + INCREMENT_STEP)
  }, [])

  const handleOpenDetalle = useCallback((item: MenuCategoria) => {
    try {
      setCategoriaSeleccionada(item)
    } catch (error) {
      console.error('Error al abrir modal de detalle de categoría:', error)
    }
  }, [])

  const handleCloseDetalle = useCallback(() => {
    setCategoriaSeleccionada(null)
  }, [])

  const handleOpenProductos = useCallback((item: MenuCategoria) => {
    try {
      setCategoriaProductosModal(item)
    } catch (error) {
      console.error('Error al abrir modal de productos de categoría:', error)
    }
  }, [])

  const handleCloseProductos = useCallback(() => {
    setCategoriaProductosModal(null)
  }, [])

  const handleAgregarProducto = useCallback(
    (item: MenuCategoria) => {
      try {
        if (onAgregarProducto) {
          onAgregarProducto(item)
        } else {
          setCategoriaAgregarProducto(item)
        }
      } catch (error) {
        console.error('Error al iniciar alta de producto desde categoría:', error)
      }
    },
    [onAgregarProducto],
  )

  const handleCloseAgregarProducto = useCallback(() => {
    setCategoriaAgregarProducto(null)
  }, [])

  const handleProductoGuardadoLocal = useCallback(() => {
    try {
      invalidarCacheProductosMenu()
    } catch (error) {
      console.error('Error al invalidar caché de productos:', error)
    }
  }, [])

  const handleNuevoRegistro = useCallback(() => {
    try {
      if (onNuevoRegistro) {
        onNuevoRegistro()
      } else {
        setIsRegistrarCategoriaOpen(true)
      }
    } catch (error) {
      console.error('Error al iniciar registro de categoría:', error)
    }
  }, [onNuevoRegistro])

  const handleCloseRegistrarCategoria = useCallback(() => {
    setIsRegistrarCategoriaOpen(false)
  }, [])

  const handleCategoriaGuardadaLocal = useCallback(() => {
    try {
      invalidarCacheProductosMenu()
      void recargar()
    } catch (error) {
      console.error('Error al refrescar categorías tras registro:', error)
    }
  }, [recargar])

  return (
    <div className="space-y-6">
      <MenuCategoriasToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        edificioOptions={edificioOptions}
        selectedBuilding={selectedBuilding}
        onBuildingChange={handleBuildingChange}
        ordenOptions={ORDEN_OPTIONS}
        ordenes={ordenes}
        onOrdersChange={handleOrdersChange}
        viewMode={activeViewMode}
        onViewModeChange={handleViewModeChange}
        loading={loading}
        onRecargar={() => void handleRecargar()}
        onNuevoRegistro={handleNuevoRegistro}
      />

      <StatusCodeAlert
        validation={feedback}
        dismissible
        actions={
          <button
            type="button"
            onClick={() => void handleRecargar()}
            disabled={loading}
            className="border-line bg-panel text-ink hover:border-primary/40 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60"
          >
            <span>Reintentar</span>
          </button>
        }
      />

      <ImageBalancerStatusBanner suppressed={loading} />

      <MenuCategoriasContenido
        loading={loading}
        totalCategorias={categorias.length}
        categoriasFiltradasCount={categoriasFiltradas.length}
        visibleCategorias={visibleCategorias}
        viewMode={activeViewMode}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onMostrarCincoMas={handleMostrarCincoMas}
        onVerDetalle={handleOpenDetalle}
        onVerProductos={handleOpenProductos}
        onAgregarProducto={handleAgregarProducto}
        onNuevoRegistro={handleNuevoRegistro}
        onRecargar={() => void handleRecargar()}
        onResetFiltros={handleResetFilters}
      />

      <MenuCategoriasModalesHost
        categoriaSeleccionada={categoriaSeleccionada}
        categoriaProductosModal={categoriaProductosModal}
        categoriaAgregarProducto={categoriaAgregarProducto}
        isRegistrarCategoriaOpen={isRegistrarCategoriaOpen}
        onCloseDetalle={handleCloseDetalle}
        onCloseProductos={handleCloseProductos}
        onCloseAgregarProducto={handleCloseAgregarProducto}
        onCloseRegistrarCategoria={handleCloseRegistrarCategoria}
        onAgregarProducto={handleAgregarProducto}
        onProductoGuardado={handleProductoGuardadoLocal}
        onCategoriaGuardada={handleCategoriaGuardadaLocal}
      />
    </div>
  )
}
