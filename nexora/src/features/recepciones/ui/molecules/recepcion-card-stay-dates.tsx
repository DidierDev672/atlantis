import { memo, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faCalendarXmark,
  faMoon,
} from '@fortawesome/free-solid-svg-icons';
import { calcularNoches, formatReadableDateTime } from '../../domain/recepcion';

export interface RecepcionCardStayDatesProps {
  checkIn: string;
  checkOut: string;
  noches?: number;
}

function formatDurationLabel(nightsCount: number): string {
  try {
    const safeNights = Math.max(1, Math.round(nightsCount));
    if (safeNights >= 7) {
      const weeks = Math.floor(safeNights / 7);
      const remainder = safeNights % 7;
      const weekLabel = weeks === 1 ? '1 semana' : `${weeks} semanas`;
      if (remainder === 0) {
        return `${weekLabel} (${safeNights} noches)`;
      }
      const remLabel = remainder === 1 ? '1 noche' : `${remainder} noches`;
      return `${weekLabel} y ${remLabel}`;
    }
    return safeNights === 1 ? '1 noche' : `${safeNights} noches`;
  } catch (err) {
    console.error('Error al formatear duración de estadía:', err);
    return '1 noche';
  }
}

/**
 * Molécula: Sección de Entrada y Salida con iconos de calendario y duración en noches o semanas.
 */
export const RecepcionCardStayDates = memo(function RecepcionCardStayDates({
  checkIn,
  checkOut,
  noches,
}: RecepcionCardStayDatesProps) {
  const { checkInFormatted, checkOutFormatted, durationLabel } = useMemo(() => {
    try {
      const nightsCount = noches ?? calcularNoches(checkIn, checkOut);
      return {
        checkInFormatted: formatReadableDateTime(checkIn),
        checkOutFormatted: formatReadableDateTime(checkOut),
        durationLabel: formatDurationLabel(nightsCount),
      };
    } catch (err) {
      console.error('Error al procesar fechas de estadía:', err);
      return {
        checkInFormatted: '—',
        checkOutFormatted: '—',
        durationLabel: '1 noche',
      };
    }
  }, [checkIn, checkOut, noches]);

  return (
    <div className="border-line/70 bg-canvas/50 space-y-2.5 rounded-xl border p-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div
          className="flex items-center gap-2.5"
          title={`Entrada: ${checkInFormatted}`}
        >
          <span
            aria-label="Fecha de entrada"
            className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          >
            <FontAwesomeIcon
              icon={faCalendarCheck}
              className="size-3.5"
              aria-hidden="true"
            />
          </span>
          <span className="text-ink min-w-0 truncate text-xs font-semibold">
            {checkInFormatted}
          </span>
        </div>

        <div
          className="flex items-center gap-2.5"
          title={`Salida: ${checkOutFormatted}`}
        >
          <span
            aria-label="Fecha de salida"
            className="grid size-7 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400"
          >
            <FontAwesomeIcon
              icon={faCalendarXmark}
              className="size-3.5"
              aria-hidden="true"
            />
          </span>
          <span className="text-ink min-w-0 truncate text-xs font-semibold">
            {checkOutFormatted}
          </span>
        </div>
      </div>

      <div className="border-line/50 flex items-center justify-between border-t pt-2 text-[11px]">
        <span className="text-ink-muted inline-flex items-center gap-1.5 font-medium">
          <FontAwesomeIcon
            icon={faMoon}
            className="text-primary size-3"
            aria-hidden="true"
          />
          <span>Duración de estadía</span>
        </span>
        <span className="text-primary font-bold">{durationLabel}</span>
      </div>
    </div>
  );
});

export default RecepcionCardStayDates;
