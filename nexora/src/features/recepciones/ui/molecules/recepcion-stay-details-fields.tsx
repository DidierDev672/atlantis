import { memo, useCallback, useMemo } from 'react';
import { DatePicker, parseISODate, toISODate } from '../../../../shared/date-picker';
import { Input } from '../../../../shared/ui/Input';
import { RecursosDropdown } from '../../../recursos/ui/molecules/recursos-dropdown';
import {
  formatMetodoPago,
  formatPrecioCOP,
  normalizeMetodoPago,
  type RecepcionInput,
  type RecepcionValidationErrors,
} from '../../domain/recepcion';

function parseDateOnly(val?: string): Date | null {
  if (!val) return null;
  const datePart = val.includes('T') ? val.split('T')[0] : val.trim();
  return parseISODate(datePart);
}

function extractTime(val?: string, defaultTime = '12:00'): string {
  if (!val || !val.includes('T')) return defaultTime;
  const timePart = val.split('T')[1];
  return timePart ? timePart.slice(0, 5) : defaultTime;
}

function combineDateAndTime(date: Date | null, timeStr: string): string {
  if (!date) return '';
  const dateStr = toISODate(date);
  const time = timeStr.trim() || '12:00';
  return `${dateStr}T${time}`;
}

export interface RecepcionStayDetailsFieldsProps {
  formValues: RecepcionInput;
  errors: RecepcionValidationErrors;
  huespedDropdownOptions: ReadonlyArray<{ value: string; label: string }>;
  metodoPagoOptions: ReadonlyArray<{ value: string; label: string }>;
  estadoOptions: ReadonlyArray<{ value: string; label: string }>;
  loadingDependencies: boolean;
  submitting: boolean;
  onFieldChange: (
    field: keyof RecepcionInput,
    value: string | number | string[]
  ) => void;
}

/**
 * Molécula: Campos operativos de la estadía (huéspedes, fechas, pago, estado, depósito y notas).
 */
