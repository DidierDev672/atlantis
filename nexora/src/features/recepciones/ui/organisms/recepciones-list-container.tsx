import { Suspense, lazy, memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { useStaysList, type UseStaysListReturn } from '../../application/use-stays-list';
import { useRecepcionesResourceBudget } from '../../application/use-recepciones-resource-budget';
import { RecepcionesViewSwitch } from '../molecules/recepciones-view-switch';
import {
  RecepcionesEmptyState,
  RecepcionesValidationBanner,
} from '../molecules/recepciones-list-feedback';
import { InfiniteScroll, InfiniteScrollEnd } from '../../../../shared/ui/InfiniteScroll';
import { Loading } from '../../../../shared/loading';
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown';
import type { StayItem } from '../../domain/stay';

const LazyRecepcionesFloorAccordionsFeed = lazy(
  () => import('./recepciones-floor-accordions-feed')
);

const LazyRecepcionStayTable = lazy(() =>
  import('../molecules/recepcion-stay-table').then((m) => ({
    default: m.RecepcionStayTable,
  }))
);

const LazyRecepcionStayDetailDrawer = lazy(
  () => import('./recepcion-stay-detail-drawer')
);

const LazyHuespedDetalleModal = lazy(() =>
  import('../molecules/huesped-detalle-modal').then((m) => ({
    default: m.HuespedDetalleModal,
  }))
);

const LazyRoomDetailModal = lazy(
  () => import('../molecules/room-detail-modal')
);

const STAY_STATUS_OPTIONS: DropdownOption[] = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'progress', label: 'En progreso' },
  { value: 'completed', label: 'Finalizada' },
  { value: 'canceled', label: 'Cancelada' },
];

