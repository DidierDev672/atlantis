import {
  useState,
  useId,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  type TextareaHTMLAttributes,
  type ReactNode,
  type ChangeEvent,
  type FocusEvent,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeUp } from '../../design-tokens/motion'
import { cn } from '../lib/cn'

export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both'

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  /**
   * Etiqueta superior del campo. Vinculada semánticamente mediante htmlFor e id.
   */
  label?: string

  /**
   * Mensaje de error de validación.
   * Cambia el borde a color de peligro (rojo), activa aria-invalid y se muestra debajo.
   */
  error?: string

  /**
   * Texto de ayuda o descripción complementaria debajo del textarea (se oculta si hay un error activo).
   */
  helperText?: string

  /**
   * Alias compatible con helperText para texto o componentes de asistencia.
   */
  hint?: ReactNode

  /**
   * Número de filas de texto visibles por defecto.
   * @default 4
   */
  rows?: number

  /**
   * Si es true, el componente ocupa el 100% del ancho de su contenedor.
   * @default true
   */
  fullWidth?: boolean

  /**
   * Muestra el contador de caracteres en la esquina inferior derecha.
   */
  showCount?: boolean

  /**
   * Comportamiento de redimensionamiento nativo del textarea.
   * @default 'none'
   */
  resize?: TextareaResize

  /**
   * Si es true, el textarea ajusta automáticamente su altura al escribir (auto-grow).
   * @default false
   */
  autoResize?: boolean

  /**
   * Altura mínima en píxeles cuando autoResize está activo.
   * @default 96
   */
  minHeight?: number

  /**
   * Clases adicionales para el contenedor exterior.
   */
  className?: string

  /**
   * Clases adicionales exclusivas para la etiqueta `<label>`.
   */
  labelClassName?: string

  /**
   * Clases adicionales exclusivas para el elemento `<textarea>`.
   */
  textareaClassName?: string
}

const resizeClasses: Record<TextareaResize, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
}

