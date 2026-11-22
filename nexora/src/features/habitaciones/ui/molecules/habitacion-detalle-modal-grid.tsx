import { memo } from 'react';
import type { RoomRow } from '../../domain/habitacion-lista';
import { formatCurrencyCOP } from '../lib/formatters';

export interface HabitacionDetalleGridProps {
  room: RoomRow;
  hasTariff: boolean;
  tariffPrice: number | null;
  tariffName: string | null;
  rateId: string | null;
  description?: string;
  onOpenTarifas?: (room: {
    id?: string;
    number: string;
    floor: number | string;
    hasTariff?: boolean;
    rateId?: string | null;
  }) => void;
  onOpenBed?: (bedId: string | null, summary?: RoomRow['bed']) => void;
  onOpenBuilding?: (buildingId: string, summary?: RoomRow['building']) => void;
}

function formatFullDate(dateString?: string): string {
  if (!dateString) return 'Fecha no registrada';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Fecha no registrada';
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Molécula: Rejilla de módulos informativos de la ficha de habitación.
 */
export const HabitacionDetalleModalGrid = memo(
  function HabitacionDetalleModalGrid({
    room,
    hasTariff,
    tariffPrice,
    tariffName,
    rateId,
    description,
    onOpenTarifas,
    onOpenBed,
    onOpenBuilding,
  }: HabitacionDetalleGridProps) {
    return (
      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="border-line bg-panel rounded-2xl border p-4 shadow-2xs">
          <div className="border-line/60 flex items-center justify-between gap-2 border-b pb-2.5">
            <span className="text-ink flex items-center gap-1.5 text-xs font-bold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary size-4"
              >
                <path d="M3 21h18" />
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                <path d="M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
              </svg>
              Ubicación y Edificio
            </span>
            {room.buildingId && onOpenBuilding && (
              <button
                type="button"
                onClick={() => onOpenBuilding(room.buildingId!, room.building)}
                className="text-primary cursor-pointer text-[11px] font-semibold hover:underline"
              >
                Ver edificio →
              </button>
            )}
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">Edificio:</span>
              <span className="text-ink font-semibold">
                {room.building.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Nivel / Piso:</span>
              <span className="text-ink font-semibold">
                Piso {room.floor}
                {room.building.floorNumber
                  ? ` (de ${room.building.floorNumber} pisos)`
                  : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="border-line bg-panel rounded-2xl border p-4 shadow-2xs">
          <div className="border-line/60 flex items-center justify-between gap-2 border-b pb-2.5">
            <span className="text-ink flex items-center gap-1.5 text-xs font-bold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary size-4"
              >
                <path d="M2 4v16" />
                <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                <path d="M2 17h20" />
                <path d="M6 8v9" />
              </svg>
              Alojamiento y Capacidad
            </span>
            {room.roomTypesId && onOpenBed && (
              <button
                type="button"
                onClick={() => onOpenBed(room.roomTypesId ?? null, room.bed)}
                className="text-primary cursor-pointer text-[11px] font-semibold hover:underline"
              >
                Ver cama →
              </button>
            )}
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">Tipo de cama:</span>
              <span className="text-ink font-semibold">{room.bed.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Capacidad recomendada:</span>
              <span className="text-ink font-semibold">
                {room.bed.capacityPeople
                  ? `${room.bed.capacityPeople} ${
                      room.bed.capacityPeople === 1 ? 'persona' : 'personas'
                    }`
                  : 'No especificada'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-line bg-panel rounded-2xl border p-4 shadow-2xs sm:col-span-2">
          <div className="border-line/60 flex items-center justify-between gap-2 border-b pb-2.5">
            <span className="text-ink flex items-center gap-1.5 text-xs font-bold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-4 text-emerald-600 dark:text-emerald-400"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Tarifas y Facturación
            </span>

            {onOpenTarifas && (
              <button
                type="button"
                onClick={() =>
                  onOpenTarifas({
                    id: room.id,
                    number: room.number,
                    floor: room.floor,
                    hasTariff,
                    rateId,
                  })
                }
                className="cursor-pointer text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {hasTariff ? 'Ver plan tarifario →' : 'Asignar tarifa →'}
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="border-line/60 bg-canvas/60 rounded-xl border p-3">
              <span className="text-ink-muted block text-[11px]">
                Precio de habitación
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-ink text-base font-extrabold">
                  {room.priceOverride != null
                    ? formatCurrencyCOP(room.priceOverride)
                    : 'Tarifa base'}
                </span>
                {room.priceOverride != null && (
                  <span className="text-primary text-[10px] font-semibold tracking-wider uppercase">
                    Precio especial
                  </span>
                )}
              </div>
            </div>

            <div
              className={`rounded-xl border p-3 ${
                hasTariff
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-line/60 bg-canvas/60'
              }`}
            >
              <span className="text-ink-muted block text-[11px]">
                Tarifa comercial aplicada
              </span>
              {hasTariff ? (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div>
                    <span className="block font-bold text-emerald-950 dark:text-emerald-200">
                      {tariffName ?? 'Tarifa activa configurada'}
                    </span>
                    {tariffPrice != null && (
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                        + {formatCurrencyCOP(tariffPrice)}
                      </span>
                    )}
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    ACTIVA
                  </span>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-ink-muted italic">
                    Sin tarifa aplicada actualmente
                  </span>
                  {onOpenTarifas && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTarifas({
                          id: room.id,
                          number: room.number,
                          floor: room.floor,
                          hasTariff: false,
                          rateId: null,
                        })
                      }
                      className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer rounded-lg px-2 py-1 text-[11px] font-semibold"
                    >
                      Vincular
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-line bg-panel rounded-2xl border p-4 shadow-2xs sm:col-span-2">
          <span className="border-line/60 text-ink block border-b pb-2 text-xs font-bold">
            Metadatos y Auditoría del Sistema
          </span>

          <div className="mt-3 flex flex-col gap-2.5 text-xs">
            <div className="border-line/60 bg-canvas/60 space-y-1 rounded-xl border px-3 py-2">
              <div className="flex justify-between">
                <span className="text-ink-muted text-[11px]">
                  Última actualización:
                </span>
                <span className="text-ink text-[11px] font-semibold">
                  {formatFullDate(room.updatedAt)}
                </span>
              </div>
              {room.createdAt && (
                <div className="flex justify-between">
                  <span className="text-ink-muted text-[11px]">
                    Registrada el:
                  </span>
                  <span className="text-ink text-[11px] font-semibold">
                    {formatFullDate(room.createdAt)}
                  </span>
                </div>
              )}
            </div>

            {description && (
              <div className="border-line/60 bg-canvas/60 rounded-xl border px-3 py-2">
                <span className="text-ink-muted block text-[10px] font-semibold uppercase">
                  Descripción u observaciones
                </span>
                <p className="text-ink mt-0.5 text-xs leading-relaxed">
                  {description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default HabitacionDetalleModalGrid;
