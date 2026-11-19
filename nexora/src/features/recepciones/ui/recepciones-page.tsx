import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { RecepcionesListContainer } from './organisms/recepciones-list-container';
import { RecepcionPanel } from './organisms/recepcion-panel';
import { RecepcionRoomsDashboard } from './organisms/recepcion-rooms-dashboard';
import { SalidasRecepcionesPage } from './salidas-recepciones-page';
import { useStaysList } from '../application/use-stays-list';
import { Loading, useDelayVisibility } from '../../../shared/loading';
import { StatusCodeAlert } from '../../../shared/lib/status-code-validator';
import { RandomPlanet } from '../../../shared/planets';

export function RecepcionesPage() {
  const [activeTab, setActiveTab] = useState<
    'habitaciones' | 'lista' | 'salidas' | 'nuevo'
  >('habitaciones');
  const staysList = useStaysList();

  // Control de permanencia y visibilidad con useDelayVisibility mientras se carga la información
  const isVisibleLoading = useDelayVisibility(staysList.loading, {
    delay: 0,
    minDuration: 500,
  });

  return (
    <div className="bg-canvas min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Alerta cósmica (/shared/alert) para validación empática de códigos de estado de la API */}
        {staysList.validationResult && !staysList.validationResult.isValid && (
          <StatusCodeAlert
            validation={staysList.validationResult}
            dismissible
            actions={
              <button
                type="button"
                onClick={() => void staysList.reload()}
                className="cursor-pointer text-xs font-semibold underline hover:opacity-80"
              >
                Reintentar
              </button>
            }
          />
        )}

        {/* Barra de pestañas secundarias para alternar entre Habitaciones, Estancias y Registro */}
        <div className="border-line flex items-center justify-between border-b pb-1">
          <div className="flex items-center gap-2">
            {/* Pestaña 1: Habitaciones (Por defecto para recepcionista) */}
            <button
              type="button"
              onClick={() => setActiveTab('habitaciones')}
              className={`relative flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === 'habitaciones'
                  ? 'text-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <RandomPlanet size={18} interactive />
              <span>Habitaciones</span>
              {activeTab === 'habitaciones' && (
                <motion.div
                  layoutId="activeRecepcionesTabIndicator"
                  className="bg-primary absolute inset-x-0 bottom-0 h-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>

            {/* Pestaña 2: Listado de recepciones */}
            <button
              type="button"
              onClick={() => setActiveTab('lista')}
              className={`relative flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === 'lista'
                  ? 'text-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Listado de recepciones</span>
              {activeTab === 'lista' && (
                <motion.div
                  layoutId="activeRecepcionesTabIndicator"
                  className="bg-primary absolute inset-x-0 bottom-0 h-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>

            {/* Pestaña 3: Salidas de recepción */}
            <button
              type="button"
              onClick={() => setActiveTab('salidas')}
              className={`relative flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === 'salidas'
                  ? 'text-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FontAwesomeIcon
                icon={faDoorOpen}
                className="size-4"
                aria-hidden="true"
              />
              <span>Salidas de recepción</span>
              {activeTab === 'salidas' && (
                <motion.div
                  layoutId="activeRecepcionesTabIndicator"
                  className="bg-primary absolute inset-x-0 bottom-0 h-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>

            {/* Pestaña 4: Nuevo registro */}
            <button
              type="button"
              onClick={() => setActiveTab('nuevo')}
              className={`relative flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === 'nuevo'
                  ? 'text-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span>Formulario de nuevo</span>
              {activeTab === 'nuevo' && (
                <motion.div
                  layoutId="activeRecepcionesTabIndicator"
                  className="bg-primary absolute inset-x-0 bottom-0 h-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          </div>

          {activeTab === 'nuevo' && (
            <button
              type="button"
              onClick={() => setActiveTab('habitaciones')}
              className="text-primary flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline"
            >
              ← Volver a habitaciones
            </button>
          )}
        </div>

        {/* Vista activa con animación fluida AnimatePresence */}
        <AnimatePresence mode="wait">
          {activeTab === 'habitaciones' ? (
            <motion.div
              key="recepciones-habitaciones-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative min-h-[360px]"
            >
              <RecepcionRoomsDashboard />
            </motion.div>
          ) : activeTab === 'lista' ? (
            <motion.div
              key="recepciones-stays-list-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
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
                    onNewCheckIn={() => setActiveTab('nuevo')}
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
            </motion.div>
          ) : activeTab === 'salidas' ? (
            <motion.div
              key="recepciones-salidas-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative min-h-[360px]"
            >
              <SalidasRecepcionesPage />
            </motion.div>
          ) : (
            <motion.div
              key="recepciones-stays-nuevo-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-4xl"
            >
              <RecepcionPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
