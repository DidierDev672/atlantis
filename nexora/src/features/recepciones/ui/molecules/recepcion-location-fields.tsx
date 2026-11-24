import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faLock,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';
import { Loading } from '../../../../shared/loading';
import type { StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator';
import { RecursosDropdown } from '../../../recursos/ui/molecules/recursos-dropdown';
import type {
  RecepcionInput,
  RecepcionValidationErrors,
  SedeInfo,
  SubSedeInfo,
} from '../../domain/recepcion';

export interface RecepcionLocationFieldsProps {
  formValues: RecepcionInput;
  errors: RecepcionValidationErrors;
  sedeOptions: ReadonlyArray<{ value: string; label: string }>;
  edificioOptions: ReadonlyArray<{ value: string; label: string }>;
  habitacionOptions: ReadonlyArray<{ value: string; label: string }>;
  camaOptions: ReadonlyArray<{ value: string; label: string }>;
  loadingDependencies: boolean;
  loadingLocation: boolean;
  submitting: boolean;
  isLocationLocked: boolean;
  detectedHeadquarter: SedeInfo | null;
  detectedSubHeadquarter: SubSedeInfo | null;
  locationValidationError: StatusCodeValidationResult | null;
  onToggleManualLocation: () => void;
  onFieldChange: (
    field: keyof RecepcionInput,
    value: string | number | string[]
  ) => void;
}

/**
 * Molécula: Bloque jerárquico de ubicación del formulario de recepción.
 * Bloquea Sede hotelera y Edificio / Torre (`isDisabled`) según la detección automática
 * del recepcionista y ofrece botón icon-only (FontAwesome) para edición manual.
 */
export const RecepcionLocationFields = memo(function RecepcionLocationFields({
  formValues,
  errors,
  sedeOptions,
  edificioOptions,
  habitacionOptions,
  camaOptions,
  loadingDependencies,
  loadingLocation,
  submitting,
  isLocationLocked,
  detectedHeadquarter,
  detectedSubHeadquarter,
  locationValidationError,
  onToggleManualLocation,
  onFieldChange,
}: RecepcionLocationFieldsProps) {
  const isHierarchyDisabled =
    isLocationLocked || loadingDependencies || loadingLocation || submitting;

  const detectedSummary = detectedHeadquarter
    ? [
        detectedHeadquarter.name,
        detectedSubHeadquarter?.name,
        detectedHeadquarter.city,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <div className="border-line/80 bg-canvas/60 space-y-4 rounded-2xl border p-4 sm:col-span-2 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-ink text-xs font-bold tracking-wider uppercase">
            Ubicación
          </p>
          {detectedSummary && (
            <p className="text-ink-muted mt-0.5 flex items-center gap-1.5 truncate text-[11px]">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="text-primary size-3 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{detectedSummary}</span>
            </p>
          )}
        </div>

        {/* Botón icon-only (FontAwesome) para alternar modificación manual */}
        <button
          type="button"
          onClick={onToggleManualLocation}
          disabled={loadingLocation || submitting}
          aria-pressed={!isLocationLocked}
          aria-label={
            isLocationLocked
              ? 'Modificar sede y edificio manualmente'
              : 'Restaurar ubicación detectada automáticamente'
          }
          title={
            isLocationLocked
              ? 'Modificar ubicación manualmente'
              : 'Bloquear con ubicación detectada'
          }
          className={`focus-visible:ring-primary/40 grid size-8 shrink-0 cursor-pointer place-items-center rounded-xl border transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            isLocationLocked
              ? 'border-line bg-panel text-ink-muted hover:border-primary/40 hover:text-primary'
              : 'border-primary/40 bg-primary/10 text-primary'
          }`}
        >
          <FontAwesomeIcon
            icon={isLocationLocked ? faPenToSquare : faLock}
            className="size-3.5"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Estado de carga mientras se consultan /headquarters/{id}, /sub-headquarters y /room */}
      {loadingLocation && (
        <div className="border-line/70 bg-panel/80 rounded-xl border px-3 py-2.5">
          <Loading
            variant="inline"
            size="sm"
            label="Detectando sede y habitaciones asignadas…"
            delay={0}
            minDuration={250}
          />
        </div>
      )}

      {/* Aviso empático validado con status-code-validator si falló algún endpoint de ubicación */}
      {locationValidationError && !locationValidationError.isValid && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300"
        >
          <span className="font-semibold">
            {locationValidationError.title || 'Aviso de ubicación'}:
          </span>{' '}
          {locationValidationError.message ||
            'Puedes ajustar la sede y edificio manualmente usando el botón de edición.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Sede hotelera */}
        <div>
          <RecursosDropdown
            label="Sede hotelera"
            placeholder="Seleccionar sede…"
            options={sedeOptions}
            value={formValues.sedeId}
            onChange={(value) => onFieldChange('sedeId', value)}
            isDisabled={isHierarchyDisabled}
          />
        </div>

        {/* Edificio / Torre */}
        <div>
          <RecursosDropdown
            label="Edificio / Torre"
            placeholder="Seleccionar edificio…"
            options={edificioOptions}
            value={formValues.edificioId}
            onChange={(value) => onFieldChange('edificioId', value)}
            isDisabled={isHierarchyDisabled}
          />
        </div>

        {/* Habitación */}
        <div>
          <RecursosDropdown
            label="Habitación asignada"
            placeholder={
              loadingDependencies || loadingLocation
                ? 'Cargando habitaciones…'
                : 'Seleccionar habitación…'
            }
            options={habitacionOptions}
            value={formValues.habitacionId}
            onChange={(value) => onFieldChange('habitacionId', value)}
            error={errors.habitacionId}
            required
            isDisabled={loadingDependencies || loadingLocation || submitting}
          />
        </div>

        {/* Cama */}
        <div>
          <RecursosDropdown
            label="Cama asignada"
            placeholder={
              camaOptions.length > 0
                ? 'Seleccionar cama…'
                : 'Sin camas configuradas'
            }
            options={camaOptions}
            value={formValues.camaId}
            onChange={(value) => onFieldChange('camaId', value)}
            isDisabled={loadingDependencies || submitting}
          />
        </div>
      </div>
    </div>
  );
});

export default RecepcionLocationFields;
