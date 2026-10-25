import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { formatPrecioCOP } from '../../domain/reserva';
import { UbicacionRegistroPill } from '../atoms/ubicacion-registro-pill';
import type { RoomLocationHierarchy } from '../../domain/room-location-types';
import type { RoomOption } from '../organisms/reserva-interactive-form';

export interface RoomSelectedHierarchyCardProps {
  room: RoomOption;
  hierarchy?: RoomLocationHierarchy | null;
}

/**
 * Tarjeta de detalle visual de la habitación seleccionada por el recepcionista.
 * Despliega la jerarquía completa: (habitación - piso - edificio - sede - sub sede)
 * junto con la tarifa por noche y las píldoras de advertencia si no están registradas.
 */
export function RoomSelectedHierarchyCard({
  room,
  hierarchy,
}: RoomSelectedHierarchyCardProps) {
  const floorVal = hierarchy?.floor ?? room.floor;
  const hasBuilding = hierarchy?.hasBuilding ?? false;
  const buildingName = hierarchy?.buildingName ?? null;
  const hasHq = hierarchy?.hasHeadquarters ?? false;
  const hqName = hierarchy?.headquartersName ?? null;
  const hasSubHq = hierarchy?.hasSubHeadquarters ?? false;
  const subHqName = hierarchy?.subHeadquartersName ?? null;

  return (
    <div className="mt-2.5 space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-ink shadow-2xs">
      {/* Fila principal: Habitación, Piso y Tarifa */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 pb-2">
        <div className="flex items-center gap-2">
          <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <FontAwesomeIcon icon={faBed} className="size-3.5" />
          </div>
          <div>
            <span className="font-bold text-ink sm:text-sm">
              Habitación {room.number}
            </span>
            <span className="ml-2 inline-flex items-center gap-1 font-medium text-ink-muted text-[11px]">
              <FontAwesomeIcon icon={faLayerGroup} className="size-2.5 opacity-70" />
              Piso {floorVal}
            </span>
          </div>
        </div>

        {room.price_override != null && (
          <span className="text-[11px] font-semibold text-primary">
            Tarifa: {formatPrecioCOP(room.price_override)} / noche
          </span>
        )}
      </div>

      {/* Fila de Ubicación Jerárquica: Edificio - Sede - Sub Sede */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral/80">
          Ubicación:
        </span>

        {/* Edificio */}
        <UbicacionRegistroPill
          tipo="edificio"
          name={hasBuilding ? buildingName : null}
        />

        <span className="text-neutral/50 font-bold">/</span>

        {/* Sede */}
        <UbicacionRegistroPill
          tipo="sede"
          name={hasHq ? hqName : null}
        />

        <span className="text-neutral/50 font-bold">/</span>

        {/* Sub Sede */}
        <UbicacionRegistroPill
          tipo="sub-sede"
          name={hasSubHq ? subHqName : null}
        />
      </div>
    </div>
  );
}
