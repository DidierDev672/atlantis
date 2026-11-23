import { Suspense, lazy, memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { fadeUp } from '../../../../design-tokens/motion';
import { api } from '../../../../lib/api';
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile';
import {
  catalogApi,
  formatFriendlyRoomTypeName,
  useCatalogBuildingHierarchy,
  useCatalogRoom,
  useCatalogRoomType,
  type RoomCatalogItem,
} from '../../../../shared/catalog';
import { isRoomAvailableStatus } from '../../domain/room-detail-modal';
import { RoomDetailModalHeader } from './room-detail-modal-header';

const LazyRoomDetailKpiStrip = lazy(() => import('./room-detail-kpi-strip'));
const LazyRoomDetailExtraSections = lazy(
  () => import('./room-detail-extra-sections')
);

export interface RoomDetailModalProps {
  roomId: string | null;
  isOpen?: boolean;
  onClose: () => void;
  onRoomUpdated?: (roomId: string, newStatus: string) => void;
}

/**
 * Modal rediseñado para inspeccionar el detalle completo de una habitación
 * bajo Atomic Design, carga perezosa (React.lazy + React.memo + async/await),
 * iconos FontAwesome, animación fadeUp (src/agent.md) y manejo try/catch.
 */
export const RoomDetailModal = memo(function RoomDetailModal({
  roomId,
  isOpen,
  onClose,
  onRoomUpdated,
}: RoomDetailModalProps) {
  const {
    policy: { enableBackdropBlur },
  } = useDeviceResourceProfile();
  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(roomId);
  const [cachedRoom, setCachedRoom] = useState<RoomCatalogItem | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    data: room,
    loading: roomLoading,
    validation: roomValidation,
    reload: reloadRoom,
  } = useCatalogRoom(roomId);

  if (room && cachedRoom !== room) {
    setCachedRoom(room);
  }

  const displayRoom =
    room ??
    (isModalOpen && roomId && cachedRoom?.id !== roomId ? null : cachedRoom);

  const { data: roomType } = useCatalogRoomType(displayRoom?.room_types_id);
  const { building, headquarter, subHeadquarter } =
    useCatalogBuildingHierarchy(displayRoom?.building_id);

  useEffect(() => {
    if (!isModalOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        if (e.key === 'Escape') onClose();
      } catch (err) {
        console.error('Error al cerrar modal de habitación:', err);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, onClose]);

  const handleClose = useCallback(() => {
    try {
      setStatusFeedback(null);
      onClose();
    } catch (err) {
      console.error('Error al cerrar modal:', err);
    }
  }, [onClose]);

  const handleMarkAvailable = useCallback(async () => {
    if (!displayRoom || updatingStatus) return;
    setUpdatingStatus(true);
    setStatusFeedback(null);
    try {
      const payload = {
        number: String(displayRoom.number).trim(),
        floor: Number(displayRoom.floor) || 1,
        room_types_id: displayRoom.room_types_id ?? '',
        building_id: displayRoom.building_id ?? '',
        price_override: displayRoom.price_override ?? null,
        status: 'available',
        has_reception: false,
      };
      await api.put(`/room/${encodeURIComponent(displayRoom.id)}`, payload, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      catalogApi.invalidateRoom(displayRoom.id);
      await reloadRoom();
      onRoomUpdated?.(displayRoom.id, 'available');
      setStatusFeedback({
        type: 'success',
        text: 'Listo, la habitación quedó marcada como disponible.',
      });
    } catch (err) {
      console.error('Error al marcar habitación como disponible:', err);
      setStatusFeedback({
        type: 'error',
        text: 'No pudimos actualizar el estado en este momento. Intenta de nuevo en unos segundos.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  }, [displayRoom, onRoomUpdated, reloadRoom, updatingStatus]);

  if (typeof document === 'undefined') return null;

  const roomTypeName = roomType?.name
    ? formatFriendlyRoomTypeName(roomType.name)
    : formatFriendlyRoomTypeName(displayRoom?.room_types_id);

  const headerSubtitle = displayRoom
    ? [
        headquarter?.name || 'Sede Principal',
        building?.name || 'Edificio Principal',
        `Piso ${displayRoom.floor}`,
      ].join(' · ')
    : undefined;

  const isAlreadyAvailable = isRoomAvailableStatus(displayRoom?.status);

  return createPortal(
    <AnimatePresence>
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-room-detail-title"
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
        >
          {/* Backdrop */}
          <motion.div
            key="backdrop-room-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className={`fixed inset-0 bg-black/55 transition-opacity ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
            aria-hidden="true"
          />

          {/* Contenedor del Modal con variante fadeUp (src/agent.md) */}
          <motion.div
            key="modal-room-detail-content"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="border-line bg-panel text-ink relative max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-t-[28px] border p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          >
            <RoomDetailModalHeader
              roomSeed={displayRoom?.id || roomId || displayRoom?.number}
              roomNumber={displayRoom?.number}
              subtitle={headerSubtitle}
              status={displayRoom?.status}
              onClose={handleClose}
            />

            {roomLoading && !displayRoom ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center space-y-3 py-12"
              >
                <span className="border-primary/25 border-t-primary size-8 animate-spin rounded-full border-3" />
                <p className="text-ink-muted text-xs">
                  Consultando información de la habitación…
                </p>
              </motion.div>
            ) : roomValidation && !roomValidation.isValid ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="space-y-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-center"
              >
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {roomValidation.title || 'Aviso al consultar la habitación'}
                </h4>
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                  {roomValidation.message ||
                    'No fue posible cargar los datos de la habitación.'}
                </p>
              </motion.div>
            ) : displayRoom ? (
              <div className="space-y-5">
                <Suspense
                  fallback={
                    <div className="bg-line/35 h-36 w-full animate-pulse rounded-2xl" />
                  }
                >
                  <LazyRoomDetailKpiStrip
                    room={displayRoom}
                    roomTypeName={roomTypeName}
                    capacity={roomType?.capacity}
                    basePrice={roomType?.base_price}
                  />
                </Suspense>

                <Suspense
                  fallback={
                    <div className="bg-line/35 h-44 w-full animate-pulse rounded-2xl" />
                  }
                >
                  <LazyRoomDetailExtraSections
                    room={displayRoom}
                    roomTypeName={roomTypeName}
                    capacity={roomType?.capacity}
                    basePrice={roomType?.base_price}
                    building={building}
                    headquarter={headquarter}
                    subHeadquarter={subHeadquarter}
                  />
                </Suspense>

                {statusFeedback && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    role="status"
                    className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
                      statusFeedback.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {statusFeedback.text}
                  </motion.div>
                )}
              </div>
            ) : null}

            {/* Footer */}
            <div className="border-line/70 flex justify-end border-t pt-4">
              {displayRoom && !isAlreadyAvailable ? (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => void handleMarkAvailable()}
                  className="border-line bg-panel text-ink hover:bg-canvas hover:border-ink-soft/40 focus-visible:ring-primary/40 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60 sm:w-auto"
                >
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="size-3.5"
                    aria-hidden="true"
                  />
                  <span>
                    {updatingStatus
                      ? 'Actualizando…'
                      : 'Marcar como disponible'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="border-line bg-panel text-ink hover:bg-canvas focus-visible:ring-primary/40 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border px-5 py-2.5 text-xs font-semibold shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-none sm:w-auto"
                >
                  Cerrar detalle
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
});

export default RoomDetailModal;
