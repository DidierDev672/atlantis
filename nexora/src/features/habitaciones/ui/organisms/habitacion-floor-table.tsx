import { memo } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faBuilding, faTags } from '@fortawesome/free-solid-svg-icons';
import type { RoomRow } from '../../domain/habitacion-lista';
import { FLOOR_STAGGER_CONTAINER_VARIANTS } from '../lib/motion-variants';
import { HabitacionTableRow } from '../molecules/habitacion-table-row';

export interface HabitacionFloorTableProps {
  rooms: RoomRow[];
  hasTariff: (roomId: string) => boolean;
  getRateId: (roomId: string) => string | null;
  getTariffPrice: (roomId: string) => number | null;
  getTariffName: (roomId: string) => string | null;
  isVerifying: boolean;
  onRetryBuilding: (id: string) => void;
  onRetryBed: (id: string) => void;
  onOpenBuilding: (id: string, summary: RoomRow['building'], room: RoomRow) => void;
  onOpenTarifas: (row: RoomRow, hasTariff: boolean, rateId: string | null) => void;
  onOpenRoomDetail: (row: RoomRow) => void;
  onSelectHabitacion?: (row: RoomRow) => void;
}

export const HabitacionFloorTable = memo(function HabitacionFloorTable({
  rooms,
  hasTariff,
  getRateId,
  getTariffPrice,
  getTariffName,
  isVerifying,
  onRetryBuilding,
  onRetryBed,
  onOpenBuilding,
  onOpenTarifas,
  onOpenRoomDetail,
  onSelectHabitacion,
}: HabitacionFloorTableProps) {
  return (
    <div className="border-line overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-xs">
        <thead className="bg-canvas border-line text-ink-muted border-b text-[11px] font-semibold tracking-wider uppercase">
          <tr>
            <th scope="col" className="px-5 py-3 sm:px-6">
              Número
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={faBuilding} className="text-ink-muted/70 size-3" />
                <span>Edificio</span>
              </span>
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={faBed} className="text-ink-muted/70 size-3" />
                <span>Tipo de habitación</span>
              </span>
            </th>
            <th scope="col" className="px-4 py-3">
              Estado
            </th>
            <th scope="col" className="px-4 py-3">
              Precio
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={faTags} className="text-ink-muted/70 size-3" />
                <span>Tarifas</span>
              </span>
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Actualizado
            </th>
          </tr>
        </thead>

        <motion.tbody
          variants={FLOOR_STAGGER_CONTAINER_VARIANTS}
          initial="hidden"
          animate="visible"
          className="divide-line divide-y"
        >
          {rooms.map((row) => (
            <HabitacionTableRow
              key={row.id}
              row={row}
              hasTariff={hasTariff(row.id)}
              isVerifying={isVerifying}
              tariffPrice={getTariffPrice(row.id)}
              tariffName={getTariffName(row.id)}
              rateId={getRateId(row.id)}
              onRetryBuilding={onRetryBuilding}
              onRetryBed={onRetryBed}
              onOpenBuilding={onOpenBuilding}
              onOpenTarifas={onOpenTarifas}
              onOpenRoomDetail={onOpenRoomDetail}
              onSelectHabitacion={onSelectHabitacion}
            />
          ))}
        </motion.tbody>
      </table>
    </div>
  );
});

export default HabitacionFloorTable;
