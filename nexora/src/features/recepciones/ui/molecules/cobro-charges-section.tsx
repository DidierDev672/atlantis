import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faFileInvoiceDollar,
  faShieldHalved,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrencyAmount } from '../../domain/salida-huesped'

export interface CobroChargesSectionProps {
  durationLabel: string
  accommodationAmount: number
  deliveredOrdersCount: number
  roomServiceAmount: number
  depositAppliedPhrase: string
  securityDeposit: number
  totalToPay: number
}

/**
 * Molécula: Secciones "Cargos" y "Pagos y Depósitos" del Drawer de cobro.
 * Muestra los valores monetarios a la izquierda junto al concepto detallado.
 */
export const CobroChargesSection = memo(function CobroChargesSection({
  durationLabel,
  accommodationAmount,
  deliveredOrdersCount,
  roomServiceAmount,
  depositAppliedPhrase,
  securityDeposit,
  totalToPay,
}: CobroChargesSectionProps) {
  const deliveredLabel =
    deliveredOrdersCount === 1
      ? '1 pedido entregado'
      : `${deliveredOrdersCount} pedidos entregados`

  return (
    <div className="space-y-4">
      {/* Sección: Cargos */}
      <section
        aria-label="Cargos de la estadía"
        className="border-line bg-canvas/60 space-y-3 rounded-2xl border p-4"
      >
        <div className="border-line/70 flex items-center gap-2 border-b pb-2.5">
          <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
            <FontAwesomeIcon
              icon={faFileInvoiceDollar}
              className="size-3.5"
              aria-hidden="true"
            />
          </span>
          <h3 className="text-ink text-xs font-bold tracking-wider uppercase">
            Cargos
          </h3>
        </div>

        <div className="space-y-2.5">
          {/* Fila Alojamiento: concepto a la izquierda, valor de recepción a la derecha */}
          <div className="border-line/50 bg-panel flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <FontAwesomeIcon
                icon={faBed}
                className="text-primary size-3.5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-ink truncate text-xs font-semibold">
                  Alojamiento
                </p>
                <p className="text-ink-muted truncate text-[11px]">
                  {durationLabel}
                </p>
              </div>
            </div>
            <span className="text-ink shrink-0 font-mono text-sm font-extrabold tabular-nums">
              {formatCurrencyAmount(accommodationAmount)}
            </span>
          </div>

          {/* Fila Servicio de habitaciones: concepto a la izquierda, valor consumido a la derecha */}
          <div className="border-line/50 bg-panel flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <FontAwesomeIcon
                icon={faUtensils}
                className="text-secondary size-3.5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-ink truncate text-xs font-semibold">
                  Servicio de habitaciones · {deliveredLabel}
                </p>
                <p className="text-ink-muted truncate text-[11px]">
                  Consumo en habitación
                </p>
              </div>
            </div>
            <span className="text-ink shrink-0 font-mono text-sm font-extrabold tabular-nums">
              {formatCurrencyAmount(roomServiceAmount)}
            </span>
          </div>
        </div>
      </section>

      {/* Sección: Pagos y Depósitos */}
      <section
        aria-label="Pagos y depósitos"
        className="border-line bg-canvas/60 space-y-3 rounded-2xl border p-4"
      >
        <div className="border-line/70 flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
          <div className="flex items-center gap-2">
            <span className="bg-secondary/15 text-secondary grid size-7 shrink-0 place-items-center rounded-lg">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="size-3.5"
                aria-hidden="true"
              />
            </span>
            <h3 className="text-ink text-xs font-bold tracking-wider uppercase">
              Pagos y Depósitos
            </h3>
          </div>

          <span className="border-primary/25 bg-primary/10 text-primary rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
            {depositAppliedPhrase}
          </span>
        </div>

        {/* Debajo de la frase: Depósito de garantía en check-in a la izquierda, valor total a la derecha */}
        <div className="border-primary/25 bg-primary/5 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3.5">
          <div className="min-w-0">
            <p className="text-ink text-xs font-bold">
              Depósito de garantía en check-in
            </p>
            <p className="text-ink-muted text-[11px]">
              {roomServiceAmount > 0
                ? 'Recepción + servicio de habitaciones'
                : 'Total recepción'}
              {securityDeposit > 0
                ? ` · Garantía: ${formatCurrencyAmount(securityDeposit)}`
                : ''}
            </p>
          </div>
          <span className="shrink-0 font-mono text-lg font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
            {formatCurrencyAmount(totalToPay)}
          </span>
        </div>
      </section>
    </div>
  )
})

export default CobroChargesSection
