import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { UbicacionRegistroPill } from '../atoms/ubicacion-registro-pill';
import type { RoomLocationHierarchy } from '../../domain/room-location-types';

export interface RoomDropdownItemProps {
  hierarchy: RoomLocationHierarchy;
  isSelected?: boolean;
}

/**
 * Renderiza la opción del dropdown de habitaciones bajo el formato estricto:
 * (habitacion - piso - edificio - sede - sub sede)
 *
 * En caso de no tener edificio, sede o sub-sede registrada, incorpora las
 * píldoras visuales correspondientes para alertar al recepcionista.
 */
export function RoomDropdownItem({ hierarchy }: RoomDropdownItemProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs leading-snug">
      {/* Habitación */}
      <span className="text-ink inline-flex items-center gap-1 font-bold">
        <FontAwesomeIcon
          icon={faBed}
          className="text-primary size-3 opacity-80"
        />
        <span>Habitación {hierarchy.roomNumber}</span>
      </span>

      <span className="text-neutral/70 font-medium">-</span>

      {/* Piso */}
      <span className="text-ink-muted inline-flex items-center gap-1 font-medium">
        <FontAwesomeIcon icon={faLayerGroup} className="size-2.5 opacity-70" />
        <span>Piso {hierarchy.floor}</span>
      </span>

      <span className="text-neutral/70 font-medium">-</span>

      {/* Edificio */}
      <UbicacionRegistroPill
        tipo="edificio"
        name={hierarchy.hasBuilding ? hierarchy.buildingName : null}
      />

      <span className="text-neutral/70 font-medium">-</span>

      {/* Sede */}
      <UbicacionRegistroPill
        tipo="sede"
        name={hierarchy.hasHeadquarters ? hierarchy.headquartersName : null}
      />

      <span className="text-neutral/70 font-medium">-</span>

      {/* Sub Sede */}
      <UbicacionRegistroPill
        tipo="sub-sede"
        name={
          hierarchy.hasSubHeadquarters ? hierarchy.subHeadquartersName : null
        }
      />
    </div>
  );
}