export const RecepcionStayDetailsFields = memo(
  function RecepcionStayDetailsFields({
    formValues,
    errors,
    huespedDropdownOptions,
    metodoPagoOptions,
    estadoOptions,
    loadingDependencies,
    submitting,
    onFieldChange,
  }: RecepcionStayDetailsFieldsProps) {
    const durationSummary = useMemo(() => {
      if (!formValues.checkIn || !formValues.checkOut) return null;
      const start = new Date(formValues.checkIn).getTime();
      const end = new Date(formValues.checkOut).getTime();
      if (isNaN(start) || isNaN(end) || end <= start) return null;
      const diffHours = Math.round((end - start) / (1000 * 60 * 60));
      const days = Math.floor(diffHours / 24);
      const hours = diffHours % 24;
      if (days === 0) return `${hours} horas de estadía`;
      if (hours === 0) return `${days} ${days === 1 ? 'noche' : 'noches'}`;
      return `${days} ${days === 1 ? 'noche' : 'noches'} y ${hours} hrs`;
    }, [formValues.checkIn, formValues.checkOut]);

    const metodoPagoOpcionesEnEspanol = useMemo(
      () =>
        metodoPagoOptions.map((opt) => ({
          value: normalizeMetodoPago(opt.value),
          label: formatMetodoPago(opt.label),
        })),
      [metodoPagoOptions]
    );

    const parsedCheckIn = useMemo(
      () => parseDateOnly(formValues.checkIn),
      [formValues.checkIn]
    );
    const parsedCheckOut = useMemo(
      () => parseDateOnly(formValues.checkOut),
      [formValues.checkOut]
    );

    const handleDateEntradaChange = useCallback(
      (date: Date | null) => {
        const time = extractTime(formValues.checkIn, '14:00');
        onFieldChange('checkIn', combineDateAndTime(date, time));
      },
      [formValues.checkIn, onFieldChange]
    );

    const handleTimeEntradaChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = parseDateOnly(formValues.checkIn) ?? new Date();
        onFieldChange('checkIn', combineDateAndTime(date, e.target.value));
      },
      [formValues.checkIn, onFieldChange]
    );

    const handleDateSalidaChange = useCallback(
      (date: Date | null) => {
        const time = extractTime(formValues.checkOut, '12:00');
        onFieldChange('checkOut', combineDateAndTime(date, time));
      },
      [formValues.checkOut, onFieldChange]
    );

    const handleTimeSalidaChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const date =
          parseDateOnly(formValues.checkOut) ?? parsedCheckIn ?? new Date();
        onFieldChange('checkOut', combineDateAndTime(date, e.target.value));
      },
      [formValues.checkOut, onFieldChange, parsedCheckIn]
    );

    return (
      <>
        {/* Huéspedes */}
        <div className="sm:col-span-2">
          <RecursosDropdown
            label="Huéspedes"
            placeholder={
              loadingDependencies
                ? 'Cargando huéspedes…'
                : 'Seleccionar huéspedes…'
            }
            options={huespedDropdownOptions}
            multiple
            searchable
            selectedValues={
              Array.isArray(formValues.huespedIds) &&
              formValues.huespedIds.length > 0
                ? formValues.huespedIds
                : formValues.huespedId
                  ? [formValues.huespedId]
                  : []
            }
            onMultiChange={(values) => onFieldChange('huespedIds', values)}
            error={errors.huespedId}
            required
            isDisabled={loadingDependencies || submitting}
          />
        </div>

        {/* Fecha y hora de entrada */}
        <div>
          <div className="space-y-1.5">
            <span className="text-ink block text-sm font-medium">
              Fecha y hora de entrada{' '}
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <DatePicker
                  id="recepcion-checkin-date"
                  placeholder="Elegir fecha…"
                  value={parsedCheckIn}
                  onChange={handleDateEntradaChange}
                  error={errors.checkIn}
                  required
                  clearable={false}
                  disabled={submitting}
                />
              </div>
              <div className="sm:col-span-1">
                <Input
                  type="time"
                  value={extractTime(formValues.checkIn, '14:00')}
                  onChange={handleTimeEntradaChange}
                  title="Hora de entrada"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <p className="text-ink-soft text-xs">Ingreso del huésped.</p>
          </div>
        </div>

        {/* Fecha y hora de salida */}
        <div>
          <div className="space-y-1.5">
            <span className="text-ink block text-sm font-medium">
              Fecha y hora de salida{' '}
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <DatePicker
                  id="recepcion-checkout-date"
                  placeholder="Elegir fecha…"
                  value={parsedCheckOut}
                  onChange={handleDateSalidaChange}
                  minDate={parsedCheckIn ?? undefined}
                  error={errors.checkOut}
                  required
                  clearable={false}
                  disabled={submitting}
                />
              </div>
              <div className="sm:col-span-1">
                <Input
                  type="time"
                  value={extractTime(formValues.checkOut, '12:00')}
                  onChange={handleTimeSalidaChange}
                  title="Hora de salida"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <p className="text-ink-soft text-xs">
              {durationSummary ?? 'Salida estimada.'}
            </p>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <RecursosDropdown
            label="Método de pago"
            placeholder="Seleccionar método de pago…"
            options={metodoPagoOpcionesEnEspanol}
            value={normalizeMetodoPago(formValues.metodoPago)}
            onChange={(value) =>
              onFieldChange('metodoPago', normalizeMetodoPago(value))
            }
            error={errors.metodoPago}
            required
            isDisabled={submitting}
          />
        </div>

        {/* Estado */}
        <div>
          <RecursosDropdown
            label="Estado de la recepción"
            placeholder="Seleccionar estado…"
            options={estadoOptions}
            value={formValues.estado}
            onChange={(value) => onFieldChange('estado', value)}
            error={errors.estado}
            required
            isDisabled={submitting}
          />
        </div>

        {/* Depósito de garantía */}
        <div className="sm:col-span-2">
          <Input
            type="number"
            step="any"
            min="0"
            label="Depósito de garantía"
            placeholder="Ej. 50000"
            value={formValues.depositoGarantia}
            onChange={(e) => onFieldChange('depositoGarantia', e.target.value)}
            error={errors.depositoGarantia}
            icon={
              <span className="text-ink-muted border-line/80 flex items-center gap-1.5 border-r pr-2 text-xs font-semibold select-none">
                <span>COP</span>
                <span className="text-primary font-bold">$</span>
              </span>
            }
            iconPosition="left"
            inputClassName="!pl-20"
            required
            disabled={submitting}
            hint={
              formValues.depositoGarantia !== '' &&
              !isNaN(Number(formValues.depositoGarantia))
                ? `Monto en custodia: ${formatPrecioCOP(
                    Number(formValues.depositoGarantia)
                  )}`
                : 'Garantía reembolsable al check-out (0 si no aplica).'
            }
          />
        </div>

        {/* Observaciones */}
        <div className="sm:col-span-2">
          <label
            htmlFor="recepcion-remarks"
            className="text-ink mb-1.5 block text-sm font-medium"
          >
            Observaciones
          </label>
          <textarea
            id="recepcion-remarks"
            rows={3}
            placeholder="Observaciones o requerimientos especiales (opcional)…"
            value={formValues.observaciones ?? ''}
            onChange={(e) => onFieldChange('observaciones', e.target.value)}
            disabled={submitting}
            className="border-line bg-panel text-ink placeholder:text-ink-soft hover:border-ink-soft focus:border-primary focus:ring-primary/20 w-full resize-y rounded-xl border px-4 py-2.5 text-sm shadow-xs transition outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </>
    );
  }
);

export default RecepcionStayDetailsFields;
