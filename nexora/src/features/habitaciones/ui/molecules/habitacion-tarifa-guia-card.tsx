import { memo } from 'react'
import { motion } from 'motion/react'
import {
  formatCurrencyCOP,
  type TarifaOption,
} from '../../application/use-habitacion-detalle-form'

export interface HabitacionTarifaGuiaCardProps {
  selectedTarifa: TarifaOption
  numericPrecio: number
  hasValidNumericPrecio: boolean
  isOverTariff: boolean
  onApplyBasePrice: () => void
}

const HabitacionTarifaGuiaCard = memo(function HabitacionTarifaGuiaCard({
  selectedTarifa,
  numericPrecio,
  hasValidNumericPrecio,
  isOverTariff,
  onApplyBasePrice,
}: HabitacionTarifaGuiaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`space-y-2 rounded-2xl border p-3.5 text-xs shadow-2xs transition-colors ${
        isOverTariff
          ? 'border-danger/40 bg-danger/10 text-danger'
          : hasValidNumericPrecio
            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
            : 'border-primary/25 bg-primary/5 text-ink'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold">
          <span aria-hidden="true">🏷️</span>
          <span>Referencia de tarifa: «{selectedTarifa.label}»</span>
        </div>

        {selectedTarifa.price > 0 && (
          <button
            type="button"
            onClick={onApplyBasePrice}
            className="border-primary/30 bg-panel text-primary hover:bg-primary/10 focus-visible:ring-primary/40 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold shadow-2xs transition focus-visible:ring-2 focus-visible:outline-none"
            title="Aplicar el precio base de la tarifa al campo Precio"
          >
            <span>Usar precio base</span>
            <span className="font-extrabold">
              ({formatCurrencyCOP(selectedTarifa.price)})
            </span>
          </button>
        )}
      </div>

      {isOverTariff ? (
        <p className="text-danger text-[11px] font-semibold">
          ⚠️ El precio ingresado ({formatCurrencyCOP(numericPrecio)}) supera el
          tope de esta tarifa ({formatCurrencyCOP(selectedTarifa.price)}).
        </p>
      ) : hasValidNumericPrecio ? (
        <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          ✓ Precio válido dentro del límite permitido (
          {formatCurrencyCOP(numericPrecio)} / máx.{' '}
          {formatCurrencyCOP(selectedTarifa.price)}).
        </p>
      ) : (
        <p className="text-ink-muted text-[11px]">
          💡 Si dejas el precio vacío, la habitación usará el valor base de{' '}
          <strong>{formatCurrencyCOP(selectedTarifa.price)}</strong>.
        </p>
      )}
    </motion.div>
  )
})

export default HabitacionTarifaGuiaCard
