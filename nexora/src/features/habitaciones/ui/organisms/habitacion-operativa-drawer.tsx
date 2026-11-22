import { Suspense, lazy, memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useDeviceResourceProfile } from '../../application/use-device-resource-profile';
import { useOperativaDrawer } from '../../application/use-operativa-drawer';
import type { RoomRow } from '../../domain/habitacion-lista';
import { Loader } from '../atoms/loader';
import { HabitacionStatusBadge } from '../molecules/habitacion-status-badge';

const LazyDrawerOperativaTabs = lazy(
  () => import('../molecules/drawer-operativa-tabs')
);
const LazyDrawerTabSummary = lazy(
  () => import('../molecules/drawer-tab-summary')
);
const LazyDrawerTabConsumptions = lazy(
  () => import('../molecules/drawer-tab-consumptions')
);
const LazyDrawerTabHousekeeping = lazy(
  () => import('../molecules/drawer-tab-housekeeping')
);

export type DrawerTabKey = 'summary' | 'consumptions' | 'housekeeping';

export interface HabitacionOperativaDrawerProps {
  room: RoomRow | null;
  nightlyRate: number;
  onClose: () => void;
  onAssignGuest?: (room: RoomRow) => void;
  onChangeStatus: (room: RoomRow, newStatus: string) => Promise<void> | void;
  onOpenTarifas?: (room: RoomRow) => void;
  onOpenFullDetail?: (room: RoomRow) => void;
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Organismo: Panel lateral deslizable (Slide-Over Drawer) para gestionar Estadía, Consumos y Aseo.
 */
export const HabitacionOperativaDrawer = memo(
  function HabitacionOperativaDrawer({
    room,
    nightlyRate,
    onClose,
    onAssignGuest,
    onChangeStatus,
    onOpenTarifas,
    onOpenFullDetail,
  }: HabitacionOperativaDrawerProps) {
    const {
      policy: { enableBackdropBlur },
    } = useDeviceResourceProfile();
    const {
      activeTab,
      setActiveTab,
      staySummary,
      loadingStay,
      menuItems,
      consumptions,
      pendingConsumptions,
      loadingMenu,
      addingItemId,
      updatingConsumptionId,
      actionLoading,
      feedbackMsg,
      handleStatusChange,
      handleCheckout,
      handleAddConsumption,
      handleUpdateConsumptionQty,
      handleClearConsumptions,
      handleConfirmPendingConsumptions,
    } = useOperativaDrawer(room, nightlyRate, onChangeStatus, onClose);

    return (
      <AnimatePresence>
        {room && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className={`fixed inset-0 z-40 bg-slate-900/35 ${enableBackdropBlur ? 'backdrop-blur-[1px]' : ''}`}
            />

            <motion.aside
              key="drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="border-line bg-panel fixed top-0 right-0 z-50 flex h-full w-full flex-col overflow-x-hidden border-l shadow-2xl sm:w-[50vw] xl:w-[30vw]"
            >
              {/* Cabecera */}
              <div className="border-line bg-canvas/60 flex items-center justify-between gap-2 border-b px-4 py-4 lg:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-ink text-base font-bold lg:text-lg">
                      Habitación {room.number}
                    </h2>
                    <HabitacionStatusBadge status={room.status} />
                  </div>
                  <p className="text-ink-muted mt-0.5 text-xs">
                    Piso {room.floor} · {room.bed.name} ·{' '}
                    {nightlyRate > 0
                      ? `${formatCOP(nightlyRate)}/noche`
                      : 'Sin tarifa'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-ink-muted hover:text-ink hover:bg-canvas cursor-pointer rounded-xl p-2 transition-colors"
                  aria-label="Cerrar panel"
                >
                  <FontAwesomeIcon icon={faXmark} className="size-4" />
                </button>
              </div>

              {/* Pestañas minimalistas con iconos FontAwesome */}
              <Suspense
                fallback={
                  <div className="border-line border-b px-4 py-2.5">
                    <div className="bg-line/40 h-10 w-full animate-pulse rounded-xl" />
                  </div>
                }
              >
                <LazyDrawerOperativaTabs
                  activeTab={activeTab}
                  consumptionsCount={
                    consumptions.reduce((acc, c) => acc + c.amount, 0) +
                    pendingConsumptions.reduce((acc, c) => acc + c.amount, 0)
                  }
                  onChangeTab={setActiveTab}
                />
              </Suspense>

              {/* Cuerpo Dinámico con Suspense */}
              <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-4 lg:p-5">
                {feedbackMsg && (
                  <div className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-3 py-2 text-xs font-medium">
                    {feedbackMsg}
                  </div>
                )}

                <Suspense fallback={<Loader label="Cargando sección…" />}>
                  {activeTab === 'summary' ? (
                    <LazyDrawerTabSummary
                      room={room}
                      nightlyRate={nightlyRate}
                      staySummary={staySummary}
                      loadingStay={loadingStay}
                      actionLoading={actionLoading}
                      onAssignGuest={onAssignGuest}
                      onSwitchToConsumptions={() =>
                        setActiveTab('consumptions')
                      }
                      onCheckout={handleCheckout}
                      onChangeStatus={handleStatusChange}
                      onOpenFullDetail={onOpenFullDetail}
                    />
                  ) : activeTab === 'consumptions' ? (
                    <LazyDrawerTabConsumptions
                      key={room.id}
                      room={room}
                      menuItems={menuItems}
                      consumptions={consumptions}
                      pendingConsumptions={pendingConsumptions}
                      loadingMenu={loadingMenu}
                      addingItemId={addingItemId}
                      updatingConsumptionId={updatingConsumptionId}
                      actionLoading={actionLoading}
                      onAddConsumption={handleAddConsumption}
                      onUpdateConsumptionQty={handleUpdateConsumptionQty}
                      onClearConsumptions={handleClearConsumptions}
                      onConfirmPendingConsumptions={
                        handleConfirmPendingConsumptions
                      }
                    />
                  ) : (
                    <LazyDrawerTabHousekeeping
                      room={room}
                      actionLoading={actionLoading}
                      onChangeStatus={handleStatusChange}
                      onOpenTarifas={
                        onOpenTarifas ? () => onOpenTarifas(room) : undefined
                      }
                      onOpenFullDetail={onOpenFullDetail}
                    />
                  )}
                </Suspense>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }
);

export default HabitacionOperativaDrawer;
