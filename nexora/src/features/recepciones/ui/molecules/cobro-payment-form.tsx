import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuildingColumns,
  faCashRegister,
  faCheck,
  faCreditCard,
  faDollarSign,
  faMobileScreenButton,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Input } from '../../../../shared/ui/Input'
import {
  COBRO_PAYMENT_METHOD_OPTIONS,
  sanitizeDigitsOnly,
  type CobroPaymentMethod,
} from '../../domain/salida-cobro'
import { formatCurrencyAmount } from '../../domain/salida-huesped'

const METHOD_ICONS: Record<CobroPaymentMethod, IconDefinition> = {
  tarjeta: faCreditCard,
  efectivo: faMoneyBillWave,
  transferencia: faBuildingColumns,
  nequi: faMobileScreenButton,
}

const ALLOWED_CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
])

export interface CobroPaymentFormProps {
  selectedMethod: CobroPaymentMethod
  amountValue: string
  totalToPay: number
  submitting: boolean
  amountError?: string | null
  onSelectMethod: (method: CobroPaymentMethod) => void
  onAmountChange: (digitsOnly: string) => void
  onUseFullAmount: () => void
}

/**
 * Molécula: Sección "Registrar pago" con grid de métodos (Tarjeta, Efectivo, Transferencia, Nequi)
 * y campo reutilizable `Input` restringido estrictamente a números.
 */
export const CobroPaymentForm = memo(function CobroPaymentForm({
  selectedMethod,
  amountValue,
  totalToPay,
  submitting,
  amountError,
  onSelectMethod,
  onAmountChange,
  onUseFullAmount,
}: CobroPaymentFormProps) {
  const numericAmount = Number(amountValue || '0')
  const changeOrBalance = numericAmount - totalToPay

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (ALLOWED_CONTROL_KEYS.has(e.key)) return
      if (!/^\d$/.test(e.key)) {
        e.preventDefault()
      }
    },
    []
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        onAmountChange(sanitizeDigitsOnly(e.target.value))
      } catch (err) {
        console.warn('Error al sanitizar monto de cobro:', err)
      }
    },
    [onAmountChange]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      try {
        const pasted = e.clipboardData.getData('text')
        const sanitized = sanitizeDigitsOnly(pasted)
        if (sanitized !== pasted) {
          e.preventDefault()
          onAmountChange(sanitizeDigitsOnly(`${amountValue}${sanitized}`))
        }
      } catch (err) {
        console.warn('Error al pegar monto:', err)
      }
    },
    [amountValue, onAmountChange]
  )

  return (
    <section
      aria-label="Registrar pago"
      className="border-line bg-canvas/60 space-y-4 rounded-2xl border p-4"
    >
      <div className="border-line/70 flex items-center gap-2 border-b pb-2.5">
        <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
          <FontAwesomeIcon
            icon={faCashRegister}
            className="size-3.5"
            aria-hidden="true"
          />
        </span>
        <h3 className="text-ink text-xs font-bold tracking-wider uppercase">
          Registrar pago
        </h3>
      </div>

      {/* Grid de cards: Tarjeta, Efectivo, Transferencia, Nequi */}
      <div
        role="group"
        aria-label="Método de pago"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
      >
        {COBRO_PAYMENT_METHOD_OPTIONS.map((option) => {
          const isSelected = selectedMethod === option.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={submitting}
              aria-pressed={isSelected}
              onClick={() => onSelectMethod(option.id)}
              className={`focus-visible:ring-primary/40 relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30'
                  : 'border-line bg-panel text-ink-muted hover:border-primary/40 hover:text-ink'
              }`}
            >
              {isSelected && (
                <span className="bg-primary text-white absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="size-2.5"
                    aria-hidden="true"
                  />
                </span>
              )}
              <FontAwesomeIcon
                icon={METHOD_ICONS[option.id]}
                className="size-4"
                aria-hidden="true"
              />
              <span className="text-xs font-bold">{option.label}</span>
            </button>
          )
        })}
      </div>

      {/* Input reutilizable solo números */}
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        label="Monto a pagar (COP)"
        placeholder="Ej. 250000"
        value={amountValue}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        onPaste={handlePaste}
        error={amountError ?? undefined}
        required
        isDisabled={submitting}
        icon={
          <FontAwesomeIcon
            icon={faDollarSign}
            className="text-primary size-3.5"
            aria-hidden="true"
          />
        }
        action={
          totalToPay > 0 ? (
            <button
              type="button"
              onClick={onUseFullAmount}
              disabled={submitting}
              className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold transition"
            >
              Total
            </button>
          ) : undefined
        }
        hint={
          amountValue
            ? changeOrBalance >= 0
              ? `Monto: ${formatCurrencyAmount(numericAmount)}${
                  changeOrBalance > 0
                    ? ` · Cambio: ${formatCurrencyAmount(changeOrBalance)}`
                    : ''
                }`
              : `Monto parcial: ${formatCurrencyAmount(numericAmount)} · Saldo pendiente: ${formatCurrencyAmount(Math.abs(changeOrBalance))}`
            : 'Ingresa únicamente dígitos numéricos.'
        }
      />
    </section>
  )
})

export default CobroPaymentForm
