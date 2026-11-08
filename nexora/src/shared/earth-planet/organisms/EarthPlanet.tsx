import {
  forwardRef,
  useId,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeUp } from '../../../design-tokens/motion'
import { EarthInputField } from '../molecules/EarthInputField'
import { EarthTextareaField } from '../molecules/EarthTextareaField'
import { EarthDatePickerField } from '../molecules/EarthDatePickerField'
import { EarthDashboardWidget } from '../molecules/EarthDashboardWidget'
import { EarthGlobe } from '../molecules/EarthGlobe'
import { EARTH_PALETTE } from '../lib/colors'
import type { EarthPlanetProps } from '../lib/types'
import { cn } from '../../lib/cn'

/**
 * Organismo Maestro: EarthPlanet
 *
 * Componente altamente configurable y adaptable para interfaces de usuario modernas.
 * Regla de oro 1: Paleta estricta [#D5D3C4, #978C67, #546D93, #172842, #0F161D].
 * Regla de oro 2: Adaptable a (Formulario, Dashboard, Input, Date picker, Textarea).
 * Soporta tipos de datos: 'text', 'number', 'date'.
 */
export const EarthPlanet = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLDivElement,
  EarthPlanetProps
>(function EarthPlanet(
  {
    dataType = 'text',
    variant,
    size = 'medium',
    label,
    helperText,
    error,
    value,
    defaultValue,
    onChange,
    onValueChange,
    placeholder,
    animated = true,
    disabled = false,
    required = false,
    rows = 4,
    fullWidth = true,
    dashboardMeta,
    children,
    className,
    inputClassName,
  },
  ref
) {
  const autoId = useId()
  const errorId = `${autoId}-error`
  const helperId = `${autoId}-helper`

  // Determinar la variante efectiva según props
  const resolvedVariant =
    variant ??
    (dataType === 'date'
      ? 'date-picker'
      : 'input')

  const hasError = Boolean(error && error.trim().length > 0)

  // 1. Variante: DASHBOARD (Widget métrico / KPI)
  if (resolvedVariant === 'dashboard') {
    return (
      <EarthDashboardWidget
        label={label}
        value={value ?? defaultValue ?? 0}
        unit={dashboardMeta?.unit}
        badge={dashboardMeta?.badge}
        trend={dashboardMeta?.trend}
        size={size}
        animated={animated}
        className={className}
      />
    )
  }

  // 2. Variante: FORM (Contenedor de formulario con cabecera y atmósfera de la Tierra)
  if (resolvedVariant === 'form') {
    return (
      <div
        className={cn(
          'relative rounded-2xl border border-line bg-panel p-6 shadow-sm',
          fullWidth ? 'w-full' : 'w-auto',
          className
        )}
        style={{
          boxShadow: `0 4px 20px -2px rgba(23,40,66,0.08)`,
        }}
      >
        {/* Encabezado del formulario con el Globo de la Tierra */}
        <div className="flex items-center gap-4 border-b border-line pb-4 mb-5">
          <EarthGlobe size="small" animated={animated} />
          <div>
            {label && (
              <h3
                className="text-base font-bold tracking-tight"
                style={{ color: EARTH_PALETTE.oceanDeep }}
              >
                {label}
              </h3>
            )}
            {helperText && (
              <p className="text-xs text-ink-muted leading-relaxed">
                {helperText}
              </p>
            )}
          </div>
        </div>

        {/* Campos hijos del formulario */}
        <div className="space-y-4">{children}</div>
      </div>
    )
  }

  // 3. Variantes de Entrada: INPUT, TEXTAREA, DATE-PICKER
  return (
    <div
      className={cn(
        'group flex flex-col',
        fullWidth ? 'w-full' : 'w-auto inline-flex',
        className
      )}
    >
      {/* Etiqueta superior vinculada */}
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor={autoId}
            className={cn(
              'block text-sm font-medium transition-colors select-none',
              hasError
                ? 'text-danger font-semibold'
                : disabled
                  ? 'text-ink-muted/50 cursor-not-allowed'
                  : 'text-ink'
            )}
          >
            <span>{label}</span>
            {required && (
              <span
                aria-hidden="true"
                className="ml-1 font-bold text-danger"
              >
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

      {/* Renderizado de la entrada correspondiente */}
      {resolvedVariant === 'textarea' ? (
        <EarthTextareaField
          ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
          id={autoId}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onValueChange={onValueChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          required={required}
          hasError={hasError}
          textareaClassName={inputClassName}
        />
      ) : resolvedVariant === 'date-picker' || dataType === 'date' ? (
        <EarthDatePickerField
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          id={autoId}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onValueChange={onValueChange}
          disabled={disabled}
          required={required}
          hasError={hasError}
          inputClassName={inputClassName}
        />
      ) : (
        <EarthInputField
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          id={autoId}
          type={dataType === 'number' ? 'number' : 'text'}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onValueChange={onValueChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          hasError={hasError}
          inputClassName={inputClassName}
        />
      )}

      {/* Mensaje de error (fadeUp según agent.md) o texto de ayuda */}
      <div className="mt-1.5 min-h-[1.25rem] px-0.5">
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
          ) : helperText ? (
            <p id={helperId} className="text-xs text-ink-muted leading-normal">
              {helperText}
            </p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
})

EarthPlanet.displayName = 'EarthPlanet'
