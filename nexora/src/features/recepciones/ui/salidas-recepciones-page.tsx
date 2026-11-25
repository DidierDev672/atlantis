import { Suspense, lazy, memo, useCallback, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { Loading, useDelayVisibility } from '../../../shared/loading';
import { StatusCodeAlert } from '../../../shared/lib/status-code-validator';
import { useSalidasRecepciones } from '../application/use-salidas-recepciones';
import type { SalidaHuespedItem } from '../domain/salida-huesped';
import type { StayItem } from '../domain/stay';
import { SalidasToolbar } from './molecules/salidas-toolbar';
import { SalidasListContainer } from './organisms/salidas-list-container';

const LazyCuentaHuespedDrawer = lazy(() =>
  import('./organisms/cuenta-huesped-drawer').then((m) => ({
    default: m.CuentaHuespedDrawer,
  }))
);

const LazyCobroSalidaDrawer = lazy(
  () => import('./organisms/cobro-salida-drawer')
);

export interface SalidasRecepcionesPageProps {
  initialStays?: StayItem[];
  refreshToken?: number;
  embedded?: boolean;
}

/**
 * Página de salidas de recepciones.
 * Reutiliza estancias precargadas de RecepcionesPage, carga CuentaHuespedDrawer
 * y CobroSalidaDrawer con React.lazy y soporta modo embebido (`embedded`).
 */
export const SalidasRecepcionesPage = memo(function SalidasRecepcionesPage({
  initialStays,
  refreshToken,
  embedded = false,
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
  const [selectedCollectGuestKey, setSelectedCollectGuestKey] = useState<
    string | null
  >(null);

  const selectedAccountGuest = useMemo(
    () => guests.find((g) => g.internalKey === selectedAccountGuestKey) ?? null,
    [guests, selectedAccountGuestKey]
  );

  const selectedCollectGuest = useMemo(
    () => guests.find((g) => g.internalKey === selectedCollectGuestKey) ?? null,
    [guests, selectedCollectGuestKey]
  );

  const isVisibleLoading = useDelayVisibility(loading, {
    delay: 0,
    minDuration: 450,
  });

  const isVisibleServiceLoading = useDelayVisibility(loadingServiceRequests, {
    delay: 0,
    minDuration: 400,
  });

  const handleResetFilters = useCallback(() => {
    try {
      setSearchQuery('');
      setDepartureFilter('todos');
    } catch (err) {
      console.error('Error al restablecer filtros de salidas:', err);
    }
  }, [setDepartureFilter, setSearchQuery]);

  const handleReload = useCallback(() => {
    try {
      void reload();
    } catch (err) {
      console.error('Error al recargar salidas:', err);
    }
  }, [reload]);

  const handleLoadMorePersonIds = useCallback(
    (personIds: string[]) => {
      try {
        void ensureServiceRequestsForPersonIds(personIds);
      } catch (err) {
        console.warn('Error al cargar servicios de más huéspedes:', err);
      }
    },
    [ensureServiceRequestsForPersonIds]
  );

  const handleViewAccount = useCallback(
    (guest: SalidaHuespedItem) => {
      try {
        setSelectedAccountGuestKey(guest.internalKey);
        if (guest.personId) {
          void ensureServiceRequestsForPersonIds([guest.personId]);
        }
      } catch (err) {
        console.error('Error al abrir cuenta del huésped:', err);
      }
    },
    [ensureServiceRequestsForPersonIds]
  );

  const handleCloseDrawer = useCallback(() => {
    try {
      setSelectedAccountGuestKey(null);
    } catch (err) {
      console.error('Error al cerrar detalle de cuenta:', err);
    }
  }, []);

  const handleCollectPayment = useCallback(
    (guest: SalidaHuespedItem) => {
      try {
        setSelectedCollectGuestKey(guest.internalKey);
        if (guest.personId) {
          void ensureServiceRequestsForPersonIds([guest.personId]);
        }
      } catch (err) {
        console.error('Error al abrir drawer de cobro:', err);
      }
    },
    [ensureServiceRequestsForPersonIds]
  );

  const handleCloseCobroDrawer = useCallback(() => {
    try {
      setSelectedCollectGuestKey(null);
    } catch (err) {
      console.error('Error al cerrar drawer de cobro:', err);
    }
  }, []);

  const outerClassName = embedded
    ? 'text-ink w-full'
    : 'bg-canvas text-ink min-h-screen px-4 py-6 sm:px-6 lg:px-8';
  const containerClassName = embedded
    ? 'w-full space-y-6'
    : 'mx-auto w-full max-w-7xl space-y-6';

  return (
    <div className={outerClassName}>
      <div className={containerClassName}>
        {validationResult && !validationResult.isValid && (
          <StatusCodeAlert
            validation={validationResult}
            dismissible
            actions={
              <button
                type="button"
                onClick={handleReload}
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
                onClick={handleReload}
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
          onReload={handleReload}
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
                onCollectPayment={handleCollectPayment}
                onLoadMorePersonIds={handleLoadMorePersonIds}
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

      {selectedAccountGuest && (
        <Suspense fallback={null}>
          <LazyCuentaHuespedDrawer
            guest={selectedAccountGuest}
            isOpen
            onClose={handleCloseDrawer}
          />
        </Suspense>
      )}

      {selectedCollectGuest && (
        <Suspense fallback={null}>
          <LazyCobroSalidaDrawer
            key={selectedCollectGuest.internalKey}
            guest={selectedCollectGuest}
            isOpen
            onClose={handleCloseCobroDrawer}
          />
        </Suspense>
      )}
    </div>
  );
});

export default SalidasRecepcionesPage;
