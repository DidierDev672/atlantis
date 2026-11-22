import { memo } from 'react';
import { motion } from 'motion/react';
import type { RoomRow } from '../../domain/habitacion-lista';
import { FLOOR_STAGGER_CONTAINER_VARIANTS } from '../lib/motion-variants';
import { HabitacionCardItem } from '../molecules/habitacion-card-item';

export interface HabitacionFloorCardsProps {
  rooms: RoomRow[];
  hasTariff?: (roomId: string) => boolean;
  getRateId?: (roomId: string) => string | null;
  getTariffPrice: (roomId: string) => number | null;
  getTariffName?: (roomId: string) => string | null;
  isVerifying?: boolean;
  onRetryBuilding?: (id: string) => void;
  onRetryBed: (id: string) => void;
  onOpenBuilding?: (id: string, summary: RoomRow['building'], room: RoomRow) => void;
  onOpenTarifas?: (row: RoomRow, hasTariff: boolean, rateId: string | null) => void;
  onOpenRoomDetail: (row: RoomRow) => void;
  onSelectHabitacion?: (row: RoomRow) => void;
  onOpenOperativaDrawer?: (row: RoomRow) => void;
  onOpenAssignGuestDrawer?: (row: RoomRow) => void;
  onQuickMarkAvailable?: (row: RoomRow) => Promise<void> | void;
}

export const HabitacionFloorCards = memo(function HabitacionFloorCards({
  rooms,
  getTariffPrice,
  onRetryBed,
  onOpenRoomDetail,
  onSelectHabitacion,
  onOpenOperativaDrawer,
  onOpenAssignGuestDrawer,
  onQuickMarkAvailable,
}: HabitacionFloorCardsProps) {
  return (
    <motion.div
      variants={FLOOR_STAGGER_CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5"
    >
      {rooms.map((row) => (
        <HabitacionCardItem
          key={row.id}
          room={row}
          tariffPrice={getTariffPrice(row.id)}
          onRetryBed={onRetryBed}
          onOpenRoomDetail={onOpenRoomDetail}
          onSelectHabitacion={onSelectHabitacion}
          onOpenOperativaDrawer={onOpenOperativaDrawer}
          onOpenAssignGuestDrawer={onOpenAssignGuestDrawer}
          onQuickMarkAvailable={onQuickMarkAvailable}
        />
      ))}
    </motion.div>
  );
});

export default HabitacionFloorCards;
