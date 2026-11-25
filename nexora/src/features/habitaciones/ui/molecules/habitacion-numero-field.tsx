import { memo, type RefObject } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPenToSquare,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import { Input } from '../../../../shared/ui/Input'
import { NUMERO_MAX } from '../../domain/habitacion-detalle'
import { HabitacionIconTooltip } from '../atoms/habitacion-icon-tooltip'
import { HabitacionNumeroIcon } from '../atoms/habitacion-numero-icon'
import { cn } from '../lib/cn'

export interface HabitacionNumeroFieldProps {
  numero: string
  isManualNumber: boolean
  loadingNextNumber: boolean
  nextNumberError: string | null
  error?: string
  containerRef: RefObject<HTMLDivElement | null>
  onChange: (value: string) => void
  onToggleManual: () => void
}

export const HabitacionNumeroField = memo(function HabitacionNumeroField({
  numero,
  isManualNumber,
  loadingNextNumber,
  nextNumberError,
  error,
  containerRef,
  onChange,
  onToggleManual,
}: HabitacionNumeroFieldProps) {
  const actionLabel = isManualNumber
    ? 'Volver a número automático'
    : 'Editar número manualmente'

  return (
    <div ref={containerRef} className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <Input
          id="habitacion-numero-input"
          label="Número de habitación"
          placeholder={loadingNextNumber ? 'Consultando número…' : 'Ej. 101'}
          autoComplete="off"
          maxLength={NUMERO_MAX}
          required
          isDisabled={!isManualNumber}
          value={numero}
          onChange={(event) => onChange(event.target.value)}
          error={error}
          hint={
            nextNumberError
              ? nextNumberError
              : isManualNumber
                ? 'Modo manual activo: escribe el número deseado.'
                : 'Sugerido automáticamente por el sistema.'
          }
          icon={<HabitacionNumeroIcon />}
        />
      </div>

      <div className="pt-[26px]">
        <HabitacionIconTooltip label={actionLabel}>
          <button
            type="button"
            onClick={onToggleManual}
            disabled={loadingNextNumber}
            aria-pressed={isManualNumber}
            aria-label={actionLabel}
            title={actionLabel}
            className={cn(
              'flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all shadow-2xs',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              isManualNumber
                ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 active:scale-95'
                : 'border-line bg-panel text-ink-muted hover:border-ink-soft hover:text-ink hover:scale-105 active:scale-95',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <FontAwesomeIcon
              icon={isManualNumber ? faWandMagicSparkles : faPenToSquare}
              className="size-4"
              aria-hidden="true"
            />
          </button>
        </HabitacionIconTooltip>
      </div>
    </div>
  )
})
