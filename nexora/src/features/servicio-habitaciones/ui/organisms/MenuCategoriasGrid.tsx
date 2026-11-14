import { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  useMenuCategorias,
  type CriterioOrden,
} from '../../application/use-menu-categorias';
import type { DropdownOption } from '../../../recursos/ui/molecules/recursos-dropdown';
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator';
import { Loading, useDelayVisibility } from '../../../../shared/loading';
import {
  getImageLoadBalancerSnapshot,
  subscribeImageLoadBalancer,
} from '../../infrastructure/image-load-balancer';
import { MenuCategoriaCard } from '../molecules/MenuCategoriaCard';
import { MenuCategoriaModalDetalle } from '../molecules/MenuCategoriaModalDetalle';
import { MenuCategoriasEmptyState } from '../molecules/MenuCategoriasEmptyState';
import { MenuCategoriasToolbar } from '../molecules/MenuCategoriasToolbar';
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch';
import {
  type MenuCategoria,
  resolverNombreEntidad,
} from '../../domain/menu-categoria';
import {
  InfiniteScroll,
  InfiniteScrollEnd,
  LazyAnimatedWrapper,
  type LazyAnimationVariant,
} from '../../../../shared/ui';

interface MenuCategoriasGridProps {
  onNuevoRegistro?: () => void;
  onAgregarProducto?: (categoria: MenuCategoria) => void;
  /** Variante de animación perezosa para las tarjetas de servicios */
  animationVariant?: LazyAnimationVariant;
  /** Modo de visualización: cascada dinámica ('masonry') o cuadrícula uniforme ('grid') */
  viewMode?: LayoutViewMode;
  /** Callback al cambiar el modo de visualización */
  onViewModeChange?: (mode: LayoutViewMode) => void;
}

const ORDEN_OPTIONS: DropdownOption[] = [
  { value: 'order-asc', label: 'Orden: Menor a Mayor (1→99)' },
  { value: 'order-desc', label: 'Orden: Mayor a Menor (99→1)' },
  { value: 'name-asc', label: 'Alfabético (A→Z)' },
  { value: 'name-desc', label: 'Alfabético (Z→A)' },
];

