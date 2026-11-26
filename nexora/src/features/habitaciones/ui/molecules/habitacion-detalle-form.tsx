import { memo } from 'react'
import { Input } from '../../../../shared/ui/Input'
import { RecursosDropdown } from '../../../recursos/ui/molecules/recursos-dropdown'
import {
  HABITACION_ESTADO_OPTIONS,
  useHabitacionDetalleForm,
  type EdificioOption,
  type Option,
  type TarifaOption,
} from '../../application/use-habitacion-detalle-form'
import type { HabitacionDetalleInput } from '../../domain/habitacion-detalle'
import type { HabitacionDetalleRepository } from '../../domain/habitacion-detalle-repository'
import { SubmitError } from '../atoms/habitacion-form-feedback'
import { HabitacionEdificioField } from './habitacion-edificio-field'
import { HabitacionFormActions } from './habitacion-form-actions'
import { HabitacionNumeroField } from './habitacion-numero-field'
import { HabitacionTarifaField } from './habitacion-tarifa-field'

export type { EdificioOption, Option, TarifaOption }

export interface HabitacionDetalleFormProps {
  roomTypes: ReadonlyArray<Option>
  roomTypesLoading: boolean
  edificios: ReadonlyArray<EdificioOption>
  edificiosLoading: boolean
  rates?: ReadonlyArray<TarifaOption>
  ratesLoading?: boolean
  ratesError?: boolean
  selectedTarifaId?: string
  onTarifaChange?: (tarifaId: string) => void
  selectedTarifa?: TarifaOption | null
  submitting: boolean
  submitError: string | null
  submitErrorStatus?: number | null
  onSubmit: (values: HabitacionDetalleInput) => void
  onCreateTipo?: () => void
  onCreateEdificio?: () => void
  onClear?: () => void
  repository?: HabitacionDetalleRepository
}

