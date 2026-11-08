import {
  type ChangeEvent,
  useState,
  useId,
  forwardRef,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { UranusGlobe } from './UranusGlobe'
import { URANUS_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface UranusDatePickerFieldProps {
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
 * Molécula: Selector de Fecha con temática uraniana.
 * Sincroniza el globo reactivo de Urano con sus anillos verticales y foco cian metánico.
 */
export const UranusDatePickerField = forwardRef<HTMLInputElement, UranusDatePickerFieldProps>(
  function UranusDatePickerField(
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
        {/* Globo de Urano reactivo */}
        <UranusGlobe
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
                ? URANUS_PALETTE.cyanBlue
                : isFocused
                  ? URANUS_PALETTE.cyanBlue
                  : undefined,
              boxShadow:
                isFocused && !hasError
                  ? `0 0 0 3px ${URANUS_PALETTE.cyanBlue}28`
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

UranusDatePickerField.displayName = 'UranusDatePickerField'

