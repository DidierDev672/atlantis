import { Suspense, lazy, memo } from 'react';
import { motion } from 'motion/react';
import { fadeIn } from '../../../../design-tokens/motion';
import type { StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator';
import {
  Loading,
  useBalancedPostLoading,
} from '../../../../shared/loading';
import { Button } from '../../../recursos/ui/atoms/button';
import type { DropdownOption } from '../../../recursos/ui/molecules/recursos-dropdown';
import type {
  RecepcionInput,
  RecepcionValidationErrors,
  SedeInfo,
  SubSedeInfo,
} from '../../domain/recepcion';

const LazyRecepcionSubmitOverlay = lazy(
  () => import('./recepcion-submit-overlay')
);
const LazyRecepcionReservaField = lazy(
  () => import('./recepcion-reserva-field')
);
const LazyRecepcionLocationFields = lazy(
  () => import('./recepcion-location-fields')
);
const LazyRecepcionStayDetailsFields = lazy(
  () => import('./recepcion-stay-details-fields')
);

const NOOP_TOGGLE_LOCATION = () => {};

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
  loadingLocation?: boolean;
  locationValidationError?: StatusCodeValidationResult | null;
  detectedHeadquarter?: SedeInfo | null;
  detectedSubHeadquarter?: SubSedeInfo | null;
  isLocationLocked?: boolean;
  submitting: boolean;
  syncNotice: string | null;
  onToggleManualLocation?: () => void;
  onFieldChange: (
    field: keyof RecepcionInput,
    value: string | number | string[]
  ) => void;
  onSubmit: (e?: React.FormEvent) => void;
}

/**
 * Molécula orquestadora del formulario de registro de recepciones.
 * Delega sus secciones en sub-moléculas con carga perezosa (`React.lazy` + `React.memo`).
 */
export const RecepcionCardForm = memo(function RecepcionCardForm({
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
  loadingLocation = false,
  locationValidationError = null,
  detectedHeadquarter = null,
  detectedSubHeadquarter = null,
  isLocationLocked = false,
  submitting,
  syncNotice,
  onToggleManualLocation = NOOP_TOGGLE_LOCATION,
  onFieldChange,
  onSubmit,
}: RecepcionCardFormProps) {
  const { isBalancedVisible, stage } = useBalancedPostLoading({
    active: submitting,
    preparingDuration: 750,
    transmittingMinDuration: 650,
    confirmingDuration: 450,
  });

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="border-line bg-panel relative overflow-hidden rounded-2xl border p-6 shadow-sm sm:p-8"
    >
      {(submitting || isBalancedVisible) && (
        <Suspense fallback={null}>
          <LazyRecepcionSubmitOverlay
            visible={submitting || isBalancedVisible}
            stage={stage}
          />
        </Suspense>
      )}

      <Loading
        visible={loadingDependencies}
        variant="overlay"
        label="Consultando reservas y recursos…"
        description="Obteniendo reservas desde /reserve con balanceo de carga…"
      />

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
          <Suspense
            fallback={
              <div className="bg-line/35 h-16 animate-pulse rounded-xl sm:col-span-2" />
            }
          >
            <LazyRecepcionReservaField
              reservaId={formValues.reservaId}
              reservaDropdownOptions={reservaDropdownOptions}
              error={errors.reservaId}
              loadingDependencies={loadingDependencies}
              submitting={submitting}
              onFieldChange={onFieldChange}
            />
          </Suspense>

          <Suspense
            fallback={
              <div className="border-line/80 bg-canvas/60 h-44 animate-pulse rounded-2xl border sm:col-span-2" />
            }
          >
            <LazyRecepcionLocationFields
              formValues={formValues}
              errors={errors}
              sedeOptions={sedeOptions}
              edificioOptions={edificioOptions}
              habitacionOptions={habitacionDropdownOptions}
              camaOptions={camaOptions}
              loadingDependencies={loadingDependencies}
              loadingLocation={loadingLocation}
              submitting={submitting}
              isLocationLocked={isLocationLocked}
              detectedHeadquarter={detectedHeadquarter}
              detectedSubHeadquarter={detectedSubHeadquarter}
              locationValidationError={locationValidationError}
              onToggleManualLocation={onToggleManualLocation}
              onFieldChange={onFieldChange}
            />
          </Suspense>

          <Suspense
            fallback={
              <div className="bg-line/35 h-48 animate-pulse rounded-xl sm:col-span-2" />
            }
          >
            <LazyRecepcionStayDetailsFields
              formValues={formValues}
              errors={errors}
              huespedDropdownOptions={huespedDropdownOptions}
              metodoPagoOptions={metodoPagoOptions}
              estadoOptions={estadoOptions}
              loadingDependencies={loadingDependencies}
              submitting={submitting}
              onFieldChange={onFieldChange}
            />
          </Suspense>
        </div>

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
});
