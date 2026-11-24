import { Suspense, lazy, memo, useCallback, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown';
import type {
  RecepcionInput,
  RecepcionValidationErrors,
} from '../../domain/recepcion';

const LazyReservaDropdownOptionContent = lazy(
  () => import('./reserva-dropdown-option-content')
);

interface ParsedReservaLabel {
  guestName: string;
  phone: string | null;
  inDate: string;
  outDate: string;
  extraGuests: number;
  guestCount: number;
}

function parseReservaLabel(rawLabel: string): ParsedReservaLabel {
  try {
    const extraMatch = rawLabel.match(/\((\+\d+|\d+\s+huéspedes)\)\s*$/i);
    const extraGuests = extraMatch
      ? Math.max(
          0,
          Number(extraMatch[1].replace(/[^\d]/g, '')) -
            (extraMatch[1].startsWith('+') ? 0 : 1)
        )
      : 0;
    const withoutCount = extraMatch
      ? rawLabel.slice(0, extraMatch.index).trim()
      : rawLabel;

    const segments = withoutCount.split(' · ').map((s) => s.trim());
    const guestName = segments[0] || rawLabel;
    const dateSegment = segments.find((s) => s.includes('→'));
    const [inDate = 'Por definir', outDate = 'Por definir'] = dateSegment
      ? dateSegment.split('→').map((d) => d.trim())
      : [];
    const phoneSegment = segments.find(
      (s, idx) => idx > 0 && !s.includes('→')
    );

    return {
      guestName,
      phone: phoneSegment ?? null,
      inDate,
      outDate,
      extraGuests,
      guestCount: extraGuests + 1,
    };
  } catch {
    return {
      guestName: rawLabel,
      phone: null,
      inDate: 'Por definir',
      outDate: 'Por definir',
      extraGuests: 0,
      guestCount: 1,
    };
  }
}

export interface RecepcionReservaFieldProps {
  reservaId: string;
  reservaDropdownOptions: ReadonlyArray<DropdownOption>;
  error?: string;
  loadingDependencies: boolean;
  submitting: boolean;
  onFieldChange: (
    field: keyof RecepcionInput,
    value: string | number | string[]
  ) => void;
}

/**
 * Molécula: Selector de reserva previa.
 * Mantiene opciones planas en reposo (0 closures JSX en RAM) e hidrata `renderContent`
 * bajo demanda con `React.lazy` al enfocar o pasar el cursor sobre el selector.
 */
export const RecepcionReservaField = memo(function RecepcionReservaField({
  reservaId,
  reservaDropdownOptions,
  error,
  loadingDependencies,
  submitting,
  onFieldChange,
}: RecepcionReservaFieldProps) {
  const [hasInteracted, setHasInteracted] = useState(false);

  const activateLazyContent = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const enrichedReservaOptions = useMemo<ReadonlyArray<DropdownOption>>(() => {
    if (!hasInteracted) return reservaDropdownOptions;

    return reservaDropdownOptions.map((opt) => {
      if (opt.customContent || opt.renderContent) return opt;
      const parsed = parseReservaLabel(opt.label);
      return {
        ...opt,
        renderContent: () => (
          <Suspense
            fallback={
              <span className="text-ink block truncate text-xs font-medium">
                {opt.label}
              </span>
            }
          >
            <LazyReservaDropdownOptionContent
              guestName={parsed.guestName}
              phone={parsed.phone}
              inDate={parsed.inDate}
              outDate={parsed.outDate}
              guestCount={parsed.guestCount}
              extraGuests={parsed.extraGuests}
            />
          </Suspense>
        ),
      };
    });
  }, [hasInteracted, reservaDropdownOptions]);

  const hasNoReservas =
    !loadingDependencies && reservaDropdownOptions.length === 0;

  return (
    <div
      className="sm:col-span-2"
      onFocusCapture={activateLazyContent}
      onMouseEnter={activateLazyContent}
    >
      <RecursosDropdown
        label="Reserva previa"
        placeholder={
          loadingDependencies
            ? 'Cargando reservas…'
            : hasNoReservas
              ? 'Sin reservas activas o pendientes'
              : 'Seleccionar reserva…'
        }
        options={enrichedReservaOptions}
        value={reservaId}
        onChange={(value) => onFieldChange('reservaId', value)}
        error={error as RecepcionValidationErrors['reservaId']}
        required
        isDisabled={loadingDependencies || submitting || hasNoReservas}
      />

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
            No hay reservas activas o pendientes. Para walk-in, crea una reserva
            previa en el módulo de Reservas.
          </p>
        </motion.div>
      ) : (
        <p className="text-ink-soft mt-1 text-xs">
          Sincroniza automáticamente habitación, huésped y fechas.
        </p>
      )}
    </div>
  );
});

export default RecepcionReservaField;
