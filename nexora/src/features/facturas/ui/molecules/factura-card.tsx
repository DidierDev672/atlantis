import { memo } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarCheck,
  faMoon,
  faPrint,
  faUser,
  faWallet,
} from '@fortawesome/free-solid-svg-icons'
import { fadeIn } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { CheckoutInvoiceItem } from '../../domain/factura-checkout'
import { FacturaConditionBadge } from '../atoms/factura-condition-badge'

export interface FacturaCardProps {
  invoice: CheckoutInvoiceItem
  onSelect: (invoice: CheckoutInvoiceItem) => void
  onPrint: (invoice: CheckoutInvoiceItem) => void
}

export const FacturaCard = memo(function FacturaCard({
  invoice,
  onSelect,
  onPrint,
}: FacturaCardProps) {
  const {
    policy: { enableAnimations },
  } = useDeviceResourceProfile()

  return (
    <motion.article
      variants={enableAnimations ? fadeIn : undefined}
      initial={enableAnimations ? 'hidden' : false}
      animate="visible"
      onClick={() => onSelect(invoice)}
      className="border-line bg-panel hover:border-primary/35 flex cursor-pointer flex-col gap-4 rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md md:flex-row md:items-center md:justify-between md:gap-6 md:p-5"
    >
      {/* Bloque izquierdo + central */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        {/* 1. Primera sección: Solo número de habitación y piso debajo */}
        <div className="border-primary/20 bg-primary/8 flex shrink-0 flex-col items-center justify-center rounded-2xl border px-4 py-3 text-center sm:w-24 sm:py-4">
          <p className="text-primary font-mono text-2xl leading-none font-extrabold tabular-nums">
            {invoice.roomNumberDisplay}
          </p>
          {invoice.roomFloor && (
            <p className="text-ink-muted mt-1.5 text-[11px] font-semibold">
              {invoice.roomFloor}
            </p>
          )}
        </div>

        {/* 2. Al lado derecho: Nombre del huésped, Fechas + Noches (badge), Badge Llaves/Daño */}
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Nombre del huésped */}
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faUser}
              className="text-primary size-3.5 shrink-0"
              aria-hidden="true"
            />
            <h3 className="text-ink truncate text-sm font-bold sm:text-base">
              {invoice.guestNames.join(', ')}
            </h3>
          </div>

          {/* Debajo del nombre: Fecha de entrada y salida + número de noches en badge */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink-muted inline-flex flex-wrap items-center gap-1.5">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="text-secondary size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                Entrada:{' '}
                <strong className="text-ink font-semibold">
                  {invoice.checkInFormatted}
                </strong>
              </span>
              <span aria-hidden="true" className="text-ink-soft">
                →
              </span>
              <span>
                Salida:{' '}
                <strong className="text-ink font-semibold">
                  {invoice.checkOutFormatted}
                </strong>
              </span>
            </span>

            <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tabular-nums">
              <FontAwesomeIcon
                icon={faMoon}
                className="size-2.5"
                aria-hidden="true"
              />
              <span>{invoice.nightsLabel}</span>
            </span>
          </div>

          {/* Debajo de las fechas: Badge de entrega de llaves o daño */}
          <div>
            <FacturaConditionBadge
              label={invoice.conditionLabel}
              tone={invoice.conditionTone}
            />
          </div>
        </div>
      </div>

      {/* 3. A la derecha del todo: Valor total, Método de pago y Botón imprimir */}
      <div className="border-line/60 flex shrink-0 flex-col items-stretch justify-center gap-2 border-t pt-3 md:min-w-[205px] md:items-end md:border-t-0 md:border-l md:pt-0 md:pl-6 md:text-right">
        <div>
          <p className="text-ink-muted text-[11px] font-medium">
            Valor total
          </p>
          <p className="text-primary font-mono text-xl font-extrabold tabular-nums">
            {invoice.amountFormatted}
          </p>
        </div>

        <div className="text-ink inline-flex items-center gap-1.5 text-xs font-semibold md:justify-end">
          <FontAwesomeIcon
            icon={faWallet}
            className="text-secondary size-3.5"
            aria-hidden="true"
          />
          <span>{invoice.paymentLabel}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrint(invoice)
          }}
          aria-label="Imprimir factura"
          title="Imprimir factura"
          className="bg-primary inline-flex size-10 cursor-pointer items-center justify-center self-start rounded-xl text-white shadow-xs transition hover:opacity-90 md:self-end"
        >
          <FontAwesomeIcon
            icon={faPrint}
            className="size-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </motion.article>
  )
})
