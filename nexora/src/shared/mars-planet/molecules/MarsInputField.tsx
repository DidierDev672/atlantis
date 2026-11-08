import {
  type ChangeEvent,
  useState,
  useId,
  forwardRef,
} from 'react'
import { MarsGlobe } from './MarsGlobe'
import { MARS_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

interface MarsInputFieldProps {
  id?: string
  type: 'text' | 'number'
  value?: string | number
  defaultValue?: string | number
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (val: string | number) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  hasError?: boolean
  className?: string
  inputClassName?: string
}

/**
 * Molécula: Campo de entrada de Texto o Número con temática marciana y globo reactivo.
 */
export const MarsInputField = forwardRef<HTMLInputElement, MarsInputFieldProps>(
  function MarsInputField(
    {
      id,
      type,
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder,
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
      if (type === 'number') {
        const num = parseFloat(e.target.value)
        onValueChange?.(isNaN(num) ? 0 : num)
      } else {
        onValueChange?.(e.target.value)
      }
    }

    const handleFocus = () => {
      setIsFocused(true)
    }

    const handleBlur = () => {
      setIsFocused(false)
    }

    const handleStep = (step: number) => {
      if (disabled) return
      const current = typeof value === 'number' ? value : parseFloat(String(value ?? 0)) || 0
      const next = current + step
      onValueChange?.(next)
    }

    return (
      <div className={cn('relative flex items-center gap-3', className)}>
        {/* Globo Marciano reactivo al foco */}
        <MarsGlobe
          size="tiny"
          animated={isFocused}
          active={isFocused}
          disabled={disabled}
        />

        {/* Input con bordes y acentos de óxido de Marte */}
        <div className="relative flex-1">
          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none',
              'font-sans bg-panel text-ink placeholder:text-ink-soft/70',
              hasError
                ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border-line hover:border-ink-soft focus:ring-2',
              disabled && 'opacity-50 cursor-not-allowed bg-canvas/50',
              inputClassName
            )}
            style={{
              borderColor: isFocused && !hasError ? MARS_PALETTE.rust : undefined,
              boxShadow: isFocused && !hasError ? `0 0 0 3px ${MARS_PALETTE.rust}22` : undefined,
            }}
          />

          {/* Controles para type="number" */}
          {type === 'number' && !disabled && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => handleStep(1)}
                className="p-0.5 text-ink-muted hover:text-ink text-[10px] leading-none transition-colors"
                title="Aumentar"
              >
                ▲
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => handleStep(-1)}
                className="p-0.5 text-ink-muted hover:text-ink text-[10px] leading-none transition-colors"
                title="Disminuir"
              >
                ▼
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
)
