import { Suspense, lazy, memo, useCallback, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorOpen,
  faTableCellsLarge,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { RecepcionesListContainer } from './organisms/recepciones-list-container';
import { useStaysList } from '../application/use-stays-list';
import { useRecepcionesResourceBudget } from '../application/use-recepciones-resource-budget';
import { Loading, useDelayVisibility } from '../../../shared/loading';

const LazyRecepcionesResourceBadge = lazy(
  () => import('./atoms/recepciones-resource-badge')
);

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

type RecepcionesTabKey = 'lista' | 'salidas' | 'nuevo';

const TABS: ReadonlyArray<{
  key: RecepcionesTabKey;
  label: string;
  icon: typeof faTableCellsLarge;
}> = [
  { key: 'lista', label: 'Listado de recepciones', icon: faTableCellsLarge },
  { key: 'salidas', label: 'Salidas de recepción', icon: faDoorOpen },
  { key: 'nuevo', label: 'Formulario de nuevo', icon: faUserPlus },
];

export const RecepcionesPage = memo(function RecepcionesPage() {
  const resourceBudget = useRecepcionesResourceBudget();
  const [activeTab, setActiveTab] = useState<RecepcionesTabKey>('lista');
  const [mountedTabs, setMountedTabs] = useState<
    Record<RecepcionesTabKey, boolean>
  >({
    lista: true,
    salidas: false,
    nuevo: false,
  });
  const staysList = useStaysList();

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

  return (
    <MotionConfig
      reducedMotion={
        resourceBudget.policy.enableAnimations ? 'user' : 'always'
      }
    >
      <div className="bg-canvas px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          {/* Barra de pestañas secundarias para alternar entre Estancias, Salidas y Registro */}
          <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b pb-1">
            <div
              role="tablist"
              aria-label="Secciones de recepciones"
              className="flex items-center gap-2 overflow-x-auto"
            >
              {TABS.map(({ key, label, icon }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleTabChange(key)}
                    className={`relative flex shrink-0 cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'text-primary'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={icon}
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeRecepcionesTabIndicator"
                        className="bg-primary absolute inset-x-0 bottom-0 h-0.5"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Suspense fallback={null}>
                <LazyRecepcionesResourceBadge budget={resourceBudget} />
              </Suspense>
              {activeTab === 'nuevo' && (
                <button
                  type="button"
                  onClick={() => handleTabChange('lista')}
                  className="text-primary flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline"
                >
                  ← Volver al listado
                </button>
              )}
            </div>
          </div>

          {/* Vistas montadas bajo demanda y preservadas en memoria al alternar pestañas */}
          <div className="relative min-h-[360px]">
            <section
              role="tabpanel"
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
                    onNewCheckIn={() => handleTabChange('nuevo')}
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
                role="tabpanel"
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
                  <LazySalidasRecepcionesPage initialStays={staysList.stays} />
                </Suspense>
              </section>
            )}

            {mountedTabs.nuevo && (
              <section
                role="tabpanel"
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
                  <LazyRecepcionPanel />
                </Suspense>
              </section>
            )}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
});

export default RecepcionesPage;
