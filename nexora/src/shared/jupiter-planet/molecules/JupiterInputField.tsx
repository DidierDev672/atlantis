import {
  type ChangeEvent,
  useState,
  useId,
  forwardRef,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMinus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { JupiterGlobe } from './JupiterGlobe'
import { JUPITER_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface JupiterInputFieldProps {
  id?: string
  type?: 'text' | 'number' | 'email' | 'password'
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
 * Molécula: Campo de entrada de Texto o Número con temática joviana y globo reactivo.
 */
export const JupiterInputField = forwardRef<HTMLInputElement, JupiterInputFieldProps>(
  function JupiterInputField(
    {
      id,
      type = 'text',
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

    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)

    const handleStep = (step: number) => {
      if (disabled) return
      const current = typeof value === 'number' ? value : parseFloat(String(value ?? 0)) || 0
      const next = current + step
      onValueChange?.(next)
    }

    const handleClear = () => {
      if (disabled) return
      onValueChange?.('')
    }

    const showClear = Boolean(value && !disabled && type !== 'number')

    return (
      <div className={cn('relative flex items-center gap-3', className)}>
        {/* Globo Joviano reactivo al foco */}
        <JupiterGlobe
          size="tiny"
          animated={isFocused}
          active={isFocused}
          disabled={disabled}
        />

        {/* Input con bordes y acentos jovianos */}
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
              'font-sans bg-panel text-ink placeholder:text-ink-muted/50',
              hasError
                ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border-line hover:border-ink-soft',
              disabled && 'opacity-50 cursor-not-allowed bg-canvas/50',
              inputClassName
            )}
            style={{
              borderColor: hasError
                ? JUPITER_PALETTE.terracotta
                : isFocused
                  ? JUPITER_PALETTE.amberGold
                  : undefined,
              boxShadow:
                isFocused && !hasError
                  ? `0 0 0 3px ${JUPITER_PALETTE.amberGold}28`
                  : undefined,
            }}
          />

          {/* Botón para limpiar campo */}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Borrar texto"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faXmark} className="size-3" />
            </button>
          )}

          {/* Stepper para tipo number */}
          {type === 'number' && !disabled && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                aria-label="Disminuir valor"
                className="grid size-6 place-items-center rounded-md border border-line bg-surface/50 text-ink-muted hover:bg-surface hover:text-ink active:scale-95 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faMinus} className="size-2.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStep(1)}
                aria-label="Aumentar valor"
                className="grid size-6 place-items-center rounded-md border border-line bg-surface/50 text-ink-muted hover:bg-surface hover:text-ink active:scale-95 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} className="size-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
)

