import { Suspense, lazy, memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { RoomRow } from '../../domain/habitacion-lista';
import { useDeviceResourceProfile } from '../../application/use-device-resource-profile';
import {
  fetchRoomExtraDetailsCached,
  type CachedRoomExtraDetails,
} from '../../infrastructure/sedes-and-menu-cache';
import { Button } from '../atoms/button';
import { HabitacionStatusBadge } from '../molecules/habitacion-status-badge';

const LazyHabitacionDetalleModalGrid = lazy(
  () => import('../molecules/habitacion-detalle-modal-grid')
);

export interface HabitacionDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomRow | null;
  hasTariff?: boolean;
  tariffPrice?: number | null;
  tariffName?: string | null;
  rateId?: string | null;
  onOpenTarifas?: (room: {
    id?: string;
    number: string;
    floor: number | string;
    hasTariff?: boolean;
    rateId?: string | null;
  }) => void;
  onOpenBed?: (bedId: string | null, summary?: RoomRow['bed']) => void;
  onOpenBuilding?: (buildingId: string, summary?: RoomRow['building']) => void;
}

/**
 * Organismo: Modal de detalle de habitación optimizado (consulta directa a `/room/{id}`
 * con caché TTL de 2 min, eliminando el fallback 404 previo desde `/rooms/{id}`).
 */
export const HabitacionDetalleModal = memo(function HabitacionDetalleModal({
  isOpen,
  onClose,
  room,
  hasTariff = false,
  tariffPrice = null,
  tariffName = null,
  rateId = null,
  onOpenTarifas,
  onOpenBed,
  onOpenBuilding,
}: HabitacionDetalleModalProps) {
  const {
    policy: { enableBackdropBlur },
  } = useDeviceResourceProfile();
  const [extraDetails, setExtraDetails] = useState<CachedRoomExtraDetails>({});

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    const roomId = room?.id;

    void (async () => {
      await Promise.resolve();
      if (!isMounted) return;
      if (!isOpen || !roomId) {
        setExtraDetails({});
        return;
      }
      try {
        const details = await fetchRoomExtraDetailsCached(roomId);
        if (isMounted) setExtraDetails(details);
      } catch {
        if (isMounted) setExtraDetails({});
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, room?.id]);

  if (!room) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-habitacion-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        >
          <motion.div
            key="backdrop-habitacion-detalle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className={`fixed inset-0 bg-black/60 transition-opacity ${enableBackdropBlur ? 'backdrop-blur-xs' : ''}`}
            aria-hidden="true"
          />

          <motion.div
            key="modal-habitacion-content"
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.8 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 280,
              mass: 0.85,
            }}
            onClick={(e) => e.stopPropagation()}
            className="border-line bg-panel relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] border p-6 shadow-2xl sm:rounded-3xl sm:p-7.5"
          >
            <div className="bg-line/80 mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full sm:hidden" />

            <div className="border-line/70 flex items-center justify-between gap-3 border-b pb-4.5">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                  <span>Ficha completa de la habitación</span>
                </span>
                {hasTariff && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Con tarifa</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                className="border-line text-ink-muted hover:border-primary/40 hover:bg-canvas hover:text-ink focus-visible:ring-primary/40 grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                ×
              </button>
            </div>

            <div className="border-line/80 bg-canvas/70 mt-5 flex flex-col gap-4 rounded-2xl border p-4.5 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-3.5">
                <div
                  className={`relative grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-black shadow-xs ${
                    hasTariff
                      ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {room.number}
                  {hasTariff && (
                    <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-emerald-600 text-[10px] font-black text-white shadow-xs">
                      ✓
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      id="modal-habitacion-title"
                      className={`text-lg font-black sm:text-xl ${
                        hasTariff
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-ink'
                      }`}
                    >
                      Habitación {room.number}
                    </h3>
                    <span
                      className={
                        hasTariff
                          ? 'inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'border-line bg-canvas/80 text-ink-muted inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium'
                      }
                    >
                      <span>{hasTariff ? 'Tarifa aplicada' : 'Sin tarifa'}</span>
                    </span>
                  </div>
                  <p className="text-ink-muted text-xs">
                    Piso {room.floor} · {room.building.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <HabitacionStatusBadge status={room.status} />
              </div>
            </div>

            <Suspense
              fallback={
                <div className="bg-line/30 mt-5 h-48 w-full animate-pulse rounded-2xl" />
              }
            >
              <LazyHabitacionDetalleModalGrid
                room={room}
                hasTariff={hasTariff}
                tariffPrice={tariffPrice}
                tariffName={tariffName}
                rateId={rateId}
                description={extraDetails.description}
                onOpenTarifas={onOpenTarifas}
                onOpenBed={onOpenBed}
                onOpenBuilding={onOpenBuilding}
              />
            </Suspense>

            <div className="border-line/70 mt-6 flex flex-col-reverse items-center justify-end gap-2.5 border-t pt-4.5 sm:flex-row">
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cerrar
              </Button>
              {onOpenTarifas && (
                <Button
                  variant="primary"
                  onClick={() => {
                    onClose();
                    onOpenTarifas({
                      id: room.id,
                      number: room.number,
                      floor: room.floor,
                      hasTariff,
                      rateId,
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  {hasTariff
                    ? 'Consultar tarifas'
                    : 'Asignar tarifa a la habitación'}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export default HabitacionDetalleModal;
