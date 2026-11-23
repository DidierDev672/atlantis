import { Suspense, lazy, memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
  isHabitacionOcupada,
  matchesHabitacionStatus,
  type RoomRow,
} from '../../domain/habitacion-lista';
import { formatCurrencyCOP } from '../lib/formatters';
import { HabitacionStatusTopBorder } from '../atoms/habitacion-status-top-border';
import { HabitacionStatusBadge } from './habitacion-status-badge';

const LazyHabitacionCardFooterActions = lazy(
  () => import('./habitacion-card-footer-actions')
);

export interface HabitacionCardItemProps {
  room: RoomRow;
  tariffPrice?: number | null;
  onRetryBed: (id: string) => void | Promise<void>;
  onOpenRoomDetail?: (room: RoomRow) => void;
  onSelectHabitacion?: (room: RoomRow) => void;
  onOpenAssignGuestDrawer?: (room: RoomRow) => void;
  onQuickMarkAvailable?: (room: RoomRow) => Promise<void> | void;
}

/**
 * Molécula: Tarjeta limpia de habitación para recepción (sin capas GPU por ítem).
 */
export const HabitacionCardItem = memo(function HabitacionCardItem({
  room,
  tariffPrice = null,
  onRetryBed,
  onOpenRoomDetail,
  onSelectHabitacion,
  onOpenAssignGuestDrawer,
  onQuickMarkAvailable,
}: HabitacionCardItemProps) {
  const isOccupied = isHabitacionOcupada(room.status);
  const isAvailable = matchesHabitacionStatus(room.status, 'available');
  const effectivePrice = room.priceOverride ?? tariffPrice;

  const handleRoomClick = useCallback(() => {
    try {
      if (isAvailable && onOpenAssignGuestDrawer) {
        onOpenAssignGuestDrawer(room);
        return;
      }
      if (isOccupied) {
        onOpenRoomDetail?.(room);
        return;
      }
      if (onSelectHabitacion) {
        onSelectHabitacion(room);
      } else {
        onOpenRoomDetail?.(room);
      }
    } catch (err) {
      console.error('Error al seleccionar tarjeta de habitación:', err);
    }
  }, [
    isAvailable,
    isOccupied,
    onOpenAssignGuestDrawer,
    onOpenRoomDetail,
    onSelectHabitacion,
    room,
  ]);

  const handleRetryBed = useCallback(async () => {
    if (!room.roomTypesId) return;
    try {
      await onRetryBed(room.roomTypesId);
    } catch (err) {
      console.error('Error al reintentar tipo de habitación:', err);
    }
  }, [onRetryBed, room.roomTypesId]);

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        handleRoomClick();
      }}
      className="group border-line bg-panel hover:border-primary/35 relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-2xs transition-colors hover:shadow-md"
    >
      <HabitacionStatusTopBorder status={room.status} />
      <div>
        {/* Cabecera limpia: Número y Estado */}
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <h3 className="text-ink text-lg leading-none font-extrabold tracking-tight">
              {room.number}
            </h3>
            {effectivePrice != null && (
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                {formatCurrencyCOP(effectivePrice)}{' '}
                <span className="text-ink-muted text-[10px] font-normal">
                  /noche
                </span>
              </p>
            )}
          </div>

          <HabitacionStatusBadge status={room.status} />
        </div>

        {/* Cuerpo minimalista: tipo de cama y capacidad sin iconos de categoría ni ojo */}
        <div className="border-line/60 mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-xs">
          {room.bed.loading ? (
            <span className="bg-line/60 inline-block h-4 w-28 animate-pulse rounded" />
          ) : room.bed.error ? (
            <button
              type="button"
              onClick={() => void handleRetryBed()}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-amber-600 hover:underline dark:text-amber-400"
            >
              <FontAwesomeIcon icon={faTriangleExclamation} className="size-3" />
              <span>Reintentar</span>
            </button>
          ) : (
            <>
              <span className="text-ink truncate text-xs font-semibold">
                {room.bed.name}
              </span>
              {room.bed.capacityPeople ? (
                <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                  <FontAwesomeIcon icon={faUsers} className="size-2.5" />
                  <span>{room.bed.capacityPeople}</span>
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Pie Operativo */}
      <Suspense
        fallback={
          <div className="border-line/60 mt-3 flex justify-end gap-2 border-t pt-2.5">
            <div className="bg-line/40 size-9 animate-pulse rounded-xl" />
          </div>
        }
      >
        <LazyHabitacionCardFooterActions
          room={room}
          onAssignGuest={onSelectHabitacion}
          onOpenRoomDetail={onOpenRoomDetail}
          onQuickMarkAvailable={onQuickMarkAvailable}
        />
      </Suspense>
    </div>
  );
});

export default HabitacionCardItem;
