import { memo } from 'react';
import { motion } from 'motion/react';
import type { RoomRow } from '../../domain/habitacion-lista';
import { FLOOR_STAGGER_CONTAINER_VARIANTS } from '../lib/motion-variants';
import { HabitacionCompactTile } from '../molecules/habitacion-compact-tile';

export interface HabitacionFloorCompactGridProps {
  rooms: RoomRow[];
  hasTariff: (roomId: string) => boolean;
  onSelectRoom: (room: RoomRow) => void;
}

/**
 * Organismo: Grilla matricial compacta (12 columnas) para visualización densa de habitaciones por piso.
 */
export const HabitacionFloorCompactGrid = memo(
  function HabitacionFloorCompactGrid({
    rooms,
    hasTariff,
    onSelectRoom,
  }: HabitacionFloorCompactGridProps) {
    return (
      <motion.div
        variants={FLOOR_STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
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
