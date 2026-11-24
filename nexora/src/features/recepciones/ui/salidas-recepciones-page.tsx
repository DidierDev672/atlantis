import { memo, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { Loading, useDelayVisibility } from '../../../shared/loading';
import { StatusCodeAlert } from '../../../shared/lib/status-code-validator';
import { useSalidasRecepciones } from '../application/use-salidas-recepciones';
import type { SalidaHuespedItem } from '../domain/salida-huesped';
import type { StayItem } from '../domain/stay';
import { SalidasToolbar } from './molecules/salidas-toolbar';
import { SalidasListContainer } from './organisms/salidas-list-container';
import { CuentaHuespedDrawer } from './organisms/cuenta-huesped-drawer';

export interface SalidasRecepcionesPageProps {
  initialStays?: StayItem[];
  refreshToken?: number;
}

/**
 * Página de salidas de recepciones.
 * Reutiliza estancias precargadas de RecepcionesPage, cachea colecciones
 * y resuelve service-request bajo demanda para el rango visible.
 */
export const SalidasRecepcionesPage = memo(function SalidasRecepcionesPage({
  initialStays,
  refreshToken,
}: SalidasRecepcionesPageProps) {
  const {
    guests,
    filteredGuests,
    loading,
    loadingServiceRequests,
    validationResult,
    serviceRequestValidation,
    searchQuery,
    setSearchQuery,
    departureFilter,
    setDepartureFilter,
    reload,
    ensureServiceRequestsForPersonIds,
  } = useSalidasRecepciones({ initialStays, refreshToken });

  const [selectedAccountGuestKey, setSelectedAccountGuestKey] = useState<
    string | null
  >(null);

  const selectedAccountGuest =
    guests.find((g) => g.internalKey === selectedAccountGuestKey) ?? null;

  const isVisibleLoading = useDelayVisibility(loading, {
    delay: 0,
    minDuration: 450,
  });

  const isVisibleServiceLoading = useDelayVisibility(loadingServiceRequests, {
    delay: 0,
    minDuration: 400,
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setDepartureFilter('todos');
  };

  const handleViewAccount = useCallback(
    (guest: SalidaHuespedItem) => {
      setSelectedAccountGuestKey(guest.internalKey);
      if (guest.personId) {
        void ensureServiceRequestsForPersonIds([guest.personId]);
      }
    },
    [ensureServiceRequestsForPersonIds]
  );

  return (
    <div className="bg-canvas text-ink min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {validationResult && !validationResult.isValid && (
          <StatusCodeAlert
            validation={validationResult}
            dismissible
            actions={
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold underline hover:opacity-80"
              >
                <FontAwesomeIcon
                  icon={faArrowsRotate}
                  className="size-3"
                  aria-hidden="true"
                />
                <span>Reintentar</span>
              </button>
            }
          />
        )}

        {serviceRequestValidation && !serviceRequestValidation.isValid && (
          <StatusCodeAlert
            validation={serviceRequestValidation}
            dismissible
            actions={
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold underline hover:opacity-80"
              >
                <FontAwesomeIcon
                  icon={faArrowsRotate}
                  className="size-3"
                  aria-hidden="true"
                />
                <span>Reintentar</span>
              </button>
            }
          />
        )}

        <SalidasToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          departureFilter={departureFilter}
          onDepartureFilterChange={setDepartureFilter}
          onReload={() => void reload()}
          isLoading={isVisibleLoading || isVisibleServiceLoading}
          filteredCount={filteredGuests.length}
          totalCount={guests.length}
        />

        {isVisibleServiceLoading && guests.length > 0 && (
          <div className="border-line bg-panel flex items-center justify-between rounded-2xl border px-4 py-2.5 shadow-xs">
            <Loading
              variant="inline"
              size="sm"
              label="Consultando solicitudes de servicio a la habitación…"
              description="Sincronizando los pedidos realizados por cada huésped."
              delay={0}
              minDuration={400}
            />
          </div>
        )}

        <div className="relative min-h-[280px]">
          {isVisibleLoading && guests.length === 0 ? (
            <div className="border-line bg-panel flex flex-col items-center justify-center rounded-2xl border p-14 text-center shadow-xs">
              <Loading
                variant="block"
                size="md"
                label="Consultando huéspedes y salidas…"
                description="Verificando las personas con recepción o reserva activa."
                delay={0}
                minDuration={450}
              />
            </div>
          ) : (
            <>
              <SalidasListContainer
                guests={filteredGuests}
                searchQuery={searchQuery}
                departureFilter={departureFilter}
                onResetFilters={handleResetFilters}
                isServiceRequestsLoading={isVisibleServiceLoading}
                onViewAccount={handleViewAccount}
                onLoadMorePersonIds={(ids) =>
                  void ensureServiceRequestsForPersonIds(ids)
                }
              />

              {isVisibleLoading && guests.length > 0 && (
                <Loading
                  variant="overlay"
                  size="md"
                  label="Actualizando salidas…"
                  description="Sincronizando la información de huéspedes."
                  delay={0}
                  minDuration={400}
                />
              )}
            </>
          )}
        </div>
      </div>

      <CuentaHuespedDrawer
        guest={selectedAccountGuest}
        isOpen={Boolean(selectedAccountGuest)}
        onClose={() => setSelectedAccountGuestKey(null)}
      />
    </div>
  );
});
