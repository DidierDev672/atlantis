import { Suspense, lazy, memo, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import {
  formatCurrencyCOP,
  type TarifaOption,
} from '../../application/use-habitacion-detalle-form'

const LazyHabitacionTarifaGuiaCard = lazy(
  () => import('./habitacion-tarifa-guia-card')
)

export interface HabitacionTarifaFieldProps {
  rates: ReadonlyArray<TarifaOption>
  ratesLoading: boolean
  ratesError?: boolean
  selectedTarifaId: string
  selectedTarifa: TarifaOption | null
  numericPrecio: number
  hasValidNumericPrecio: boolean
  isOverTariff: boolean
  onTarifaChange: (tarifaId: string) => void
  onApplyBasePrice: () => void
}

export const HabitacionTarifaField = memo(function HabitacionTarifaField({
  rates,
  ratesLoading,
  ratesError = false,
  selectedTarifaId,
  selectedTarifa,
  numericPrecio,
  hasValidNumericPrecio,
  isOverTariff,
  onTarifaChange,
  onApplyBasePrice,
}: HabitacionTarifaFieldProps) {
  const tarifaOptions = useMemo<DropdownOption[]>(
    () =>
      rates.map((opt) => ({
        value: opt.value,
        label:
          opt.price > 0
            ? `${opt.label} (${formatCurrencyCOP(opt.price)})`
            : opt.label,
      })),
    [rates]
  )

  const placeholder = ratesLoading
    ? 'Cargando tarifas…'
    : ratesError
      ? 'Tarifas no disponibles'
      : 'Elige una tarifa (opcional)…'

  return (
    <div className="space-y-2.5">
      <div className="relative">
        {selectedTarifaId ? (
          <button
            type="button"
            onClick={() => onTarifaChange('')}
            className="text-ink-muted hover:text-ink absolute top-0 right-0 z-10 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors"
          >
            <FontAwesomeIcon
              icon={faXmark}
              className="size-3"
              aria-hidden="true"
            />
            <span>Quitar tarifa</span>
          </button>
        ) : null}

        <RecursosDropdown
          id="habitacion-tarifa-dropdown"
          label="Tarifas"
          options={tarifaOptions}
          value={selectedTarifaId}
          onChange={onTarifaChange}
          placeholder={placeholder}
          searchPlaceholder="Buscar tarifa por nombre o valor…"
          searchable
          disabled={ratesLoading}
          isLoading={ratesLoading}
          error={ratesError ? 'No pudimos cargar las tarifas.' : undefined}
          direction="auto"
          emptyLabel="Todavía no hay tarifas registradas."
        />
      </div>

      {selectedTarifa ? (
        <Suspense
          fallback={
            <div className="border-line/70 bg-canvas/50 text-ink-muted rounded-xl border px-3 py-2 text-xs">
              Cargando referencia de tarifa…
            </div>
          }
        >
          <LazyHabitacionTarifaGuiaCard
            selectedTarifa={selectedTarifa}
            numericPrecio={numericPrecio}
            hasValidNumericPrecio={hasValidNumericPrecio}
            isOverTariff={isOverTariff}
            onApplyBasePrice={onApplyBasePrice}
          />
        </Suspense>
      ) : (
        <p className="text-ink-muted text-[11px] leading-relaxed">
          Opcional · Si eliges una tarifa ahora, quedará vinculada
          automáticamente al registrar la habitación.
        </p>
      )}
    </div>
  )
})
