import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faCalendarCheck,
  faCommentDots,
  faFileInvoiceDollar,
  faMoon,
  faPrint,
  faReceipt,
  faUser,
  faUserTie,
  faWallet,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Drawer } from '../../../../shared/ui/Drawer'
import type { CheckoutInvoiceItem } from '../../domain/factura-checkout'
import { FacturaConditionBadge } from '../atoms/factura-condition-badge'

export interface FacturaDetalleDrawerProps {
  invoice: CheckoutInvoiceItem | null
  isOpen: boolean
  onClose: () => void
  onPrint?: (invoice: CheckoutInvoiceItem) => void
}

export const FacturaDetalleDrawer = memo(function FacturaDetalleDrawer({
  invoice,
  isOpen,
  onClose,
  onPrint,
}: FacturaDetalleDrawerProps) {
  if (!invoice) return null

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      size="lg"
      icon={faFileInvoiceDollar}
      title={`Constancia ${invoice.receiptCode}`}
      description={invoice.createdAtFormatted}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-ink-muted text-[11px]">Total pagado</p>
            <p className="text-primary font-mono text-lg font-extrabold tabular-nums">
              {invoice.amountFormatted}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border-line bg-panel text-ink hover:bg-canvas inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition"
            >
              <FontAwesomeIcon
                icon={faXmark}
                className="size-3.5"
                aria-hidden="true"
              />
              <span>Cerrar</span>
            </button>

            {onPrint && (
              <button
                type="button"
                onClick={() => onPrint(invoice)}
                aria-label="Imprimir factura"
                title="Imprimir factura"
                className="bg-primary inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-white shadow-xs transition hover:opacity-90"
              >
                <FontAwesomeIcon
                  icon={faPrint}
                  className="size-4"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="border-line/70 bg-canvas/50 space-y-3 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-ink text-xs font-bold">
              Estado de entrega de habitación
            </span>
            <FacturaConditionBadge
              label={invoice.conditionLabel}
              tone={invoice.conditionTone}
            />
          </div>

          <div className="border-line/50 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
                <FontAwesomeIcon
                  icon={faBed}
                  className="size-3.5"
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0">
                <p className="text-ink-muted text-[11px]">Habitación</p>
                <p className="text-ink truncate text-xs font-bold">
                  {invoice.roomLabel}
                  {invoice.roomFloor ? ` · ${invoice.roomFloor}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="bg-secondary/15 text-secondary grid size-8 shrink-0 place-items-center rounded-lg">
                <FontAwesomeIcon
                  icon={faWallet}
                  className="size-3.5"
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0">
                <p className="text-ink-muted text-[11px]">Método de pago</p>
                <p className="text-ink truncate text-xs font-bold">
                  {invoice.paymentLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="border-line/50 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
            <span className="text-ink-muted inline-flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="text-primary size-3.5"
                aria-hidden="true"
              />
              <span>
                {invoice.checkInFormatted} → {invoice.checkOutFormatted}
              </span>
            </span>
            <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold">
              <FontAwesomeIcon
                icon={faMoon}
                className="size-2.5"
                aria-hidden="true"
              />
              <span>{invoice.nightsLabel}</span>
            </span>
          </div>
        </div>

        <section
          aria-label="Huéspedes asociados"
          className="border-line/70 bg-canvas/50 space-y-2 rounded-2xl border p-4"
        >
          <p className="text-ink flex items-center gap-2 text-xs font-bold">
            <FontAwesomeIcon
              icon={faUser}
              className="text-primary size-3.5"
              aria-hidden="true"
            />
            <span>Huéspedes ({invoice.guestNames.length})</span>
          </p>
          <ul className="space-y-1.5">
            {invoice.guestNames.map((guestName, index) => (
              <li
                key={`${invoice.id}-guest-${index}`}
                className="border-line/60 bg-panel rounded-xl border px-3 py-2 text-xs font-semibold text-ink"
              >
                {guestName}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Observaciones de salida"
          className="border-line/70 bg-canvas/50 space-y-2 rounded-2xl border p-4"
        >
          <p className="text-ink flex items-center gap-2 text-xs font-bold">
            <FontAwesomeIcon
              icon={faCommentDots}
              className="text-secondary size-3.5"
              aria-hidden="true"
            />
            <span>Observaciones</span>
          </p>
          <p className="text-ink-muted text-xs leading-relaxed">
            {invoice.comments}
          </p>
        </section>

        <section
          aria-label="Trazabilidad de emisión"
          className="border-line/70 bg-canvas/50 space-y-2 rounded-2xl border p-4 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-muted inline-flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faUserTie}
                className="text-primary size-3"
                aria-hidden="true"
              />
              <span>Emitida por</span>
            </span>
            <span className="text-ink font-semibold">{invoice.createdBy}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-muted inline-flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="text-primary size-3"
                aria-hidden="true"
              />
              <span>Fecha de emisión</span>
            </span>
            <span className="text-ink font-semibold">
              {invoice.createdAtFormatted}
            </span>
          </div>

          {invoice.serviceRequestId && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-muted inline-flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faReceipt}
                  className="text-secondary size-3"
                  aria-hidden="true"
                />
                <span>Servicio a la habitación</span>
              </span>
              <span className="text-ink font-semibold">Incluido en cuenta</span>
            </div>
          )}
        </section>
      </div>
    </Drawer>
  )
})
