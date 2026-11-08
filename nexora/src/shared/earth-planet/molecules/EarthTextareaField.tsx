import {
  type ChangeEvent,
  useState,
  useId,
  forwardRef,
} from 'react'
import { EarthGlobe } from './EarthGlobe'
import { EARTH_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

interface EarthTextareaFieldProps {
  id?: string
  value?: string | number
  defaultValue?: string | number
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onValueChange?: (val: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  required?: boolean
  hasError?: boolean
  className?: string
  textareaClassName?: string
}

/**
 * Molécula: Campo Textarea multilínea con temática de la Tierra y globo interactivo.
 */
export const EarthTextareaField = forwardRef<HTMLTextAreaElement, EarthTextareaFieldProps>(
  function EarthTextareaField(
    {
      id,
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder,
      rows = 4,
      disabled = false,
      required = false,
      hasError = false,
      className,
      textareaClassName,
    },
    ref
  ) {
    const autoId = useId()
    const textareaId = id ?? autoId
    const [isFocused, setIsFocused] = useState(false)

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e)
      onValueChange?.(e.target.value)
    }

    return (
      <div className={cn('relative flex items-start gap-3', className)}>
        {/* Globo Terrestre en la esquina superior izquierda */}
        <div className="pt-1">
          <EarthGlobe
            size="tiny"
            animated={isFocused}
            active={isFocused}
            disabled={disabled}
          />
        </div>

        {/* Textarea multilínea */}
        <div className="relative flex-1">
          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none resize-y',
              'font-sans bg-panel text-ink placeholder:text-ink-soft/70',
              hasError
                ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border-line hover:border-ink-soft focus:ring-2',
              disabled && 'opacity-50 cursor-not-allowed bg-canvas/50',
              textareaClassName
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
