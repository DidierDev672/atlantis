import { memo, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBed,
  faBuilding,
  faCity,
  faLocationDot,
  faMoneyBillWave,
  faTag,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
  formatCOP,
  type BuildingCatalogItem,
  type HeadquarterCatalogItem,
  type RoomCatalogItem,
  type SubHeadquarterCatalogItem,
} from '../../../../shared/catalog';
import { formatCapacityLabel } from '../../domain/room-detail-modal';

export interface RoomDetailExtraSectionsProps {
  room: RoomCatalogItem;
  roomTypeName: string;
  capacity?: number | null;
  basePrice?: number | null;
  building: BuildingCatalogItem | null;
  headquarter: HeadquarterCatalogItem | null;
  subHeadquarter: SubHeadquarterCatalogItem | null;
}

/**
 * Molécula: Secciones "Más detalles" (Ciudad/Subsede, Edificio, Sede)
 * y "Tipo de habitación" (Tipo, Capacidad, Precio base y Tarifa aplicada).
 */
export const RoomDetailExtraSections = memo(function RoomDetailExtraSections({
  room,
  roomTypeName,
  capacity,
  basePrice,
  building,
  headquarter,
  subHeadquarter,
}: RoomDetailExtraSectionsProps) {
  const { capacityLabel, basePriceFormatted, roomRateText } = useMemo(() => {
    try {
      const cap = formatCapacityLabel(capacity);
      const baseFormatted =
        basePrice != null
          ? formatCOP(basePrice).replace(/\s*COP$/, '')
          : 'No registrado';
      const overrideFormatted =
        room.price_override != null
          ? formatCOP(room.price_override).replace(/\s*COP$/, '')
          : null;

      return {
        capacityLabel: cap,
        basePriceFormatted: baseFormatted,
        roomRateText: overrideFormatted
          ? `${overrideFormatted} · especial`
          : basePrice != null
            ? `${baseFormatted} · base`
            : 'No registrada',
      };
    } catch (err) {
      console.error('Error al formatear detalles del tipo de habitación:', err);
      return {
        capacityLabel: '2 huéspedes',
        basePriceFormatted: '—',
        roomRateText: '—',
      };
    }
  }, [basePrice, capacity, room.price_override]);

  const thirdContextLabel = subHeadquarter?.name ? 'Subsede' : 'Ciudad';
  const thirdContextValue =
    subHeadquarter?.name || headquarter?.city || 'Principal';

  return (
    <div className="space-y-4">
      {/* Sección: Más detalles */}
      <section aria-label="Más detalles de ubicación" className="space-y-2.5">
        <h4 className="text-ink-muted text-xs font-medium">Más detalles</h4>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="border-line/70 bg-panel rounded-2xl border p-3.5">
            <FontAwesomeIcon
              icon={faCity}
              className="text-ink size-3.5"
              aria-hidden="true"
            />
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5 text-xs">
              <span className="text-ink-muted">{thirdContextLabel}</span>
              <span className="text-ink font-semibold">{thirdContextValue}</span>
            </div>
          </div>

          <div className="border-line/70 bg-panel rounded-2xl border p-3.5">
            <FontAwesomeIcon
              icon={faBuilding}
              className="text-ink size-3.5"
              aria-hidden="true"
            />
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5 text-xs">
              <span className="text-ink-muted">Edificio</span>
              <span className="text-ink font-semibold">
                {building?.name || 'Torre Principal'}
              </span>
            </div>
          </div>

          <div className="border-line/70 bg-panel rounded-2xl border p-3.5">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="text-ink size-3.5"
              aria-hidden="true"
            />
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5 text-xs">
              <span className="text-ink-muted">Sede</span>
              <span className="text-ink font-semibold">
                {headquarter?.name || 'Sede Principal'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sección: Tipo de habitación */}
      <section
        aria-label="Detalles del tipo de habitación"
        className="border-line/70 bg-panel space-y-3.5 rounded-2xl border p-4"
      >
        <h4 className="text-ink text-xs font-semibold">Tipo de habitación</h4>

        <div className="grid grid-cols-1 gap-3.5 text-xs sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faBed}
              className="text-ink-muted mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-ink-muted block text-[11px]">Tipo</span>
              <span className="text-ink block truncate font-semibold">
                {roomTypeName}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faUsers}
              className="text-ink-muted mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-ink-muted block text-[11px]">Capacidad</span>
              <span className="text-ink block truncate font-semibold">
                {capacityLabel}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faMoneyBillWave}
              className="text-ink-muted mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-ink-muted block text-[11px]">
                Precio base por noche
              </span>
              <span className="text-ink block truncate font-semibold">
                {basePriceFormatted}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 sm:col-span-2">
            <FontAwesomeIcon
              icon={faTag}
              className="text-ink-muted mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-ink-muted block text-[11px]">
                Tarifa de esta habitación
              </span>
              <span className="text-ink block truncate font-semibold">
                {roomRateText}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export default RoomDetailExtraSections;