const STAY_PAYMENT_OPTIONS: DropdownOption[] = [
  { value: 'todos', label: 'Todos los pagos' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
];

export interface RecepcionesListContainerProps {
  onNewCheckIn?: () => void;
  staysListReturn?: UseStaysListReturn;
}

/**
 * Organismo contenedor para la supervisión y visualización de recepciones.
 * Integra paginación en tabla (`InfiniteScroll`), acordeones perezosos y carga bajo demanda de vistas/modales.
 */
export const RecepcionesListContainer = memo(function RecepcionesListContainer({
  onNewCheckIn,
  staysListReturn: externalStaysList,
}: RecepcionesListContainerProps) {
  const internalStaysList = useStaysList({ enabled: !externalStaysList });
  const staysList = externalStaysList ?? internalStaysList;
  const {
    filteredStays,
    loading,
    validationResult,
    isDemoFallback,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    reload,
  } = staysList;

  const {
    policy: { tablePageSize },
  } = useRecepcionesResourceBudget();
  const [selectedStay, setSelectedStay] = useState<StayItem | null>(null);
  const [inspectPersonId, setInspectPersonId] = useState<string | null>(null);
  const [inspectRoomId, setInspectRoomId] = useState<string | null>(null);
  const [tableVisibleCount, setTableVisibleCount] = useState(tablePageSize);
  const [prevFiltered, setPrevFiltered] = useState(filteredStays);

  if (prevFiltered !== filteredStays) {
    setPrevFiltered(filteredStays);
    setTableVisibleCount(tablePageSize);
  }

  const visibleTableStays = filteredStays.slice(0, tableVisibleCount);
  const hasMoreTableRows =
    viewMode === 'table' && tableVisibleCount < filteredStays.length;

  const handleLoadMoreTableRows = useCallback(() => {
    try {
      setTableVisibleCount((prev) =>
        Math.min(prev + tablePageSize, filteredStays.length)
      );
    } catch (err) {
      console.error('Error al paginar filas de recepciones:', err);
    }
  }, [filteredStays.length, tablePageSize]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('todos');
    setPaymentFilter('todos');
  }, [setPaymentFilter, setSearchQuery, setStatusFilter]);

  return (
    <div className="space-y-6">
      <RecepcionesValidationBanner
        validationResult={validationResult}
        isDemoFallback={isDemoFallback}
        onReload={() => void reload()}
      />

      {/* Barra de Control: Búsqueda, Filtros y Switch Card / Table */}
      <div className="border-line bg-panel flex flex-col gap-4 rounded-2xl border p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-[240px] flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-muted absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por habitación, persona, ID de estancia..."
            className="border-line bg-canvas text-ink placeholder:text-ink-muted/60 focus:border-primary focus:ring-primary/20 h-[42px] w-full rounded-xl border py-2 pr-4 pl-10 text-xs focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <RecursosDropdown
            label="Estado"
            options={STAY_STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Todos los estados"
            className="w-44 sm:w-48 [&>label]:sr-only"
          />

          <RecursosDropdown
            label="Método de pago"
            options={STAY_PAYMENT_OPTIONS}
            value={paymentFilter}
            onChange={setPaymentFilter}
            placeholder="Todos los pagos"
            className="w-44 sm:w-48 [&>label]:sr-only"
          />

          <RecepcionesViewSwitch viewMode={viewMode} onChange={setViewMode} />

          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            aria-label="Refrescar información de recepciones y estancias"
            title="Refrescar información"
            className="border-line bg-canvas text-ink-muted hover:border-primary/40 hover:bg-panel hover:text-primary flex size-[42px] cursor-pointer items-center justify-center rounded-xl border shadow-2xs transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={faRotateRight}
              className={`size-3.5 transition-transform ${
                loading ? 'text-primary animate-spin' : ''
              }`}
            />
          </button>

          {onNewCheckIn && (
            <button
              type="button"
              onClick={onNewCheckIn}
              aria-label="Nueva recepción"
              title="Nueva recepción"
              className="bg-primary focus-visible:ring-primary/40 flex size-[42px] cursor-pointer items-center justify-center rounded-xl text-white shadow-xs transition hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
            >
              <FontAwesomeIcon
                icon={faPlus}
                className="size-4"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      {/* Contenido Principal: Cards vs. Table */}
      {loading && filteredStays.length === 0 ? (
        <div className="border-line bg-panel flex flex-col items-center justify-center rounded-2xl border p-16 text-center shadow-xs">
          <Loading
            variant="block"
            size="md"
            label="Cargando recepciones y estancias…"
            description="Consultando el estado de ocupación hotelera en tiempo real."
            delay={0}
            minDuration={500}
          />
        </div>
      ) : filteredStays.length === 0 ? (
        <RecepcionesEmptyState
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <InfiniteScroll
          onLoadMore={handleLoadMoreTableRows}
          hasMore={hasMoreTableRows}
          isLoading={false}
          loader={
            <div className="flex items-center justify-center py-6">
              <Loading
                variant="inline"
                size="sm"
                label="Cargando más recepciones…"
                delay={0}
                minDuration={400}
              />
            </div>
          }
          endMessage={
            <InfiniteScrollEnd label="Has visualizado todas las recepciones registradas." />
          }
        >
          <AnimatePresence mode="wait">
            {viewMode === 'card' ? (
              <motion.div
                key="recepciones-cards-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <Suspense
                  fallback={
                    <div className="space-y-3">
                      <div className="border-line bg-panel h-24 w-full animate-pulse rounded-2xl border" />
                      <div className="border-line bg-panel h-24 w-full animate-pulse rounded-2xl border" />
                    </div>
                  }
                >
                  <LazyRecepcionesFloorAccordionsFeed
                    stays={filteredStays}
                    onSelectStay={setSelectedStay}
                    onOpenRoom={setInspectRoomId}
                    onSelectGuest={setInspectPersonId}
                  />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="recepciones-table-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <Suspense
                  fallback={
                    <div className="border-line bg-panel h-64 w-full animate-pulse rounded-2xl border" />
                  }
                >
                  <LazyRecepcionStayTable
                    stays={visibleTableStays}
                    onSelectStay={setSelectedStay}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </InfiniteScroll>
      )}

      {selectedStay && (
        <Suspense fallback={null}>
          <LazyRecepcionStayDetailDrawer
            stay={selectedStay}
            onClose={() => setSelectedStay(null)}
          />
        </Suspense>
      )}

      {inspectPersonId && (
        <Suspense fallback={null}>
          <LazyHuespedDetalleModal
            personId={inspectPersonId}
            onClose={() => setInspectPersonId(null)}
          />
        </Suspense>
      )}

      {inspectRoomId && (
        <Suspense fallback={null}>
          <LazyRoomDetailModal
            roomId={inspectRoomId}
            onClose={() => setInspectRoomId(null)}
          />
        </Suspense>
      )}
    </div>
  );
});
