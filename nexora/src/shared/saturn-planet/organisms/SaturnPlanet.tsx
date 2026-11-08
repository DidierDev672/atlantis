import {
  forwardRef,
  useId,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../design-tokens/motion'
import { SaturnInputField } from '../molecules/SaturnInputField'
import { SaturnDropdownField } from '../molecules/SaturnDropdownField'
import { SaturnDatePickerField } from '../molecules/SaturnDatePickerField'
import { SaturnCard } from '../molecules/SaturnCard'
import { SaturnForm } from '../molecules/SaturnForm'
import { SaturnGlobe } from '../molecules/SaturnGlobe'
import { SaturnBadge } from '../atoms/SaturnBadge'
import { SATURN_PALETTE } from '../lib/colors'
import type { SaturnPlanetProps } from '../lib/types'
import { cn } from '../../lib/cn'

/**
 * Organismo Maestro: SaturnPlanet
 *
 * Componente polimórfico de alta fidelidad basado en el Planeta Saturno y sus majestuosos anillos.
 *
 * Cumple con los dos pilares fundamentales:
 * 1. Arquitectura Atomic Design:
 *    - Atoms: Halo atmosférico, sombreado esférico, bandas de nubes, hexágono polar, anillos traseros y frontales, insignia
 *    - Molecules: Globo anillado 3D, Input, Dropdown, DatePicker, Card, Form
 *    - Organism: Saturno polimórfico (este componente)
 * 2. Paleta cromática saturniana estricta:
 *    - #6E6660 (Gris pardo cenizo / Anillo exterior A y sombras frías)
 *    - #D3C7AF (Crema amoniacal suave / Bandas claras de nubes)
 *    - #D9BD9F (Arena cálida saturniana / Zona ecuatorial y cuerpo principal)
 *    - #4E493F (Marrón sombra profundo / Sombra del terminador y sombra sobre anillos)
 *    - #D29F37 (Ocre dorado saturniano / Anillo B brillante, corona y foco)
 */
export const SaturnPlanet = forwardRef<
  HTMLInputElement | HTMLButtonElement | HTMLDivElement,
  SaturnPlanetProps
>(function SaturnPlanet(
  {
    customPx,
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
    fullWidth = true,
    options,
    onSubmit,
    submitLabel,
    cardMeta,
    title,
    description,
    children,
    className,
    inputClassName,
  },
  ref
) {
  const autoId = useId()
  const errorId = `${autoId}-error`
  const helperId = `${autoId}-helper`

  // 1. Determinar la variante efectiva si no se especificó explícitamente
  const resolvedVariant =
    variant ??
    (dataType === 'date'
      ? 'date-picker'
      : 'input')

  const hasError = Boolean(error && error.trim().length > 0)

  // 2. Variante: PLANET / ICON / BADGE (Globo independiente o insignia)
  if (
    resolvedVariant === 'planet' ||
    resolvedVariant === 'icon' ||
    (customPx !== undefined && !variant && !label)
  ) {
    return (
      <SaturnGlobe
        size={size}
        customPx={customPx ?? (size === 'tiny' ? 18 : undefined)}
        animated={animated}
        disabled={disabled}
        className={className}
      />
    )
  }

  if (resolvedVariant === 'badge') {
    return (
      <SaturnBadge
        label={label ?? title ?? 'Saturno'}
        active={!disabled}
        className={className}
      />
    )
  }

  // 3. Variante: CARD (Tarjeta / Dashboard con Saturno integrado)
  if (resolvedVariant === 'card') {
    return (
      <SaturnCard
        title={title ?? label}
        description={description ?? helperText}
        cardMeta={cardMeta}
        size={size}
        animated={animated}
        className={className}
      >
        {children}
      </SaturnCard>
    )
  }

  // 4. Variante: FORM (Contenedor de formulario completo)
  if (resolvedVariant === 'form') {
    return (
      <SaturnForm
        title={title ?? label}
        description={description ?? helperText}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
      >
        {children}
      </SaturnForm>
    )
  }

  // 5. Variantes de Campo: INPUT, DROPDOWN, DATE-PICKER
  return (
    <div
      className={cn(
        'group flex flex-col',
        fullWidth ? 'w-full' : 'w-auto inline-flex',
        className
      )}
    >
      {/* Etiqueta superior */}
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor={autoId}
            className={cn(
              'block text-sm font-medium transition-colors select-none font-sans',
              hasError
                ? 'font-semibold'
                : disabled
                  ? 'text-ink-muted/50 cursor-not-allowed'
                  : 'text-ink'
            )}
            style={{
              color: hasError ? SATURN_PALETTE.goldenOchre : undefined,
            }}
          >
            <span>{label}</span>
            {required && (
              <span
                aria-hidden="true"
                className="ml-1 font-bold"
                style={{ color: SATURN_PALETTE.goldenOchre }}
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

      {/* Control interactivo correspondiente */}
      {resolvedVariant === 'dropdown' ? (
        <SaturnDropdownField
          ref={ref as React.ForwardedRef<HTMLButtonElement>}
          id={autoId}
          options={options}
          value={value}
          defaultValue={defaultValue}
          onValueChange={(val) => onValueChange?.(val)}
          placeholder={placeholder}
          disabled={disabled}
          hasError={hasError}
          className={inputClassName}
        />
      ) : resolvedVariant === 'date-picker' || dataType === 'date' ? (
        <SaturnDatePickerField
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          id={autoId}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onValueChange={(val) => onValueChange?.(val)}
          disabled={disabled}
          required={required}
          hasError={hasError}
          inputClassName={inputClassName}
        />
      ) : (
        <SaturnInputField
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

      {/* Mensaje de error animado o texto de ayuda */}
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
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: SATURN_PALETTE.goldenOchre }}
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="size-3.5 shrink-0"
              />
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

SaturnPlanet.displayName = 'SaturnPlanet'