/**
 * Componente Textarea reutilizable, accesible y configurable construido con React,
 * Tailwind CSS y Motion siguiendo las directrices de arquitectura y diseño de agent.md.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      helperText,
      hint,
      rows = 4,
      fullWidth = true,
      showCount = false,
      maxLength,
      resize = 'none',
      autoResize = false,
      minHeight = 96,
      required = false,
      disabled = false,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      className,
      labelClassName,
      textareaClassName,
      id,
      placeholder,
      ...restProps
    },
    ref
  ) {
    const generatedId = useId()
    const fieldId = id ?? generatedId
    const errorId = `${fieldId}-error`
    const helperId = `${fieldId}-helper`

    const innerRef = useRef<HTMLTextAreaElement>(null)
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement)

    // Estados interactivos
    const [isFocused, setIsFocused] = useState(false)
    const [charCount, setCharCount] = useState<number>(() => {
      if (typeof value === 'string') return value.length
      if (typeof defaultValue === 'string') return defaultValue.length
      return 0
    })

    const hasError = Boolean(error && error.trim().length > 0)
    const effectiveHelper = helperText ?? hint

    // Sincronización del contador de caracteres cuando el valor controlado cambia
    useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length)
      }
    }, [value])

    // Auto-ajuste de altura cuando autoResize está habilitado
    const adjustAutoHeight = useCallback(() => {
      if (!autoResize || !innerRef.current) return
      const el = innerRef.current
      el.style.height = 'auto'
      const newHeight = Math.max(el.scrollHeight, minHeight)
      el.style.height = `${newHeight}px`
    }, [autoResize, minHeight])

    useEffect(() => {
      if (autoResize) {
        adjustAutoHeight()
      }
    }, [autoResize, adjustAutoHeight, value])

    const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      if (autoResize) {
        adjustAutoHeight()
      }
      onChange?.(e)
    }

    // Cálculo dinámico de clases para el label según el estado
    const getLabelColorClass = () => {
      if (disabled) return 'text-ink-muted/50 cursor-not-allowed'
      if (hasError) return 'text-danger font-semibold'
      if (isFocused) return 'text-primary font-semibold'
      return 'text-ink font-medium'
    }

    // Proximidad al límite de caracteres para feedback visual preventivo
    const isNearLimit = maxLength != null && charCount >= maxLength * 0.9
    const isAtLimit = maxLength != null && charCount >= maxLength

    const effectiveResizeClass = autoResize ? 'resize-none overflow-hidden' : resizeClasses[resize]

    // Determinación del aria-describedby
    const ariaDescribedBy = hasError ? errorId : effectiveHelper ? helperId : undefined

    return (
      <div
        className={cn(
          'group flex flex-col',
          fullWidth ? 'w-full' : 'w-auto inline-flex',
          className
        )}
      >
        {/* 1. Etiqueta vinculada accesible */}
        {label && (
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor={fieldId}
              className={cn(
                'block text-sm transition-colors duration-200 select-none',
                getLabelColorClass(),
                labelClassName
              )}
            >
              <span>{label}</span>
              {required && (
                <span aria-hidden="true" className="ml-1 text-danger font-bold">
                  *
                </span>
              )}
            </label>

            {!required && !disabled && (
              <span className="text-[11px] font-normal tracking-wide text-ink-muted select-none">
                Opcional
              </span>
            )}
          </div>
        )}

        {/* 2. Campo <textarea> */}
        <div className="relative w-full">
          <textarea
            ref={innerRef}
            id={fieldId}
            rows={rows}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={ariaDescribedBy}
            style={autoResize ? { minHeight: `${minHeight}px` } : undefined}
            className={cn(
              // Tipografía y geometría base
              'w-full rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed text-ink',
              'font-sans bg-panel shadow-xs outline-none',
              // Transiciones fluidas en hover, focus y validación
              'transition-all duration-200 ease-in-out',
              // Placeholder sutil
              'placeholder:text-ink-soft/70 placeholder:font-normal',
              // Redimensionamiento
              effectiveResizeClass,
              // Anillo de enfoque (Focus Ring)
              'focus:ring-2 focus:ring-offset-0 focus:shadow-md',
              // Estados de color y borde: Error vs Normal / Hover / Focus
              hasError
                ? 'border-danger text-ink focus:border-danger focus:ring-danger/20'
                : 'border-line hover:border-ink-soft focus:border-primary focus:ring-primary/20',
              // Estado: Deshabilitado (Disabled)
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-canvas/50 disabled:hover:border-line disabled:shadow-none',
              textareaClassName
            )}
            {...restProps}
          />
        </div>

        {/* 3. Mensaje de error / Ayuda (con animación fadeUp de agent.md) y Contador */}
        <div className="mt-1.5 flex items-start justify-between gap-3 min-h-[1.25rem] px-0.5">
          {/* Contenedor del Mensaje */}
          <div className="flex-1">
            <AnimatePresence initial={false} mode="wait">
              {hasError ? (
                <motion.p
                  key={errorId}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  id={errorId}
                  role="alert"
                  className="flex items-center gap-1.5 text-xs font-medium text-danger"
                >
                  <svg
                    className="size-3.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </motion.p>
              ) : effectiveHelper ? (
                <p id={helperId} className="text-xs text-ink-muted leading-normal">
                  {effectiveHelper}
                </p>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Contador de caracteres opcional */}
          {(showCount || maxLength != null) && (
            <div
              aria-live="polite"
              className={cn(
                'shrink-0 text-right text-xs font-mono transition-colors duration-200 select-none',
                disabled && 'opacity-40',
                isAtLimit
                  ? 'font-bold text-danger'
                  : isNearLimit
                    ? 'font-semibold text-amber-600 dark:text-amber-400'
                    : isFocused
                      ? 'text-primary'
                      : 'text-ink-muted'
              )}
            >
              {maxLength != null ? (
                <span>
                  {charCount}/{maxLength}
                </span>
              ) : (
                <span>{charCount} caracteres</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
