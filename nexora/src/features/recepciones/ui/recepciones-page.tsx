import { Suspense, lazy, memo, useCallback, useId, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { catalogApi } from '../../../shared/catalog';
import { RecepcionesListContainer } from './organisms/recepciones-list-container';
import { useStaysList } from '../application/use-stays-list';
import { useRecepcionesResourceBudget } from '../application/use-recepciones-resource-budget';
import type { Recepcion } from '../domain/recepcion';
import { Loading, useDelayVisibility } from '../../../shared/loading';
import { RecepcionesTabBar } from './molecules/recepciones-tab-bar';
import {
  getRecepcionesPanelId,
  getRecepcionesTabId,
  type RecepcionesTabKey,
} from '../domain/recepciones-tabs';

const LazySalidasRecepcionesPage = lazy(() =>
  import('./salidas-recepciones-page').then((m) => ({
    default: m.SalidasRecepcionesPage,
  }))
);

const LazyRecepcionPanel = lazy(() =>
  import('./organisms/recepcion-panel').then((m) => ({
    default: m.RecepcionPanel,
  }))
);

export const RecepcionesPage = memo(function RecepcionesPage() {
  const tabsBaseId = useId();
  const resourceBudget = useRecepcionesResourceBudget();
  const [activeTab, setActiveTab] = useState<RecepcionesTabKey>('lista');
  const [mountedTabs, setMountedTabs] = useState<
    Record<RecepcionesTabKey, boolean>
  >({
    lista: true,
    salidas: false,
    nuevo: false,
  });
  const [salidasRefreshToken, setSalidasRefreshToken] = useState(0);
  const staysList = useStaysList();
  const { reload: reloadStays } = staysList;

  // Control de permanencia y visibilidad con useDelayVisibility mientras se carga la información
  const isVisibleLoading = useDelayVisibility(staysList.loading, {
    delay: 0,
    minDuration: 500,
  });

  const handleTabChange = useCallback((tab: RecepcionesTabKey) => {
    try {
      setActiveTab(tab);
      setMountedTabs((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
    } catch (err) {
      console.error('Error al cambiar pestaña de recepciones:', err);
    }
  }, []);

  const handleGoToNuevo = useCallback(() => {
    handleTabChange('nuevo');
  }, [handleTabChange]);

  const handleGoToLista = useCallback(() => {
    handleTabChange('lista');
  }, [handleTabChange]);

  const handleRecepcionCreated = useCallback(
    async (recepcion: Recepcion) => {
      try {
        if (recepcion.roomId) {
          catalogApi.invalidateRoom(recepcion.roomId);
        }
        await reloadStays();
        if (mountedTabs.salidas) {
          setSalidasRefreshToken((prev) => prev + 1);
        }
      } catch (err) {
        console.error(
          'Error al sincronizar el listado tras crear recepción:',
          err
        );
      }
    },
    [mountedTabs.salidas, reloadStays]
  );

  const handlePanelSuccess = useCallback(
    (recepcion: Recepcion) => {
      void handleRecepcionCreated(recepcion);
    },
    [handleRecepcionCreated]
  );

  return (
    <MotionConfig
      reducedMotion={
        resourceBudget.policy.enableAnimations ? 'user' : 'always'
      }
    >
      <div className="w-full space-y-6">
        <RecepcionesTabBar
          baseId={tabsBaseId}
          activeTab={activeTab}
          resourceBudget={resourceBudget}
          onSelectTab={handleTabChange}
          onGoToLista={handleGoToLista}
        />

        {/* Vistas montadas bajo demanda y preservadas en memoria al alternar pestañas */}
        <div className="relative min-h-[360px]">
          <section
            id={getRecepcionesPanelId(tabsBaseId, 'lista')}
            role="tabpanel"
            aria-labelledby={getRecepcionesTabId(tabsBaseId, 'lista')}
            hidden={activeTab !== 'lista'}
            aria-hidden={activeTab !== 'lista'}
            className="relative min-h-[360px]"
          >
            {isVisibleLoading && staysList.stays.length === 0 ? (
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
            ) : (
              <>
                <RecepcionesListContainer
                  onNewCheckIn={handleGoToNuevo}
                  staysListReturn={staysList}
                />

                {/* Overlay sutil mientras se actualizan los datos ya existentes */}
                {isVisibleLoading && staysList.stays.length > 0 && (
                  <Loading
                    variant="overlay"
                    size="md"
                    label="Actualizando recepciones…"
                    description="Sincronizando el estado de las estancias."
                    delay={0}
                    minDuration={400}
                  />
                )}
              </>
            )}
          </section>

          {mountedTabs.salidas && (
            <section
              id={getRecepcionesPanelId(tabsBaseId, 'salidas')}
              role="tabpanel"
              aria-labelledby={getRecepcionesTabId(tabsBaseId, 'salidas')}
              hidden={activeTab !== 'salidas'}
              aria-hidden={activeTab !== 'salidas'}
              className="relative min-h-[360px]"
            >
              <Suspense
                fallback={
                  <div className="border-line bg-panel flex min-h-64 items-center justify-center rounded-2xl border p-12">
                    <Loading
                      variant="block"
                      size="sm"
                      label="Cargando salidas de recepción…"
                      delay={0}
                      minDuration={200}
                    />
                  </div>
                }
              >
                <LazySalidasRecepcionesPage
                  embedded
                  initialStays={staysList.stays}
                  refreshToken={salidasRefreshToken}
                />
              </Suspense>
            </section>
          )}

          {mountedTabs.nuevo && (
            <section
              id={getRecepcionesPanelId(tabsBaseId, 'nuevo')}
              role="tabpanel"
              aria-labelledby={getRecepcionesTabId(tabsBaseId, 'nuevo')}
              hidden={activeTab !== 'nuevo'}
              aria-hidden={activeTab !== 'nuevo'}
              className="mx-auto max-w-4xl"
            >
              <Suspense
                fallback={
                  <div className="border-line bg-panel flex min-h-64 items-center justify-center rounded-2xl border p-12">
                    <Loading
                      variant="block"
                      size="sm"
                      label="Cargando formulario de registro…"
                      delay={0}
                      minDuration={200}
                    />
                  </div>
                }
              >
                <LazyRecepcionPanel onSuccess={handlePanelSuccess} />
              </Suspense>
            </section>
          )}
        </div>
      </div>
    </MotionConfig>
  );
});

export default RecepcionesPage;
