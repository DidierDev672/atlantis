import { memo } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faCheck,
  faRotateRight,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { type RoomRow, puedeAsignarHuesped } from '../../domain/habitacion-lista';
import { formatCurrencyCOP, formatRelativeTimeEs } from '../lib/formatters';
import { FLOOR_STAGGER_ROW_VARIANTS } from '../lib/motion-variants';
import { HabitacionStatusBadge } from './habitacion-status-badge';
import { HabitacionTariffCell } from './habitacion-tariff-cell';

export interface HabitacionTableRowProps {
  row: RoomRow;
  hasTariff: boolean;
  isVerifying: boolean;
  tariffPrice: number | null;
  tariffName: string | null;
  rateId: string | null;
  onRetryBuilding: (id: string) => void;
  onRetryBed: (id: string) => void;
  onOpenBuilding: (id: string, summary: RoomRow['building'], room: RoomRow) => void;
  onOpenTarifas: (row: RoomRow, hasTariff: boolean, rateId: string | null) => void;
  onOpenRoomDetail: (row: RoomRow) => void;
  onSelectHabitacion?: (row: RoomRow) => void;
}

export const HabitacionTableRow = memo(function HabitacionTableRow({
  row,
  hasTariff,
  isVerifying,
  tariffPrice,
  tariffName,
  rateId,
  onRetryBuilding,
  onRetryBed,
  onOpenBuilding,
  onOpenTarifas,
  onOpenRoomDetail,
  onSelectHabitacion,
}: HabitacionTableRowProps) {
  const canAssign = puedeAsignarHuesped(row.status);

  const handlePrimaryClick = () => {
    if (!canAssign || !onSelectHabitacion) {
      onOpenRoomDetail(row);
      return;
    }
    onSelectHabitacion(row);
  };

  return (
    <motion.tr
      variants={FLOOR_STAGGER_ROW_VARIANTS}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        handlePrimaryClick();
      }}
      className={
        canAssign
          ? 'group hover:bg-canvas/70 cursor-pointer transition-colors'
          : 'group hover:bg-canvas/40 transition-colors'
      }
    >
      <td className="px-5 py-3.5 whitespace-nowrap sm:px-6">
        <button
          type="button"
          onClick={handlePrimaryClick}
          className={`${canAssign ? 'group/num cursor-pointer' : ''} focus-visible:ring-primary/40 flex items-center gap-3 rounded-xl text-left focus-visible:ring-2 focus-visible:outline-none`}
          title={
            canAssign
              ? 'Haz clic para asignar huésped a esta habitación'
              : `Habitación ${row.number} (Ocupada - ver detalle)`
          }
        >
          <span
            className={
              hasTariff
                ? 'relative grid size-8 shrink-0 place-items-center rounded-lg border border-emerald-500/35 bg-emerald-500/15 text-xs font-bold text-emerald-700 shadow-2xs transition-colors group-hover/num:bg-emerald-600 group-hover/num:text-white dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-primary/10 text-primary group-hover/num:bg-primary relative grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold shadow-2xs transition-colors group-hover/num:text-white'
            }
          >
            {row.number}
            {hasTariff && (
              <span className="absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full bg-emerald-600 text-white shadow-xs">
                <FontAwesomeIcon icon={faCheck} className="size-2" />
              </span>
            )}
          </span>
          <div>
            <span className="text-ink group-hover/num:text-primary block font-bold transition-colors">
              Habitación{' '}
              <span className={hasTariff ? 'font-extrabold text-emerald-600 dark:text-emerald-400' : ''}>
                {row.number}
              </span>
            </span>
            <span className="text-ink-muted group-hover/num:text-primary/80 block text-[11px] transition-colors">
              {canAssign ? 'Asignar huésped' : 'Ver detalle'}
            </span>
          </div>
        </button>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        {row.building.loading ? (
          <span className="bg-line/60 inline-block h-4 w-24 animate-pulse rounded" />
        ) : row.building.error ? (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-3 text-amber-500" />
            <span className="text-xs">No disponible</span>
            <button
              type="button"
              onClick={() => row.buildingId && onRetryBuilding(row.buildingId)}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold underline hover:text-amber-700"
            >
              <FontAwesomeIcon icon={faRotateRight} className="size-2.5" />
              <span>Reintentar</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => row.buildingId && onOpenBuilding(row.buildingId, row.building, row)}
            className="group/bldg border-line/40 bg-canvas/60 hover:border-primary/40 hover:bg-primary/10 focus-visible:ring-primary/40 flex cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left transition-all focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-primary/10 text-primary group-hover/bldg:bg-primary grid size-7 shrink-0 place-items-center rounded-lg shadow-2xs transition-colors group-hover/bldg:text-white">
              <FontAwesomeIcon icon={faBuilding} className="size-3.5" />
            </span>
            <span className="text-ink group-hover/bldg:text-primary truncate font-semibold transition-colors">
              {row.building.name}
            </span>
          </button>
        )}
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        {row.bed.loading ? (
          <span className="bg-line/60 inline-block h-4 w-28 animate-pulse rounded" />
        ) : row.bed.error ? (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
              <FontAwesomeIcon icon={faTriangleExclamation} className="size-3 text-amber-500" />
              <span>No disponible</span>
            </span>
            <button
              type="button"
              onClick={() => row.roomTypesId && onRetryBed(row.roomTypesId)}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold underline"
            >
              <FontAwesomeIcon icon={faRotateRight} className="size-2.5" />
              <span>Reintentar</span>
            </button>
          </div>
        ) : (
          <span className="text-ink truncate font-semibold">
            {row.bed.name}
          </span>
        )}
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <HabitacionStatusBadge status={row.status} />
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="space-y-1">
          {row.priceOverride != null ? (
            <span className="text-ink block font-extrabold">
              {formatCurrencyCOP(row.priceOverride)}
            </span>
          ) : (
            <span className="text-ink-muted block text-xs font-medium italic">Precio base</span>
          )}
          {hasTariff && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300">
              <span>+</span>
              <span>{tariffPrice != null ? formatCurrencyCOP(tariffPrice) : 'Tarifa activa'}</span>
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <HabitacionTariffCell
          hasTariff={hasTariff}
          isVerifying={isVerifying}
          tariffPrice={tariffPrice}
          tariffName={tariffName}
          onOpenTarifas={() => onOpenTarifas(row, hasTariff, rateId)}
        />
      </td>

      <td className="text-ink-muted px-4 py-3.5 text-right whitespace-nowrap">
        <span title={row.updatedAt ? new Date(row.updatedAt).toLocaleString('es-ES') : 'Fecha no registrada'}>
          {formatRelativeTimeEs(row.updatedAt)}
        </span>
      </td>
    </motion.tr>
  );
});
