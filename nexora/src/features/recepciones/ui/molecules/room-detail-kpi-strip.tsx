import { memo, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBed,
  faBellConcierge,
  faStairs,
  faTag,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { formatCOP, type RoomCatalogItem } from '../../../../shared/catalog';
import {
  computePriceDeltaLabel,
  formatCapacityLabel,
} from '../../domain/room-detail-modal';

export interface RoomDetailKpiStripProps {
  room: RoomCatalogItem;
  roomTypeName: string;
  capacity?: number | null;
  basePrice?: number | null;
}

/**
 * Molécula: Grilla de 4 métricas clave (Piso, Tipo, Capacidad, Tarifa especial)
 * y barra punteada de estado del servicio de recepción.
 */
export const RoomDetailKpiStrip = memo(function RoomDetailKpiStrip({
  room,
  roomTypeName,
  capacity,
  basePrice,
}: RoomDetailKpiStripProps) {
  const { capacityLabel, effectiveRateLabel, isSpecialRate, deltaInfo } =
    useMemo(() => {
      try {
        const hasOverride = room.price_override != null;
        const rateValue = hasOverride ? room.price_override : basePrice;
        return {
          capacityLabel: formatCapacityLabel(capacity),
          effectiveRateLabel:
            rateValue != null ? formatCOP(rateValue).replace(/\s*COP$/, '') : 'Sin tarifa',
          isSpecialRate: hasOverride,
          deltaInfo: computePriceDeltaLabel(room.price_override, basePrice),
        };
      } catch (err) {
        console.error('Error al calcular KPIs de habitación:', err);
        return {
          capacityLabel: '2 huéspedes',
          effectiveRateLabel: 'Sin tarifa',
          isSpecialRate: false,
          deltaInfo: null,
        };
      }
    }, [basePrice, capacity, room.price_override]);

  return (
    <div className="space-y-3">
      {/* 4 tarjetas métricas superiores */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* 1. Piso */}
        <div className="border-line/40 bg-canvas flex flex-col justify-between rounded-2xl border p-3.5">
          <FontAwesomeIcon
            icon={faStairs}
            className="text-ink-muted size-3.5"
            aria-hidden="true"
          />
          <div className="mt-2.5">
            <span className="text-ink-muted block text-[11px] font-medium">
              Piso
            </span>
            <p className="text-ink mt-0.5 text-base font-bold">{room.floor}</p>
          </div>
        </div>

        {/* 2. Tipo */}
        <div className="border-line/40 bg-canvas flex flex-col justify-between rounded-2xl border p-3.5">
          <FontAwesomeIcon
            icon={faBed}
            className="text-ink-muted size-3.5"
            aria-hidden="true"
          />
          <div className="mt-2.5 min-w-0">
            <span className="text-ink-muted block text-[11px] font-medium">
              Tipo
            </span>
            <p className="text-ink mt-0.5 truncate text-base font-bold">
              {roomTypeName}
            </p>
          </div>
        </div>

        {/* 3. Capacidad */}
        <div className="border-line/40 bg-canvas flex flex-col justify-between rounded-2xl border p-3.5">
          <FontAwesomeIcon
            icon={faUsers}
            className="text-ink-muted size-3.5"
            aria-hidden="true"
          />
          <div className="mt-2.5">
            <span className="text-ink-muted block text-[11px] font-medium">
              Capacidad
            </span>
            <p className="text-ink mt-0.5 text-base leading-tight font-bold">
              {capacityLabel}
            </p>
          </div>
        </div>

        {/* 4. Tarifa especial */}
        <div className="border-line/40 bg-canvas flex flex-col justify-between rounded-2xl border p-3.5">
          <FontAwesomeIcon
            icon={faTag}
            className="text-ink-muted size-3.5"
            aria-hidden="true"
          />
          <div className="mt-2.5 min-w-0">
            <span className="text-ink-muted block text-[11px] font-medium">
              {isSpecialRate ? 'Tarifa especial' : 'Tarifa por noche'}
            </span>
            <p className="text-ink mt-0.5 truncate text-base font-bold">
              {effectiveRateLabel}
            </p>
            {deltaInfo && (
              <p className={`mt-0.5 text-[11px] font-medium ${deltaInfo.toneClass}`}>
                {deltaInfo.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Barra punteada de servicio de recepción */}
      <div className="border-line/80 bg-panel flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-2.5 text-xs">
        <span className="text-ink flex items-center gap-2 font-medium">
          <FontAwesomeIcon
            icon={faBellConcierge}
            className="text-ink-muted size-3.5"
            aria-hidden="true"
          />
          <span>
            {room.has_reception
              ? 'Servicio de recepción asignado'
              : 'Sin servicio de recepción asignado'}
          </span>
        </span>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
            room.has_reception
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-line bg-canvas text-ink-muted'
          }`}
        >
          {room.has_reception ? 'Habilitada' : 'No asignada'}
        </span>
      </div>
    </div>
  );
});

export default RoomDetailKpiStrip;
