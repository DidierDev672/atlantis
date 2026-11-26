import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import {
  StatusCodeAlert,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'
import { RecursosDropdown } from '../../../recursos/ui/molecules/recursos-dropdown'
import type { EdificioOption } from '../../application/use-edificio-floors'
import { HabitacionIconTooltip } from '../atoms/habitacion-icon-tooltip'
import { cn } from '../lib/cn'

export interface HabitacionEdificioFieldProps {
  edificios: ReadonlyArray<EdificioOption>
  edificiosLoading: boolean
  loadingAutoEdificio: boolean
  edificioId: string
  isManualEdificio: boolean
  submitting: boolean
  required?: boolean
  error?: string
  autoEdificioValidation?: StatusCodeValidationResult | null
  onChange: (edificioId: string) => void
  onToggleManual: () => void
}

/**
 * Molécula: Campo selector de Edificio autodetectado desde `auth_user`,
 * en estado `isDisabled` por defecto y con botón icon-only de `@fortawesome`
 * para alternar la edición manual.
 */
export const HabitacionEdificioField = memo(function HabitacionEdificioField({
  edificios,
  edificiosLoading,
  loadingAutoEdificio,
  edificioId,
  isManualEdificio,
  submitting,
  required = true,
  error,
  autoEdificioValidation = null,
  onChange,
  onToggleManual,
}: HabitacionEdificioFieldProps) {
  const isBusy = edificiosLoading || loadingAutoEdificio
  const isFieldDisabled = !isManualEdificio || isBusy || submitting
  const actionLabel = isManualEdificio
    ? 'Volver al edificio detectado'
    : 'Editar edificio manualmente'

  const handleToggle = useCallback(() => {
    try {
      onToggleManual()
    } catch (err) {
      console.error('Error al alternar edición manual de edificio:', err)
    }
  }, [onToggleManual])

  return (
    <div className="relative z-40 space-y-2 has-[[aria-expanded='true']]:z-50">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <RecursosDropdown
            label="Edificio"
            placeholder={
              isBusy ? 'Detectando edificio…' : 'Elige un edificio…'
            }
            searchPlaceholder="Buscar edificio…"
            searchable
            options={edificios}
            value={edificioId}
            onChange={onChange}
            error={error}
            required={required}
            isDisabled={isFieldDisabled}
            disabled={isFieldDisabled}
            isLoading={isBusy}
            direction="auto"
            emptyLabel="Aún no hay edificios registrados."
          />
        </div>

        {/* Botón icon-only (FontAwesome) sin palabras visibles */}
        <div className="pt-[26px]">
          <HabitacionIconTooltip label={actionLabel}>
            <button
              type="button"
              onClick={handleToggle}
              disabled={isBusy || submitting}
              aria-pressed={isManualEdificio}
              aria-label={actionLabel}
              title={actionLabel}
              className={cn(
                'flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-2xs transition-all',
                'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                isManualEdificio
                  ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 active:scale-95'
                  : 'border-line bg-panel text-ink-muted hover:border-ink-soft hover:text-ink hover:scale-105 active:scale-95',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <FontAwesomeIcon
                icon={isManualEdificio ? faLock : faPenToSquare}
                className="size-4"
                aria-hidden="true"
              />
            </button>
          </HabitacionIconTooltip>
        </div>
      </div>

      {autoEdificioValidation && !autoEdificioValidation.isValid ? (
        <StatusCodeAlert validation={autoEdificioValidation} />
      ) : null}
    </div>
  )
})
