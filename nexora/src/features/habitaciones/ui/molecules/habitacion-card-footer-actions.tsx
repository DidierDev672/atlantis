import { memo, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCheck,
  faRotateRight,
  faScrewdriverWrench,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import {
  isHabitacionOcupada,
  matchesHabitacionStatus,
  type RoomRow,
} from '../../domain/habitacion-lista';

export interface HabitacionCardFooterActionsProps {
  room: RoomRow;
  onAssignGuest?: (room: RoomRow) => void;
  onOpenRoomDetail?: (room: RoomRow) => void;
  onQuickMarkAvailable?: (room: RoomRow) => Promise<void> | void;
}

/**
 * Molécula: Pie de acciones contextuales para la tarjeta de habitación.
 */
export const HabitacionCardFooterActions = memo(
  function HabitacionCardFooterActions({
    room,
    onAssignGuest,
    onOpenRoomDetail,
    onQuickMarkAvailable,
  }: HabitacionCardFooterActionsProps) {
    const [marking, setMarking] = useState(false);

    const isOccupied = isHabitacionOcupada(room.status);
    const isCleaning = matchesHabitacionStatus(room.status, 'cleaning');
    const isMaintenance = matchesHabitacionStatus(room.status, 'maintenance');

    const handleMarkClean = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onQuickMarkAvailable || marking) return;
        setMarking(true);
        try {
          await onQuickMarkAvailable(room);
        } catch (err) {
          console.error('Error al marcar habitación como disponible:', err);
        } finally {
          setMarking(false);
        }
      },
      [marking, onQuickMarkAvailable, room]
    );

    const handleAssignGuestClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          if (onAssignGuest) {
            onAssignGuest(room);
          } else {
            onOpenRoomDetail?.(room);
          }
        } catch (err) {
          console.error('Error al abrir asignación de huésped:', err);
        }
      },
      [onAssignGuest, onOpenRoomDetail, room]
    );

    const handleOpenDetailClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          onOpenRoomDetail?.(room);
        } catch (err) {
          console.error('Error al abrir detalle de habitación:', err);
        }
      },
      [onOpenRoomDetail, room]
    );

    if (isCleaning) {
      return (
        <div className="border-line/60 mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
          <button
            type="button"
            disabled={marking}
            onClick={(e) => void handleMarkClean(e)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 transition-colors hover:bg-amber-500/25 disabled:opacity-50 dark:text-amber-300"
          >
            <FontAwesomeIcon
              icon={marking ? faRotateRight : faCheck}
              className={`size-3 ${marking ? 'animate-spin' : ''}`}
            />
            <span>{marking ? 'Actualizando…' : 'Marcar lista'}</span>
          </button>
        </div>
      );
    }

    if (isOccupied) {
      return (
        <div className="border-line/60 mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
          <button
            type="button"
            onClick={handleOpenDetailClick}
            className="inline-flex w-full cursor-pointer items-center justify-between rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
          >
            <span>Ver detalle</span>
            <FontAwesomeIcon icon={faArrowRight} className="size-3" />
          </button>
        </div>
      );
    }

    if (isMaintenance) {
      return (
        <div className="border-line/60 mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <FontAwesomeIcon icon={faScrewdriverWrench} className="size-3" />
            <span>Fuera de servicio</span>
          </span>
        </div>
      );
    }

    return (
      <div className="border-line/60 mt-3 flex items-center justify-end gap-2 border-t pt-2.5">
        <button
          type="button"
          onClick={handleAssignGuestClick}
          aria-label={`Asignar huésped a habitación ${room.number}`}
          title="Asignar huésped"
          className="focus-visible:ring-primary/40 grid size-9 cursor-pointer place-items-center rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-700 shadow-2xs transition hover:bg-emerald-600 hover:text-white focus-visible:ring-2 focus-visible:outline-none dark:border-emerald-400/30 dark:text-emerald-300"
        >
          <FontAwesomeIcon icon={faUserPlus} className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }
);

export default HabitacionCardFooterActions;
