import { Suspense, lazy, memo, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { type RoomRow, puedeAsignarHuesped } from '../domain/habitacion-lista';
import { FloorAccordionSkeleton } from './atoms/floor-accordion-skeleton';
import { Loader } from './atoms/loader';
import { HabitacionesErrorBoundary } from './molecules/habitaciones-error-boundary';
import type { HabitacionesTabKey } from './molecules/habitaciones-mode-switch';
import { type HabitacionesViewMode } from './molecules/habitaciones-view-mode-toggle';

const LazyHabitacionesModeSwitch = lazy(
  () => import('./molecules/habitaciones-mode-switch')
);

const LazyHabitacionesPisosList = lazy(
  () => import('./organisms/habitaciones-pisos-list')
);

const LazyHabitacionDetallePanel = lazy(() =>
  import('./organisms/habitacion-detalle-panel').then((m) => ({
    default: m.HabitacionDetallePanel,
  }))
);

const LazyAsignarHuespedPage = lazy(() => import('./asignar-huesped-page'));

export const HabitacionesPage = memo(function HabitacionesPage() {
  const [activeTab, setActiveTab] = useState<HabitacionesTabKey>('lista');
  const [viewMode, setViewMode] = useState<HabitacionesViewMode>('cards');
  const [selectedRoomForHuesped, setSelectedRoomForHuesped] =
    useState<RoomRow | null>(null);

  const handleTabChange = useCallback((tab: HabitacionesTabKey) => {
    try {
      setActiveTab(tab);
    } catch (err) {
      console.error('Error al alternar pestaña de habitaciones:', err);
    }
  }, []);

  const handleNewHabitacion = useCallback(() => {
    handleTabChange('registro');
  }, [handleTabChange]);

  const handleSelectHabitacion = useCallback((room: RoomRow) => {
    try {
      if (!puedeAsignarHuesped(room.status)) {
        return;
      }
      setSelectedRoomForHuesped(room);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error al seleccionar habitación:', err);
    }
  }, []);

  const handleBackFromHuesped = useCallback(() => {
    setSelectedRoomForHuesped(null);
  }, []);

  return (
    <div className="bg-canvas min-h-screen w-full px-3 py-5 pb-20 sm:px-5 lg:px-6">
      <div className="w-full space-y-6">
        <HabitacionesErrorBoundary
          onReset={() => {
            setSelectedRoomForHuesped(null);
            setActiveTab('lista');
          }}
        >
          <AnimatePresence mode="wait">
            {selectedRoomForHuesped ? (
              <motion.div
                key={`asignar-huesped-${selectedRoomForHuesped.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense
                  fallback={
                    <div className="border-line bg-panel flex min-h-64 items-center justify-center rounded-2xl border p-8">
                      <Loader label="Cargando vista de habitación…" />
                    </div>
                  }
                >
                  <LazyAsignarHuespedPage
                    room={selectedRoomForHuesped}
                    onBack={handleBackFromHuesped}
                  />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="habitaciones-main-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="fixed right-5 bottom-5 z-30">
                  <Suspense
                    fallback={
                      <div className="bg-line/40 h-10 w-20 animate-pulse rounded-full shadow-md" />
                    }
                  >
                    <LazyHabitacionesModeSwitch
                      activeTab={activeTab}
                      onChange={handleTabChange}
                    />
                  </Suspense>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'lista' ? (
                    <motion.div
                      key="tab-habitaciones-lista"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Suspense fallback={<FloorAccordionSkeleton count={3} />}>
                        <LazyHabitacionesPisosList
                          onNewHabitacion={handleNewHabitacion}
                          viewMode={viewMode}
                          onViewModeChange={setViewMode}
                          onSelectHabitacion={handleSelectHabitacion}
                        />
                      </Suspense>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tab-habitaciones-registro"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="mx-auto max-w-3xl"
                    >
                      <Suspense
                        fallback={
                          <div className="border-line bg-panel flex min-h-64 items-center justify-center rounded-2xl border p-8">
                            <Loader label="Cargando formulario de registro…" />
                          </div>
                        }
                      >
                        <LazyHabitacionDetallePanel />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </HabitacionesErrorBoundary>
      </div>
    </div>
  );
});

export default HabitacionesPage;