export const HabitacionDetalleForm = memo(function HabitacionDetalleForm({
  roomTypes,
  roomTypesLoading,
  edificios,
  edificiosLoading,
  rates = [],
  ratesLoading = false,
  ratesError = false,
  selectedTarifaId = '',
  onTarifaChange,
  selectedTarifa = null,
  submitting,
  submitError,
  submitErrorStatus,
  onSubmit,
  onCreateTipo,
  onCreateEdificio,
  onClear,
  repository,
}: HabitacionDetalleFormProps) {
  const resolvedTarifa =
    selectedTarifa ??
    rates.find((rate) => rate.value === selectedTarifaId) ??
    null

  const form = useHabitacionDetalleForm({
    edificios,
    selectedTarifa: resolvedTarifa,
    onTarifaChange,
    onSubmit,
    onClear,
    repository,
  })

  return (
    <form onSubmit={form.handleSubmit} className="space-y-4" noValidate>
      {/* 1. Ubicación física: Edificio (izq.) + Piso (der.) */}
      <section
        aria-label="Ubicación de la habitación"
        className="border-line/65 bg-canvas/35 relative z-40 space-y-3 rounded-2xl border p-3.5 has-[[aria-expanded='true']]:z-50 sm:p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <HabitacionEdificioField
            edificios={form.mergedEdificios}
            edificiosLoading={edificiosLoading}
            loadingAutoEdificio={form.loadingAutoEdificio}
            edificioId={form.edificioId}
            isManualEdificio={form.isManualEdificio}
            submitting={submitting}
            error={form.errors.edificioId}
            autoEdificioValidation={form.autoEdificioValidation}
            onChange={form.handleEdificioChange}
            onToggleManual={form.handleToggleManualEdificio}
          />

          <div className="relative z-40 space-y-1 has-[[aria-expanded='true']]:z-50">
            <RecursosDropdown
              label="Piso"
              placeholder={
                !form.edificioId
                  ? 'Primero elige un edificio…'
                  : form.loadingFloors
                    ? 'Consultando pisos…'
                    : 'Elige un piso…'
              }
              searchPlaceholder="Buscar piso (ej. 1, 2)…"
              searchable
              options={form.pisoOptions}
              value={form.effectivePiso}
              onChange={form.handlePisoChange}
              error={form.errors.piso}
              disabled={!form.edificioId || form.loadingFloors}
              isLoading={form.loadingFloors}
              required
              direction="auto"
              emptyLabel={
                !form.edificioId
                  ? 'Primero elige un edificio para ver sus pisos.'
                  : form.loadingFloors
                    ? 'Consultando pisos del edificio…'
                    : 'Este edificio no tiene pisos registrados.'
              }
            />
            {form.selectedEdificio && form.totalPisos > 0 ? (
              <p className="text-ink-muted text-[11px]">
                {form.selectedEdificio.label}: {form.totalPisos}{' '}
                {form.totalPisos === 1
                  ? 'piso disponible'
                  : 'pisos disponibles'}
                .
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* 2. Identidad: Número de habitación (izq.) + Tipo de habitación (der.) */}
      <section
        aria-label="Identificación de la habitación"
        className="border-line/65 bg-canvas/35 relative z-30 space-y-3 rounded-2xl border p-3.5 has-[[aria-expanded='true']]:z-50 sm:p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <HabitacionNumeroField
            numero={form.numero}
            isManualNumber={form.isManualNumber}
            loadingNextNumber={form.loadingNextNumber}
            nextNumberError={form.nextNumberError}
            error={form.errors.numero}
            containerRef={form.numeroContainerRef}
            onChange={form.handleNumeroChange}
            onToggleManual={form.handleToggleManualNumber}
          />

          <div className="relative z-30 has-[[aria-expanded='true']]:z-50">
            <RecursosDropdown
              label="Tipo de habitación"
              placeholder={
                roomTypesLoading ? 'Cargando tipos…' : 'Elige un tipo…'
              }
              searchPlaceholder="Buscar tipo de habitación…"
              searchable
              options={roomTypes}
              value={form.tipoHabitacion}
              onChange={form.handleTipoHabitacionChange}
              error={form.errors.tipoHabitacion}
              required
              disabled={roomTypesLoading}
              isLoading={roomTypesLoading}
              direction="auto"
              emptyLabel="Aún no hay tipos de habitación registrados."
            />
          </div>
        </div>
      </section>

      {/* 3. Operación y valor: Estado inicial (izq.) + Precio por noche o día (der.) */}
      <section
        aria-label="Estado y precio"
        className="border-line/65 bg-canvas/35 relative z-20 space-y-3 rounded-2xl border p-3.5 has-[[aria-expanded='true']]:z-50 sm:p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative z-20 has-[[aria-expanded='true']]:z-50">
            <RecursosDropdown
              label="Estado inicial"
              options={HABITACION_ESTADO_OPTIONS}
              value={form.estado}
              onChange={form.handleEstadoChange}
              error={form.errors.estado}
              required
              direction="auto"
              searchable={false}
            />
          </div>

          <Input
            label="Precio por noche o día"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={
              resolvedTarifa && resolvedTarifa.price > 0
                ? `Máx. ${Math.trunc(resolvedTarifa.price)}`
                : 'Ej. 150000'
            }
            value={form.precio}
            onChange={(event) => form.handlePrecioChange(event.target.value)}
            onKeyDown={form.handlePrecioKeyDown}
            error={form.displayedPrecioError}
            hint="Opcional · Solo valores numéricos enteros."
            icon={<span className="text-sm font-semibold">$</span>}
          />
        </div>
      </section>

      {/* 4. Tarifa asociada */}
      <section
        aria-label="Tarifa de la habitación"
        className="border-line/65 bg-canvas/35 relative z-10 rounded-2xl border p-3.5 has-[[aria-expanded='true']]:z-50 sm:p-4"
      >
        <HabitacionTarifaField
          rates={rates}
          ratesLoading={ratesLoading}
          ratesError={ratesError}
          selectedTarifaId={selectedTarifaId}
          selectedTarifa={resolvedTarifa}
          numericPrecio={form.numericPrecio}
          hasValidNumericPrecio={form.hasValidNumericPrecio}
          isOverTariff={form.isOverTariff}
          onTarifaChange={(val) => onTarifaChange?.(val)}
          onApplyBasePrice={form.handleApplyTarifaPrice}
        />
      </section>

      {/* 5. Acciones del formulario (solo iconos + tooltips) */}
      <HabitacionFormActions
        submitting={submitting}
        onClear={form.handleReset}
        onCreateTipo={onCreateTipo}
        onCreateEdificio={onCreateEdificio}
      />

      {submitError ? (
        <SubmitError message={submitError} status={submitErrorStatus} />
      ) : null}
    </form>
  )
})

export default HabitacionDetalleForm
