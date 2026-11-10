import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faPhone } from '@fortawesome/free-solid-svg-icons';
import { fadeIn } from '../../../../design-tokens/motion';
import { DatePicker, parseISODate, toISODate } from '../../../../shared/date-picker';
import { Input } from '../../../../shared/ui/Input';
import {
  Loading,
  useBalancedPostLoading,
} from '../../../../shared/loading';
import { Rocket } from '../../../../shared/rocket/organisms/Rocket';
import { Button } from '../../../recursos/ui/atoms/button';
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown';
import {
  formatMetodoPago,
  formatPrecioCOP,
  normalizeMetodoPago,
  type RecepcionInput,
  type RecepcionValidationErrors,
} from '../../domain/recepcion';

export interface RecepcionCardFormProps {
  formValues: RecepcionInput;
  errors: RecepcionValidationErrors;
  sedeOptions?: ReadonlyArray<{ value: string; label: string }>;
  edificioOptions?: ReadonlyArray<{ value: string; label: string }>;
  habitacionDropdownOptions: ReadonlyArray<{ value: string; label: string }>;
  camaOptions?: ReadonlyArray<{ value: string; label: string }>;
  reservaDropdownOptions: ReadonlyArray<DropdownOption>;
  huespedDropdownOptions: ReadonlyArray<{ value: string; label: string }>;
  metodoPagoOptions: ReadonlyArray<{ value: string; label: string }>;
  estadoOptions: ReadonlyArray<{ value: string; label: string }>;
  loadingDependencies: boolean;
  submitting: boolean;
  syncNotice: string | null;
  onFieldChange: (
    field: keyof RecepcionInput,
    value: string | number | string[]
  ) => void;
  onSubmit: (e?: React.FormEvent) => void;
}

/**
 * Extrae solo la parte de fecha (YYYY-MM-DD) y la retorna como Date local para DatePicker.
 */
function parseDateOnly(val?: string): Date | null {
  if (!val) return null;
  const datePart = val.includes('T') ? val.split('T')[0] : val.trim();
  return parseISODate(datePart);
}

/**
 * Extrae la hora y minutos en formato HH:mm de una cadena de fecha, o retorna la hora por defecto.
 */
function extractTime(val?: string, defaultTime = '12:00'): string {
  if (!val || !val.includes('T')) return defaultTime;
  const timePart = val.split('T')[1];
  return timePart ? timePart.slice(0, 5) : defaultTime;
}

/**
 * Combina una fecha seleccionada con DatePicker y una hora en formato HH:mm.
 */
function combineDateAndTime(date: Date | null, timeStr: string): string {
  if (!date) return '';
  const dateStr = toISODate(date);
  const time = timeStr.trim() || '12:00';
  return `${dateStr}T${time}`;
}

