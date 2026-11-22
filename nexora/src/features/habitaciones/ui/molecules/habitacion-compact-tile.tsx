import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faScrewdriverWrench,
  faTag,
  faUserCheck,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import {
  isHabitacionOcupada,
  matchesHabitacionStatus,
  type RoomRow,
} from '../../domain/habitacion-lista';

export interface HabitacionCompactTileProps {
  room: RoomRow;
  hasTariff?: boolean;
  onSelectRoom: (room: RoomRow) => void;
}

/**
 * Molécula: Celda matricial compacta (sin línea de color superior) para hoteles de alta densidad.
 */
export const HabitacionCompactTile = memo(function HabitacionCompactTile({
  room,
  hasTariff = false,
  onSelectRoom,
}: HabitacionCompactTileProps) {
  const isOccupied = isHabitacionOcupada(room.status);
  const isCleaning = matchesHabitacionStatus(room.status, 'cleaning');
  const isMaintenance = matchesHabitacionStatus(room.status, 'maintenance');

  const tileStyle = isOccupied
    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-950 hover:bg-indigo-500/15 dark:text-indigo-200'
    : isCleaning
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-950 hover:bg-amber-500/15 dark:text-amber-200'
      : isMaintenance
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-950 hover:bg-rose-500/15 dark:text-rose-200'
        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 hover:bg-emerald-500/15 dark:text-emerald-200';

  const statusIcon = isOccupied
    ? faUserCheck
    : isCleaning
      ? faWandMagicSparkles
      : isMaintenance
        ? faScrewdriverWrench
        : faCircleCheck;

  const statusIconColor = isOccupied
    ? 'text-indigo-500'
    : isCleaning
      ? 'text-amber-500'
      : isMaintenance
        ? 'text-rose-500'
        : 'text-emerald-500';

  return (
    <button
      type="button"
      onClick={() => onSelectRoom(room)}
      title={`Hab. ${room.number} (Piso ${room.floor}) · ${room.bed.name}`}
      className={`flex h-15 cursor-pointer flex-col justify-between rounded-xl border p-2.5 text-left transition-all shadow-2xs ${tileStyle}`}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <span className="text-xs font-bold tracking-tight">{room.number}</span>
        <FontAwesomeIcon
          icon={statusIcon}
          className={`size-3 ${statusIconColor}`}
        />
      </div>

      <div className="flex w-full items-center justify-between text-[10px] opacity-85">
        <span className="max-w-[64px] truncate font-medium">
          {room.bed.loading ? '…' : room.bed.name.split(' ')[0]}
        </span>
        {hasTariff && (
          <FontAwesomeIcon
            icon={faTag}
            className="size-2.5 text-emerald-600 dark:text-emerald-400"
            title="Tarifa aplicada"
          />
        )}
      </div>
    </button>
  );
});

export default HabitacionCompactTile;
