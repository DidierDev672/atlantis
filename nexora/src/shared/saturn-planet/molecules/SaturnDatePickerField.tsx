import {
  type ChangeEvent,
  useState,
  useId,
  forwardRef,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { SaturnGlobe } from './SaturnGlobe'
import { SATURN_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface SaturnDatePickerFieldProps {
  id?: string
  value?: string | number
  defaultValue?: string | number
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (val: string) => void
  disabled?: boolean
  required?: boolean
  hasError?: boolean
  className?: string
  inputClassName?: string
}

/**
 * Molécula: Selector de Fecha con temática saturniana.
 * Sincroniza el globo reactivo de Saturno con sus anillos y foco áureo.
 */
export const SaturnDatePickerField = forwardRef<HTMLInputElement, SaturnDatePickerFieldProps>(
  function SaturnDatePickerField(
    {
      id,
      value,
      defaultValue,
      onChange,
      onValueChange,
      disabled = false,
      required = false,
      hasError = false,
      className,
      inputClassName,
    },
    ref
  ) {
    const autoId = useId()
    const inputId = id ?? autoId
    const [isFocused, setIsFocused] = useState(false)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onValueChange?.(e.target.value)
    }

    return (
      <div className={cn('relative flex items-center gap-3.5', className)}>
        {/* Globo de Saturno reactivo */}
        <SaturnGlobe
          size="tiny"
          animated={isFocused}
          active={isFocused}
          disabled={disabled}
        />

        <div className="relative flex-1">
          <input
            ref={ref}
            id={inputId}
            type="date"
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none',
              'font-sans bg-panel text-ink cursor-pointer',
              hasError
                ? 'border-danger focus:border-danger'
                : 'border-line hover:border-ink-soft',
              disabled && 'opacity-50 cursor-not-allowed bg-canvas/50',
              inputClassName
            )}
            style={{
              borderColor: hasError
                ? SATURN_PALETTE.goldenOchre
                : isFocused
                  ? SATURN_PALETTE.goldenOchre
                  : undefined,
              boxShadow:
                isFocused && !hasError
                  ? `0 0 0 3px ${SATURN_PALETTE.goldenOchre}28`
                  : undefined,
            }}
          />

          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
            <FontAwesomeIcon icon={faCalendarDays} className="size-3.5" />
          </div>
        </div>
      </div>
    )
  }
)

SaturnDatePickerField.displayName = 'SaturnDatePickerField'

