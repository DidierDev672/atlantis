import {
  type ChangeEvent,
  useState,
  useId,
  forwardRef,
} from 'react'
import { EarthGlobe } from './EarthGlobe'
import { EARTH_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

interface EarthDatePickerFieldProps {
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
 * Molécula: Selector de Fecha adaptado al ciclo orbital y estacional de la Tierra.
 */
export const EarthDatePickerField = forwardRef<HTMLInputElement, EarthDatePickerFieldProps>(
  function EarthDatePickerField(
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
      <div className={cn('relative flex items-center gap-3', className)}>
        {/* Globo Terrestre reactivo */}
        <EarthGlobe
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
                ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border-line hover:border-ink-soft focus:ring-2',
              disabled && 'opacity-50 cursor-not-allowed bg-canvas/50',
              inputClassName
            )}
            style={{
              borderColor: isFocused && !hasError ? EARTH_PALETTE.oceanShallow : undefined,
              boxShadow: isFocused && !hasError ? `0 0 0 3px ${EARTH_PALETTE.oceanShallow}25` : undefined,
            }}
          />
        </div>
      </div>
    )
  }
)
