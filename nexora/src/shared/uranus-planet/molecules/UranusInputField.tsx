import {
  type ChangeEvent,
  useState,
  useId,
  forwardRef,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMinus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { UranusGlobe } from './UranusGlobe'
import { URANUS_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface UranusInputFieldProps {
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
 * Molécula: Campo de entrada de Texto o Número con temática uraniana y globo reactivo con anillos verticales.
 */
export const UranusInputField = forwardRef<HTMLInputElement, UranusInputFieldProps>(
  function UranusInputField(
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
      <div className={cn('relative flex items-center gap-3.5', className)}>
        {/* Globo de Urano reactivo al foco */}
        <UranusGlobe
          size="tiny"
          animated={isFocused}
          active={isFocused}
          disabled={disabled}
        />

        {/* Input con bordes y acentos uranianos */}
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
              'font-sans bg-panel text-ink',
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

          {/* Botón de limpieza para inputs de texto */}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              tabIndex={-1}
              aria-label="Limpiar campo"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-1"
            >
              <FontAwesomeIcon icon={faXmark} className="size-3" />
            </button>
          )}

          {/* Controles de incremento / decremento para inputs numéricos */}
          {type === 'number' && !disabled && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="flex size-6 items-center justify-center rounded-lg border border-line bg-canvas text-ink-muted hover:text-ink hover:border-ink-soft transition-colors"
                title="Decrementar"
              >
                <FontAwesomeIcon icon={faMinus} className="size-2.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="flex size-6 items-center justify-center rounded-lg border border-line bg-canvas text-ink-muted hover:text-ink hover:border-ink-soft transition-colors"
                title="Incrementar"
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

UranusInputField.displayName = 'UranusInputField'

