import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuildingColumns,
  faCheck,
  faCreditCard,
  faMobileScreenButton,
  faMoneyBillWave,
  faWallet,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  COBRO_PAYMENT_METHOD_OPTIONS,
  type CobroPaymentMethod,
} from '../../domain/salida-cobro'
import { formatCurrencyAmount } from '../../domain/salida-huesped'

const PAYMENT_METHOD_ICONS: Record<CobroPaymentMethod, IconDefinition> = {
  tarjeta: faCreditCard,
  efectivo: faMoneyBillWave,
  transferencia: faBuildingColumns,
  nequi: faMobileScreenButton,
}

export interface CuentaPagoDepositosSectionProps {
  selectedMethod: CobroPaymentMethod
  totalAmount: number
  onSelectMethod: (method: CobroPaymentMethod) => void
}

/**
 * Molécula: Sección "Pago y Depósitos" con grid de métodos de pago
 * mostrando únicamente icono y título por cada card.
 */
export const CuentaPagoDepositosSection = memo(
  function CuentaPagoDepositosSection({
    selectedMethod,
    totalAmount,
    onSelectMethod,
  }: CuentaPagoDepositosSectionProps) {
    return (
      <section aria-label="Pago y Depósitos" className="space-y-3 pt-1">
        <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
              <FontAwesomeIcon
                icon={faWallet}
                className="size-3.5"
                aria-hidden="true"
              />
            </span>
            <h3 className="text-ink text-sm font-bold sm:text-base">
              Pago y Depósitos
            </h3>
          </div>

          <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-1 text-[11px] font-semibold tabular-nums">
            Depósito: {formatCurrencyAmount(totalAmount)}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Seleccionar método de pago"
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {COBRO_PAYMENT_METHOD_OPTIONS.map((option) => {
            const isSelected = selectedMethod === option.id
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectMethod(option.id)}
                className={`focus-visible:ring-primary/50 relative flex min-h-[78px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center transition-all focus-visible:ring-2 focus-visible:outline-none ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-primary/25 shadow-xs ring-1'
                    : 'border-line/80 bg-canvas/50 text-ink-muted hover:border-primary/40 hover:bg-canvas hover:text-ink'
                }`}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="bg-primary absolute top-2 right-2 grid size-4 place-items-center rounded-full text-white"
                  >
                    <FontAwesomeIcon icon={faCheck} className="size-2.5" />
                  </span>
                )}

                <FontAwesomeIcon
                  icon={PAYMENT_METHOD_ICONS[option.id]}
                  className="size-5"
                  aria-hidden="true"
                />
                <span className="text-xs font-bold tracking-tight">
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    )
  }
)