export function MenuCategoriasGrid({
  onNuevoRegistro,
  onAgregarProducto,
  animationVariant = 'slideUp',
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
    orden,
    setOrden,
    edificiosDisponibles,
    recargar,
    limpiarFiltros,
  } = useMenuCategorias();

  const [internalViewMode, setInternalViewMode] =
    useState<LayoutViewMode>('grid');
  const activeViewMode = propViewMode ?? internalViewMode;

  const handleViewModeChange = useCallback(
    (mode: LayoutViewMode) => {
      if (onViewModeChange) {
        onViewModeChange(mode);
      } else {
        setInternalViewMode(mode);
      }
    },
    [onViewModeChange]
  );

  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<MenuCategoria | null>(null);

  const showLoading = useDelayVisibility(loading, { delay: 0, minDuration: 450 });
  const imageBalancer = useSyncExternalStore(
    subscribeImageLoadBalancer,
    getImageLoadBalancerSnapshot
  );
  const showImageBalancerLoading = useDelayVisibility(
    imageBalancer.isRunning && !loading,
    { delay: 0, minDuration: 350 }
  );

  const edificioOptions: DropdownOption[] = useMemo(() => {
    return [
      { value: 'todos', label: 'Todos los edificios' },
      ...edificiosDisponibles.map((bId) => ({
        value: bId,
        label: resolverNombreEntidad(bId, 'Edificio'),
      })),
    ];
  }, [edificiosDisponibles]);

  // Paginación reactiva para InfiniteScroll según convención de src/agent.md
  const PAGE_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setVisibleCount(PAGE_SIZE);
  };

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setVisibleCount(PAGE_SIZE);
  };

  const handleOrderChange = (newOrden: string) => {
    setOrden(newOrden as CriterioOrden);
    setVisibleCount(PAGE_SIZE);
  };

  const handleResetFilters = () => {
    limpiarFiltros();
    setVisibleCount(PAGE_SIZE);
  };

  const visibleCategorias = useMemo(
    () => categoriasFiltradas.slice(0, visibleCount),
    [categoriasFiltradas, visibleCount]
  );
  const hasMore = visibleCount < categoriasFiltradas.length;
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Barra de Herramientas, Filtros y Switch Masonry/Grid */}
      <MenuCategoriasToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        edificioOptions={edificioOptions}
        selectedBuilding={selectedBuilding}
        onBuildingChange={handleBuildingChange}
        ordenOptions={ORDEN_OPTIONS}
        orden={orden}
        onOrderChange={handleOrderChange}
        viewMode={activeViewMode}
        onViewModeChange={handleViewModeChange}
        loading={loading}
        onRecargar={() => void recargar()}
        onNuevoRegistro={onNuevoRegistro}
      />

      {/* 2. Alerta de status code reutilizable (/shared/lib/status-code-validator) */}
      <StatusCodeAlert
        validation={feedback}
        dismissible
        actions={
          <button
            type="button"
            onClick={() => void recargar()}
            disabled={loading}
            className="border-line bg-panel text-ink hover:border-primary/40 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60"
          >
            <span>Reintentar</span>
          </button>
        }
      />

      {/* Indicador del balanceador de cargas de imágenes (/shared/loading) */}
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

      {/* 3. Estado de Carga y Contenido con /shared/loading */}
      {loading && categorias.length === 0 ? (
        <div className="border-line bg-panel flex min-h-[260px] flex-col items-center justify-center rounded-3xl border shadow-xs">
          <Loading
            visible={loading || showLoading}
            variant="block"
            size="lg"
            label="Cargando categorías de la carta…"
            description="Consultando menú (/menu-category)"
            delay={0}
            minDuration={450}
          />
        </div>
      ) : (
        <div className="relative rounded-3xl">
          <Loading
            visible={showLoading && categorias.length > 0}
            variant="overlay"
            size="md"
            label="Actualizando categorías (/menu-category)…"
            delay={0}
            minDuration={450}
          />

          {categoriasFiltradas.length > 0 ? (
            /* Contenedor InfiniteScroll y Layout adaptable (Masonry o Grid) */
            <InfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={false}
              animationVariant={animationVariant}
              loader={
                <Loading
                  variant="inline"
                  size="sm"
                  label="Cargando más categorías…"
                  delay={0}
                  minDuration={300}
                />
              }
              endMessage={
                <InfiniteScrollEnd label="Has visualizado todas las categorías gastronómicas de Room Service." />
              }
            >
              {activeViewMode === 'masonry' ? (
                /* Disposición Masonry (Cascada / Pinterest) */
                <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4">
                  <AnimatePresence mode="popLayout">
                    {visibleCategorias.map((cat, idx) => (
                      <LazyAnimatedWrapper
                        key={`${cat.headquartes_id}-${cat.building_id}-${cat.order}-${cat.name}`}
                        layout
                        variant={animationVariant}
                        viewportMargin="-100px"
                        once
                        className="mb-6 break-inside-avoid"
                      >
                        <MenuCategoriaCard
                          categoria={cat}
                          index={idx}
                          viewMode="masonry"
                          onVerDetalle={(item) => setCategoriaSeleccionada(item)}
                          onAgregarProducto={(item) => onAgregarProducto?.(item)}
                        />
                      </LazyAnimatedWrapper>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                /* Disposición Grid (Cuadrícula simétrica uniforme) */
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {visibleCategorias.map((cat, idx) => (
                      <LazyAnimatedWrapper
                        key={`${cat.headquartes_id}-${cat.building_id}-${cat.order}-${cat.name}`}
                        layout
                        variant={animationVariant}
                        viewportMargin="-100px"
                        once
                        className="w-full"
                      >
                        <MenuCategoriaCard
                          categoria={cat}
                          index={idx}
                          viewMode="grid"
                          onVerDetalle={(item) => setCategoriaSeleccionada(item)}
                          onAgregarProducto={(item) => onAgregarProducto?.(item)}
                        />
                      </LazyAnimatedWrapper>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </InfiniteScroll>
          ) : (
            <MenuCategoriasEmptyState
              totalCategorias={categorias.length}
              loading={loading}
              onNuevoRegistro={onNuevoRegistro}
              onRecargar={() => void recargar()}
              onResetFiltros={handleResetFilters}
            />
          )}
        </div>
      )}

      {/* 4. Modal de Ficha Técnica Detallada con iconos FontAwesome */}
      <MenuCategoriaModalDetalle
        categoria={categoriaSeleccionada}
        onClose={() => setCategoriaSeleccionada(null)}
        onAgregarProducto={onAgregarProducto}
      />
    </div>
  );
}
