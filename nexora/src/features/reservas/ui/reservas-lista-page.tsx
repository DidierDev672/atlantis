import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useReservasList } from '../application/use-reservas-list';
import { ReservasListaHeader } from './molecules/reservas-lista-header';
import { ReservasListaToolbar } from './molecules/reservas-lista-toolbar';
import { ReservasFeedbackBanner } from './molecules/reservas-feedback-banner';
import { ReservaDetalleModal } from './molecules/reserva-detalle-modal';
import { ReservasListContainer } from './organisms/reservas-list-container';
import { Loading, useDelayVisibility } from '../../../shared/loading';

interface ReservasListaPageProps {
  onNuevaReserva?: () => void;
}

export function ReservasListaPage({ onNuevaReserva }: ReservasListaPageProps) {
  const [selectedReservaId, setSelectedReservaId] = useState<string | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const {
    viewMode,
    setViewMode,
    visibleItems,
    loading,
    isLoadingMore,
    refreshing,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    hasMore,
    loadMore,
    feedback,
    clearFeedback,
    refetch,
    totalCount,
    filteredCount,
  } = useReservasList();

  // Visibilidad controlada de la carga balanceada con useDelayVisibility
  const isBalancedLoading = loading || refreshing;
  const isVisibleLoading = useDelayVisibility(isBalancedLoading, {
    delay: 0,
    minDuration: 500,
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleOpenDetail = (id: string) => {
    setSelectedReservaId(id);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedReservaId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header con psicología del usuario y animación slideIn */}
      <ReservasListaHeader onNuevaReserva={onNuevaReserva} />

      {/* Banner de feedback si hay avisos o respuestas del servidor */}
      <AnimatePresence>
        {feedback && feedback.message && (
          <ReservasFeedbackBanner
            feedback={feedback}
            onDismiss={clearFeedback}
          />
        )}
      </AnimatePresence>

      {/* Barra de herramientas: Búsqueda, filtros, recarga y switch cards/tabla */}
      <ReservasListaToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        refreshing={refreshing}
        onRefresh={refetch}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      {/* Contenedor principal con carga balanceada y scroll infinito para tarjetas o tabla */}
      <div className="relative min-h-[300px]">
        {isVisibleLoading && visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel p-16 text-center shadow-xs">
            <Loading
              variant="block"
              size="md"
              label="Cargando reservas balanceadas…"
              description="Consultando el endpoint /reserve mediante balanceo preventivo de carga."
              delay={0}
              minDuration={500}
            />
          </div>
        ) : (
          <>
            <ReservasListContainer
              viewMode={viewMode}
              items={visibleItems}
              loading={isVisibleLoading || isLoadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onResetFilters={handleResetFilters}
              onSelectReserva={handleOpenDetail}
            />

            {/* Overlay sutil mientras se actualiza con balanceo de carga */}
            {isVisibleLoading && refreshing && visibleItems.length > 0 && (
              <Loading
                variant="overlay"
                size="md"
                label="Actualizando reservas…"
                description="Sincronizando el catálogo de reservas desde /reserve con balanceo de carga."
                delay={0}
                minDuration={400}
              />
            )}
          </>
        )}
      </div>

      {/* Modal para visualizar el detalle completo de la reserva (GET /reserve/{id}) */}
      <ReservaDetalleModal
        isOpen={isDetailModalOpen}
        reservaId={selectedReservaId}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
