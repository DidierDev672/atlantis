import { Suspense, lazy, memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuildingColumns,
  faCreditCard,
  faMoneyBillWave,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { fadeUp } from '../../../../design-tokens/motion';
import {
  formatDrawerShortDate,
  resolveDepositStatusConfig,
} from '../../domain/recepcion-stay-drawer';
import {
  calculateStayNights,
  formatPaymentMethod,
  formatSecurityDeposit,
  type StayItem,
} from '../../domain/stay';

const LazyGuestsAccordion = lazy(
  () => import('./recepcion-card-guests-accordion')
);

export interface RecepcionStayDetailDrawerContentProps {
  stay: StayItem;
  guestNames: Record<string, string>;
  feedbackMessage?: string | null;
}

/**
 * Molécula: Cuerpo limpio del drawer de recepción (Huésped, Estadía y Pago)
 * con animación fadeUp siguiendo las convenciones del proyecto.
 */
export const RecepcionStayDetailDrawerContent = memo(
  function RecepcionStayDetailDrawerContent({
    stay,
    guestNames,
    feedbackMessage,
  }: RecepcionStayDetailDrawerContentProps) {
    const {
      primaryGuestId,
      primaryGuestName,
      paymentInfo,
      checkIn,
      checkOut,
      depositFormatted,
      depositBadge,
      nights,
    } = useMemo(() => {
      try {
        const firstId = stay.person_ids[0];
        const firstGuest =
          (firstId ? guestNames[firstId] : undefined) || 'Huésped titular';

        return {
          primaryGuestId: firstId,
          primaryGuestName: firstGuest,
          paymentInfo: formatPaymentMethod(stay.payment_method),
          checkIn: formatDrawerShortDate(stay.check_in_date),
          checkOut: formatDrawerShortDate(stay.check_out_date),
          depositFormatted: formatSecurityDeposit(stay.security_deposit),
          depositBadge: resolveDepositStatusConfig(
            stay.status,
            stay.security_deposit
          ),
          nights: calculateStayNights(stay.check_in_date, stay.check_out_date),
        };
      } catch (err) {
        console.error('Error al preparar contenido del drawer:', err);
        return {
          primaryGuestId: undefined,
          primaryGuestName: 'Huésped titular',
          paymentInfo: { label: 'Efectivo', type: 'cash' as const },
          checkIn: { weekdayDate: '—', time: '' },
          checkOut: { weekdayDate: '—', time: '' },
          depositFormatted: '$ 0',
          depositBadge: null,
          nights: 1,
        };
      }
    }, [
      guestNames,
      stay.check_in_date,
      stay.check_out_date,
      stay.payment_method,
      stay.person_ids,
      stay.security_deposit,
      stay.status,
    ]);

    const paymentIcon =
      paymentInfo.type === 'card'
        ? faCreditCard
        : paymentInfo.type === 'transfer'
          ? faBuildingColumns
          : faMoneyBillWave;

    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="divide-line/70 divide-y text-xs"
      >
        {/* 1. Huéspedes vinculados en acordeón */}
        <section aria-label="Huéspedes vinculados" className="py-4">
          <Suspense
            fallback={
              <div className="bg-line/35 h-11 w-full animate-pulse rounded-xl" />
            }
          >
            <LazyGuestsAccordion
              primaryGuest={
                primaryGuestId
                  ? { id: primaryGuestId, name: primaryGuestName }
                  : undefined
              }
              guestLabel={primaryGuestName}
              personIds={stay.person_ids}
            />
          </Suspense>
        </section>

        {/* 2. Estadía: Entrada · Noches · Salida */}
        <section aria-label="Fechas de estadía" className="space-y-3 py-4">
          <h4 className="text-ink-muted text-xs font-medium">Estadía</h4>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="min-w-0 space-y-0.5">
              <span className="text-ink-muted block text-[11px]">Entrada</span>
              <p className="text-ink truncate text-sm font-bold">
                {checkIn.weekdayDate}
              </p>
              {checkIn.time && (
                <p className="text-ink-muted text-[11px]">{checkIn.time}</p>
              )}
            </div>

            <span className="border-line/60 bg-canvas text-ink-muted rounded-full border px-3 py-1 text-[11px] font-medium whitespace-nowrap">
              {nights} {nights === 1 ? 'noche' : 'noches'}
            </span>

            <div className="min-w-0 space-y-0.5 text-right">
              <span className="text-ink-muted block text-[11px]">Salida</span>
              <p className="text-ink truncate text-sm font-bold">
                {checkOut.weekdayDate}
              </p>
              {checkOut.time && (
                <p className="text-ink-muted text-[11px]">{checkOut.time}</p>
              )}
            </div>
          </div>
        </section>

        {/* 3. Pago: Método y Depósito de garantía */}
        <section aria-label="Información de pago" className="space-y-3 py-4">
          <h4 className="text-ink-muted text-xs font-medium">Pago</h4>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-muted inline-flex items-center gap-2 text-xs">
                <FontAwesomeIcon
                  icon={paymentIcon}
                  className="size-3.5"
                  aria-hidden="true"
                />
                <span>Método</span>
              </span>
              <span className="text-ink text-xs font-semibold">
                {paymentInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-muted inline-flex items-center gap-2 text-xs">
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  className="size-3.5"
                  aria-hidden="true"
                />
                <span>Depósito de garantía</span>
              </span>

              <div className="flex items-center gap-2">
                <span className="text-ink text-xs font-semibold">
                  {depositFormatted}
                </span>
                {depositBadge && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${depositBadge.classes}`}
                  >
                    {depositBadge.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {stay.remarks && (
            <p className="border-line/70 bg-canvas/50 text-ink-muted mt-2 rounded-xl border px-3 py-2 text-[11px] leading-relaxed italic">
              {stay.remarks}
            </p>
          )}
        </section>

        {feedbackMessage && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            role="status"
            className="border-primary/25 bg-primary/10 text-primary mt-2 rounded-xl border px-3 py-2.5 text-xs font-medium"
          >
            {feedbackMessage}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

export default RecepcionStayDetailDrawerContent;
