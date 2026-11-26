import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faConciergeBell,
  faCreditCard,
  faUtensils,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrencyAmount } from '../../domain/salida-huesped'

export interface CuentaResumenFooterProps {
  serviceRequestsTotal: number
  reservesTotal: number
  receptionsTotal: number
  grandTotal: number
  showPayNotice: boolean
  isPaying?: boolean
  onClose: () => void
  onPay: () => void
}

export const CuentaResumenFooter = memo(function CuentaResumenFooter({
  serviceRequestsTotal,
  reservesTotal,
  receptionsTotal,
  grandTotal,
  showPayNotice,
  isPaying = false,
  onClose,
  onPay,
}: CuentaResumenFooterProps) {
  return (
    <div className="space-y-4">
      <div className="border-line bg-panel space-y-2 rounded-2xl border p-4">
        <div className="text-ink-muted flex items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faUtensils}
              className="text-secondary size-3"
              aria-hidden="true"
            />
            <span>Servicio de habitaciones</span>
          </span>
          <span className="text-ink font-mono font-semibold">
            {formatCurrencyAmount(serviceRequestsTotal)}
          </span>
        </div>

        <div className="text-ink-muted flex items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faBed}
              className="text-primary size-3"
              aria-hidden="true"
            />
            <span>Reservas</span>
          </span>
          <span className="text-ink font-mono font-semibold">
            {formatCurrencyAmount(reservesTotal)}
          </span>
        </div>

        <div className="text-ink-muted flex items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faConciergeBell}
              className="text-primary size-3"
              aria-hidden="true"
            />
            <span>Recepciones</span>
          </span>
          <span className="text-ink font-mono font-semibold">
            {formatCurrencyAmount(receptionsTotal)}
          </span>
        </div>

        <div className="border-line flex items-center justify-between border-t pt-2.5">
          <span className="text-ink text-sm font-bold">Total a pagar</span>
          <span className="text-primary font-mono text-lg font-extrabold">
            {formatCurrencyAmount(grandTotal)}
          </span>
        </div>
      </div>

      {showPayNotice && (
        <p
          role="status"
          className="border-primary/25 bg-primary/10 text-primary rounded-xl border px-3 py-2 text-xs font-medium"
        >
          El módulo de procesamiento de pago se habilitará próximamente.
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={isPaying}
          className="border-line bg-panel text-ink hover:bg-canvas inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="size-3.5"
            aria-hidden="true"
          />
          <span>Cerrar</span>
        </button>

        <button
          type="button"
          onClick={onPay}
          disabled={isPaying}
          className="bg-primary inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FontAwesomeIcon
            icon={faCreditCard}
            className="size-3.5"
            aria-hidden="true"
          />
          <span>{isPaying ? 'Procesando…' : 'Pagar'}</span>
        </button>
      </div>
    </div>
  )
})
