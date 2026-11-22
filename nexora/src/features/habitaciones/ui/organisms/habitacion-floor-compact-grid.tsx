import { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { RoomRow } from '../../domain/habitacion-lista';
import { FLOOR_CONTENT_FADE_VARIANTS } from '../lib/motion-variants';
import { HabitacionCompactTile } from '../molecules/habitacion-compact-tile';

export interface HabitacionFloorCompactGridProps {
  rooms: RoomRow[];
  hasTariff: (roomId: string) => boolean;
  onSelectRoom: (room: RoomRow) => void;
}

/**
 * Organismo: Grilla matricial compacta para visualización densa de habitaciones por piso
 * con una única transición ligera de contenedor (bajo consumo GPU).
 */
export const HabitacionFloorCompactGrid = memo(
  function HabitacionFloorCompactGrid({
    rooms,
    hasTariff,
    onSelectRoom,
  }: HabitacionFloorCompactGridProps) {
    const reducedMotion = useReducedMotion();

    return (
      <motion.div
        variants={reducedMotion ? undefined : FLOOR_CONTENT_FADE_VARIANTS}
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
        className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2"
      >
        {rooms.map((room) => (
          <HabitacionCompactTile
            key={room.id}
            room={room}
            hasTariff={hasTariff(room.id)}
            onSelectRoom={onSelectRoom}
          />
        ))}
      </motion.div>
    );
  }
);

export default HabitacionFloorCompactGrid;
