import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faPhone } from '@fortawesome/free-solid-svg-icons';

export interface ReservaDropdownOptionContentProps {
  guestName: string;
  phone: string | null;
  inDate: string;
  outDate: string;
  guestCount: number;
  extraGuests: number;
}

/**
 * Molécula: Contenido visual de una opción de reserva en el dropdown,
 * renderizado bajo demanda cuando la lista está abierta.
 */
export const ReservaDropdownOptionContent = memo(
  function ReservaDropdownOptionContent({
    guestName,
    phone,
    inDate,
    outDate,
    guestCount,
    extraGuests,
  }: ReservaDropdownOptionContentProps) {
    return (
      <div className="flex w-full items-center justify-between gap-2.5 py-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-ink truncate text-xs font-semibold">
              {guestName}
            </p>
            {extraGuests > 0 && (
              <span
                title={`${guestCount} huéspedes en total (${extraGuests} adicional${extraGuests > 1 ? 'es' : ''})`}
                className="bg-primary/10 text-primary ring-primary/25 inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1"
              >
                +{extraGuests}
              </span>
            )}
          </div>
          <div className="text-ink-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="flex shrink-0 items-center gap-1.5">
              <FontAwesomeIcon
                icon={faPhone}
                className="text-primary/70 size-2.5 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{phone ?? 'Sin teléfono'}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="size-2.5 shrink-0"
                aria-hidden="true"
              />
              <span>Entrada: {inDate}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="size-2.5 shrink-0"
                aria-hidden="true"
              />
              <span>Salida: {outDate}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export default ReservaDropdownOptionContent;
