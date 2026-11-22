import { memo, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBagShopping,
  faCheck,
  faRotateRight,
  faScrewdriverWrench,
  faSliders,
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
  onOpenDrawer?: (room: RoomRow) => void;
  onQuickMarkAvailable?: (room: RoomRow) => Promise<void> | void;
}

/**
 * Molécula: Pie de acciones operativas contextuales para la tarjeta de habitación.
 * En habitaciones disponibles usa botones icon-only con FontAwesome (Asignar huésped y Panel).
 */
export const HabitacionCardFooterActions = memo(
  function HabitacionCardFooterActions({
    room,
    onAssignGuest,
    onOpenDrawer,
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
            onOpenDrawer?.(room);
          }
        } catch (err) {
          console.error('Error al abrir asignación de huésped:', err);
        }
      },
      [onAssignGuest, onOpenDrawer, room]
    );

    const handleOpenPanelClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          onOpenDrawer?.(room);
        } catch (err) {
          console.error('Error al abrir panel operativo:', err);
        }
      },
      [onOpenDrawer, room]
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
          <button
            type="button"
            onClick={handleOpenPanelClick}
            aria-label="Abrir panel operativo"
            title="Panel operativo"
            className="border-line bg-canvas/80 text-ink-muted hover:text-primary hover:border-primary/40 grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border transition-colors"
          >
            <FontAwesomeIcon icon={faSliders} className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      );
    }

    if (isOccupied) {
      return (
        <div className="border-line/60 mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
          <button
            type="button"
            onClick={handleOpenPanelClick}
            className="inline-flex w-full cursor-pointer items-center justify-between rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
          >
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBagShopping} className="size-3" />
              <span>Estadía, Folio y Consumos</span>
            </span>
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
          <button
            type="button"
            onClick={handleOpenPanelClick}
            aria-label="Abrir panel operativo para habilitar"
            title="Panel operativo"
            className="border-line bg-canvas/80 text-ink-muted hover:text-primary hover:border-primary/40 grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border transition-colors"
          >
            <FontAwesomeIcon icon={faSliders} className="size-3.5" aria-hidden="true" />
          </button>
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

        <button
          type="button"
          onClick={handleOpenPanelClick}
          aria-label={`Abrir panel de habitación ${room.number}`}
          title="Panel operativo"
          className="border-line bg-canvas/80 text-ink-muted hover:border-primary/40 hover:text-primary focus-visible:ring-primary/40 grid size-9 cursor-pointer place-items-center rounded-xl border shadow-2xs transition focus-visible:ring-2 focus-visible:outline-none"
        >
          <FontAwesomeIcon icon={faSliders} className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }
);

export default HabitacionCardFooterActions;
