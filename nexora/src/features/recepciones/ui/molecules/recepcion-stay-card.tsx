import { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { staggerItem } from '../../../../design-tokens/motion';
import { useGuestNames } from '../../application/use-guest-names';
import { useRoomNumber } from '../../application/use-room-numbers';
import { HuespedDetalleModal } from './huesped-detalle-modal';
import { RoomDetailModal } from './room-detail-modal';
import { RecepcionEstadoBadge } from '../atoms/recepcion-estado-badge';
import { RandomPlanet } from '../../../../shared/planets';
import {
  calculateStayNights,
  formatGuestInitials,
  formatPaymentMethod,
  formatSecurityDeposit,
  formatStayDate,
  type StayItem,
} from '../../domain/stay';

export interface RecepcionStayCardProps {
  stay: StayItem;
  onClick?: (stay: StayItem) => void;
  variants?: Variants;
}

/**
 * Card de visualización para una estancia/recepción.
 * Contiene de forma destacada y accesible los 6 campos requeridos:
 * 1. Habitación (número legible vía GET /room/{id}, sin IDs técnicos)
 * 2. person_ids (interactivo: clic abre ficha del huésped vía GET /person/{id})
 * 3. check_in_date
 * 4. check_out_date
 * 5. payment_method
 * 6. security_deposit
 */
export function RecepcionStayCard({
  stay,
  onClick,
  variants,
}: RecepcionStayCardProps) {
  const [inspectPersonId, setInspectPersonId] = useState<string | null>(null);
  const [inspectRoomId, setInspectRoomId] = useState<string | null>(null);
  const guestNames = useGuestNames(stay.person_ids);
  const roomNumber = useRoomNumber(stay.room_id);

  const paymentInfo = formatPaymentMethod(stay.payment_method);
  const checkIn = formatStayDate(stay.check_in_date);
  const checkOut = formatStayDate(stay.check_out_date);
  const depositFormatted = formatSecurityDeposit(stay.security_deposit);
  const nights = calculateStayNights(stay.check_in_date, stay.check_out_date);

  return (
    <>
      <motion.article
        layout
        variants={variants ?? staggerItem}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        onClick={() => onClick?.(stay)}
        tabIndex={0}
        role="button"
        aria-label={
          roomNumber ? `Estancia en Habitación ${roomNumber}` : 'Estancia'
        }
        className="group border-line bg-panel text-ink hover:border-primary/30 focus-visible:ring-primary/40 relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-xs transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* Indicador de acento en el borde superior */}
        <div className="from-primary/30 via-primary to-primary/30 absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100" />

        <div>
          {/* Cabecera: Habitación + Status Badge */}
          <div className="border-line/60 flex items-start justify-between gap-3 border-b pb-3.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setInspectRoomId(stay.room_id);
              }}
              title={
                roomNumber
                  ? `Ver detalle de la habitación ${roomNumber}`
                  : 'Ver detalle de la habitación'
              }
              className="group/room hover:bg-primary/5 -m-1 flex cursor-pointer items-center gap-2.5 rounded-xl p-1 text-left transition-colors"
            >
              <span className="bg-primary/10 text-primary border-primary/20 group-hover/room:bg-primary/20 grid size-10 shrink-0 place-items-center rounded-xl border transition-colors">
                {/* Planeta aleatorio cósmico de /shared */}
                <RandomPlanet
                  size={24}
                  seed={stay.room_id || stay.id}
                  interactive
                />
              </span>
              <div>
                <span className="text-ink-muted group-hover/room:text-primary block text-[11px] font-semibold tracking-wider uppercase transition-colors">
                  Habitación
                </span>
                <p className="text-ink group-hover/room:text-primary text-sm font-bold transition-colors">
                  {roomNumber ? roomNumber : '—'}
                </p>
              </div>
            </button>

            {/* Badge de Estado */}
            <RecepcionEstadoBadge status={stay.status} size="sm" />
          </div>

          {/* Sección: person_ids (Huéspedes asignados) */}
          <div className="mt-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-ink-muted flex items-center gap-1.5 text-xs font-semibold">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary size-3.5"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Huéspedes
              </span>
              <span className="text-ink-muted/80 text-[11px] font-medium">
                {stay.person_ids.length}{' '}
                {stay.person_ids.length === 1 ? 'huésped' : 'huéspedes'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {stay.person_ids.length > 0 ? (
                stay.person_ids.map((personId, index) => {
                  const guestName =
                    guestNames[personId] || `Huésped ${index + 1}`;
                  const initials = formatGuestInitials(
                    guestNames[personId],
                    index + 1
                  );

                  return (
                    <button
                      key={personId}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectPersonId(personId);
                      }}
                      className="group/guest border-primary/25 bg-primary/10 text-primary hover:bg-primary hover:border-primary inline-flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[11px] font-bold tracking-wider shadow-2xs transition-all hover:scale-110 hover:text-white active:scale-95"
                      title={`Ver ficha completa de ${guestName}`}
                      aria-label={`Ver ficha de ${guestName}`}
                    >
                      {initials}
                    </button>
                  );
                })
              ) : (
                <span className="text-ink-muted text-xs italic">
                  Sin huéspedes asignados
                </span>
              )}
            </div>
          </div>

          {/* Sección: check_in_date & check_out_date */}
          <div className="border-line/70 bg-canvas/40 mt-4 space-y-2 rounded-xl border p-3">
            {/* Ingreso */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted flex items-center gap-1.5 font-medium">
                {/* Icono Check-in */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Fecha de ingreso:
              </span>
              <span
                className="text-ink font-semibold"
                title={stay.check_in_date}
              >
                {checkIn.full}
              </span>
            </div>

            {/* Salida */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted flex items-center gap-1.5 font-medium">
                {/* Icono Check-out */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Fecha de salida:
              </span>
              <span
                className="text-ink font-semibold"
                title={stay.check_out_date}
              >
                {checkOut.full}
              </span>
            </div>

            <div className="border-line/40 text-ink-muted flex items-center justify-between border-t pt-1.5 text-[11px]">
              <span>Estadía estimada:</span>
              <span className="text-primary font-semibold">
                {nights} {nights === 1 ? 'noche' : 'noches'}
              </span>
            </div>
          </div>

          {/* Sección: payment_method & security_deposit */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {/* Método de pago */}
            <div className="border-line bg-canvas/30 flex flex-col rounded-xl border p-2.5">
              <span className="text-ink-muted mb-1 flex items-center gap-1 text-[11px] font-medium">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary size-3"
                  aria-hidden="true"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                Método de pago
              </span>
              <span
                className="text-ink truncate text-xs font-bold"
                title={paymentInfo.label}
              >
                {paymentInfo.label}
              </span>
            </div>

            {/* Depósito de garantía */}
            <div className="border-primary/20 bg-primary/5 flex flex-col rounded-xl border p-2.5">
              <span className="text-primary mb-1 flex items-center gap-1 text-[11px] font-medium">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary size-3"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Depósito garantía
              </span>
              <span className="text-primary truncate text-xs font-bold">
                {depositFormatted}
              </span>
            </div>
          </div>
        </div>
      </motion.article>

      {/* Modal interactivo para visualizar la información del huésped */}
      <HuespedDetalleModal
        personId={inspectPersonId}
        onClose={() => setInspectPersonId(null)}
      />

      {/* Modal interactivo para visualizar el detalle de la habitación (GET /room/{id}) */}
      <RoomDetailModal
        roomId={inspectRoomId}
        onClose={() => setInspectRoomId(null)}
      />
    </>
  );
}