export function RecepcionCardForm({
  formValues,
  errors,
  sedeOptions = [],
  edificioOptions = [],
  habitacionDropdownOptions,
  camaOptions = [],
  reservaDropdownOptions,
  huespedDropdownOptions,
  metodoPagoOptions,
  estadoOptions,
  loadingDependencies,
  submitting,
  syncNotice,
  onFieldChange,
  onSubmit,
}: RecepcionCardFormProps) {
  // Cálculo de duración aproximada en días/horas si ambas fechas están presentes
  const durationSummary = (() => {
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
  })();

  // Opciones de método de pago estrictamente garantizadas en español
  const metodoPagoOpcionesEnEspanol = useMemo(
    () =>
      metodoPagoOptions.map((opt) => ({
        value: normalizeMetodoPago(opt.value),
        label: formatMetodoPago(opt.label),
      })),
    [metodoPagoOptions]
  );

  // Fechas parseadas para DatePicker
  const parsedCheckIn = useMemo(
    () => parseDateOnly(formValues.checkIn),
    [formValues.checkIn]
  );
  const parsedCheckOut = useMemo(
    () => parseDateOnly(formValues.checkOut),
    [formValues.checkOut]
  );

  const handleDateEntradaChange = (date: Date | null) => {
    const time = extractTime(formValues.checkIn, '14:00');
    onFieldChange('checkIn', combineDateAndTime(date, time));
  };

  const handleTimeEntradaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = parseDateOnly(formValues.checkIn) ?? new Date();
    onFieldChange('checkIn', combineDateAndTime(date, e.target.value));
  };

  const handleDateSalidaChange = (date: Date | null) => {
    const time = extractTime(formValues.checkOut, '12:00');
    onFieldChange('checkOut', combineDateAndTime(date, time));
  };

  const handleTimeSalidaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date =
      parseDateOnly(formValues.checkOut) ?? parsedCheckIn ?? new Date();
    onFieldChange('checkOut', combineDateAndTime(date, e.target.value));
  };

  // Opciones de Reserva con icono de teléfono, fechas con icono de calendario y badge para huéspedes adicionales (+1, +2, etc.)
  const enrichedReservaOptions = useMemo<ReadonlyArray<DropdownOption>>(() => {
    return reservaDropdownOptions.map((opt) => {
      if (opt.customContent) return opt;

      const rawLabel = opt.label;
      const parts = rawLabel.includes(' · ')
        ? rawLabel.split(' · ')
        : rawLabel.split(' - ');
      const guestName = parts[0]?.trim() || rawLabel;
      const rest = parts.length > 1 ? parts.slice(1).join(' - ') : '';

      const matchExtra = rest.match(/\(\+(\d+)\)|\((\d+)\s+huéspedes\)/i);
      const extraGuests = matchExtra
        ? Number(matchExtra[1] || matchExtra[2])
        : 0;
      const cleanPhone = rest
        .replace(/\s*\(\+?\d+(\s+huéspedes)?\)/i, '')
        .trim();

      return {
        ...opt,
        customContent: (
          <div className="flex w-full items-center justify-between gap-2.5 py-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-ink">
                  {guestName}
                </p>
                {extraGuests > 0 && (
                  <span
                    className="bg-primary/10 text-primary ring-primary/25 inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1"
                    title={`+${extraGuests} huésped${extraGuests > 1 ? 'es' : ''} adicional${extraGuests > 1 ? 'es' : ''}`}
                  >
                    +{extraGuests}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1.5 shrink-0">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="size-2.5 shrink-0 text-primary/70"
                    aria-hidden="true"
                  />
                  <span className="truncate">{cleanPhone || 'Sin teléfono'}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 font-medium text-emerald-600 dark:text-emerald-400">
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className="size-2.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Entrada</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 font-medium text-amber-600 dark:text-amber-400">
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className="size-2.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Salida</span>
                </span>
              </div>
            </div>
          </div>
        ),
      };
    });
  }, [reservaDropdownOptions]);

  // Opciones de habitación sanitizadas: única y exclusivamente número de habitación y piso
  const sanitizedHabitacionOptions = useMemo(() => {
    return habitacionDropdownOptions.map((opt) => {
      const parts = opt.label.split(' - ');
      if (parts.length > 2) {
        return {
          ...opt,
          label: `${parts[0].trim()} - ${parts[1].trim()}`,
        };
      }
      return opt;
    });
  }, [habitacionDropdownOptions]);

  // Opciones de cama sanitizadas: quita la palabra (Disponible) de las opciones
  const sanitizedCamaOptions = useMemo(() => {
    return (camaOptions ?? []).map((opt) => ({
      ...opt,
      label: opt.label.replace(/\s*\((Disponible|disponible)\)/gi, '').trim(),
    }));
  }, [camaOptions]);

  // Determina si no existen reservas previas disponibles en el sistema (array vacío)
  const hasNoReservas =
    !loadingDependencies && reservaDropdownOptions.length === 0;

  // Gestión de carga balanceada: garantiza tiempo suficiente para visualizar la construcción del payload
  const { isBalancedVisible, stage } = useBalancedPostLoading({
    active: submitting,
    preparingDuration: 750, // Permite visualizar claramente la fase de preparación y empaquetado del payload
    transmittingMinDuration: 650, // Tiempo de vuelo del cohete y transmisión activa
    confirmingDuration: 450, // Confirmación segura antes del cierre
  });

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="border-line bg-panel relative overflow-hidden rounded-2xl border p-6 shadow-sm sm:p-8"
    >
      {/* Componente Rocket renderizado cuando el recepcionista confirma y se consume el endpoint POST /stay */}
      <AnimatePresence>
        {(submitting || isBalancedVisible) && (
          <motion.div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-panel border-line flex w-full max-w-sm flex-col items-center rounded-3xl border p-8 text-center shadow-2xl"
            >
              <Rocket
                size="md"
                autoLaunch
                loop
                interactive={false}
                timing={{ ignitionMs: 600, ascentMs: 1400 }}
                className="ring-primary/20 bg-canvas/60 shadow-xl ring-1"
              />
              <div className="mt-5 space-y-1.5">
                <h4 className="text-ink text-lg font-bold">
                  {stage === 'preparing'
                    ? 'Preparando recepción…'
                    : stage === 'transmitting'
                      ? 'Registrando estadía…'
                      : '¡Recepción confirmada!'}
                </h4>
                <p className="text-ink-muted text-xs leading-relaxed">
                  Consumiendo endpoint POST /stay con balanceo de carga. Tus datos están seguros.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carga reutilizable (/shared/loading) mientras se consumen los endpoints de dependencias (/reserve, etc.) */}
      <Loading
        visible={loadingDependencies}
        variant="overlay"
        label="Consultando reservas y recursos…"
        description="Obteniendo reservas desde /reserve con balanceo de carga…"
      />

      {/* Notificación de sincronización si se seleccionó una reserva */}
      {syncNotice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-primary/20 bg-primary/5 text-primary mb-6 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-4 shrink-0"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          <span>{syncNotice}</span>
        </motion.div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* 1. DROPDOWN DE RESERVAS (requerida por el backend para /stay) */}
          <div className="sm:col-span-2">
            <RecursosDropdown
              label="Reserva previa"
              placeholder={
                loadingDependencies
                  ? 'Cargando reservas…'
                  : hasNoReservas
                    ? 'Sin reservas pendientes'
                    : 'Seleccionar reserva…'
              }
              options={enrichedReservaOptions}
              value={formValues.reservaId}
              onChange={(value) => onFieldChange('reservaId', value)}
              error={errors.reservaId}
              required
              disabled={loadingDependencies || submitting || hasNoReservas}
            />

            {/* Mensaje ante ausencia de reservas previas */}
            {hasNoReservas ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                className="text-ink mt-3 flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 p-3 text-xs"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <p className="text-ink-muted text-xs leading-relaxed">
                  No hay reservas pendientes. Para walk-in, crea una reserva previa en el módulo de Reservas.
                </p>
              </motion.div>
            ) : (
              <p className="text-ink-soft mt-1 text-xs">
                Sincroniza automáticamente habitación, huésped y fechas.
              </p>
            )}
          </div>

          {/* 2. CASCADA JERÁRQUICA DE UBICACIÓN */}
          <div className="border-line/80 bg-canvas/60 space-y-4 rounded-2xl border p-4 sm:col-span-2 sm:p-5">
            <p className="text-ink text-xs font-bold tracking-wider uppercase">
              Ubicación (Sede ➔ Edificio ➔ Habitación ➔ Cama)
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Sede */}
              <div>
                <RecursosDropdown
                  label="Sede hotelera"
                  placeholder="Seleccionar sede…"
                  options={sedeOptions}
                  value={formValues.sedeId}
                  onChange={(value) => onFieldChange('sedeId', value)}
                  disabled={loadingDependencies || submitting}
                />
              </div>

              {/* Edificio */}
              <div>
                <RecursosDropdown
                  label="Edificio / Torre"
                  placeholder="Seleccionar edificio…"
                  options={edificioOptions}
                  value={formValues.edificioId}
                  onChange={(value) => onFieldChange('edificioId', value)}
                  disabled={loadingDependencies || submitting}
                />
              </div>

              {/* Habitación */}
              <div>
                <RecursosDropdown
                  label="Habitación asignada"
                  placeholder={
                    loadingDependencies
                      ? 'Cargando habitaciones…'
                      : 'Seleccionar habitación…'
                  }
                  options={sanitizedHabitacionOptions}
                  value={formValues.habitacionId}
                  onChange={(value) => onFieldChange('habitacionId', value)}
                  error={errors.habitacionId}
                  required
                  disabled={loadingDependencies || submitting}
                />
              </div>

              {/* Cama */}
              <div>
                <RecursosDropdown
                  label="Cama asignada"
                  placeholder={
                    sanitizedCamaOptions.length > 0
                      ? 'Seleccionar cama…'
                      : 'Sin camas configuradas'
                  }
                  options={sanitizedCamaOptions}
                  value={formValues.camaId}
                  onChange={(value) => onFieldChange('camaId', value)}
                  disabled={loadingDependencies || submitting}
                />
              </div>
            </div>
          </div>

          {/* 3. DROPDOWN DE HUÉSPED (Soporte selección múltiple) */}
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
                Array.isArray(formValues.huespedIds) && formValues.huespedIds.length > 0
                  ? formValues.huespedIds
                  : formValues.huespedId
                    ? [formValues.huespedId]
                    : []
              }
              onMultiChange={(values) => onFieldChange('huespedIds', values)}
              error={errors.huespedId}
              required
              disabled={loadingDependencies || submitting}
            />
          </div>

          {/* 4. CAMPO FECHA Y HORA DE ENTRADA */}
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

          {/* 5. CAMPO FECHA Y HORA DE SALIDA */}
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

          {/* 6. DROPDOWN MÉTODO DE PAGO [efectivo, tarjeta, transferencia] */}
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
              disabled={submitting}
            />
          </div>

          {/* 7. ESTADO [progreso, finalizada, cancelada] */}
          <div>
            <RecursosDropdown
              label="Estado de la recepción"
              placeholder="Seleccionar estado…"
              options={estadoOptions}
              value={formValues.estado}
              onChange={(value) => onFieldChange('estado', value)}
              error={errors.estado}
              required
              disabled={submitting}
            />
          </div>

          {/* 8. DEPÓSITO DE GARANTÍA con Input */}
          <div className="sm:col-span-2">
            <Input
              type="number"
              step="any"
              min="0"
              label="Depósito de garantía"
              placeholder="Ej. 50000"
              value={formValues.depositoGarantia}
              onChange={(e) =>
                onFieldChange('depositoGarantia', e.target.value)
              }
              error={errors.depositoGarantia}
              icon={
                <span className="flex items-center gap-1.5 text-ink-muted text-xs font-semibold pr-2 border-r border-line/80 select-none">
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
                  ? `Monto en custodia: ${formatPrecioCOP(Number(formValues.depositoGarantia))}`
                  : 'Garantía reembolsable al check-out (0 si no aplica).'
              }
            />
          </div>

          {/* 9. OBSERVACIONES / REMARKS (Textarea) */}
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
        </div>

        {/* Botón de acción principal */}
        <div className="border-line/60 flex flex-col-reverse items-center justify-between gap-3 border-t pt-4 sm:flex-row">
          <p className="text-ink-soft text-center text-xs sm:text-left">
            Al registrar, se actualizará el estado de la habitación y se emitirá
            el comprobante.
          </p>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || isBalancedVisible || loadingDependencies}
            className="w-full px-6 py-2.5 text-sm font-semibold transition-all sm:w-auto"
          >
            {submitting || isBalancedVisible ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>
                  {stage === 'preparing'
                    ? 'Preparando payload…'
                    : stage === 'transmitting'
                      ? 'Despegando y transmitiendo…'
                      : '¡Recepción confirmada!'}
                </span>
              </span>
            ) : (
              'Confirmar y registrar recepción'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
