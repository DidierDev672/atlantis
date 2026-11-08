import {
  forwardRef,
  useId,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../design-tokens/motion'
import { PlutoInputField } from '../molecules/PlutoInputField'
import { PlutoDropdownField } from '../molecules/PlutoDropdownField'
import { PlutoDatePickerField } from '../molecules/PlutoDatePickerField'
import { PlutoCard } from '../molecules/PlutoCard'
import { PlutoForm } from '../molecules/PlutoForm'
import { PlutoGlobe } from '../molecules/PlutoGlobe'
import { PlutoBadge } from '../atoms/PlutoBadge'
import { PLUTO_PALETTE } from '../lib/colors'
import type { PlutoPlanetProps } from '../lib/types'
import { cn } from '../../lib/cn'

/**
 * Organismo Maestro: PlutoPlanet
 *
 * Componente polimórfico de alta fidelidad basado en el Planeta Enano Plutón (The Heart of the Kuiper Belt).
 *
 * Cumple con los dos pilares fundamentales:
 * 1. Arquitectura Atomic Design:
 *    - Atoms: Neblina azul estratificada, sombreado esférico 3D, terreno de tolinas, Corazón Glaciar (Tombaugh Regio), Cthulhu Macula, insignia
 *    - Molecules: Globo interactivo 3D con su corazón de nitrógeno, Input, Dropdown, DatePicker, Card, Form
 *    - Organism: Plutón polimórfico (este componente)
 * 2. Paleta cromática plutoniana estricta:
 *    - #594588 (Púrpura místico / Neblina y tierras altas)
 *    - #2E1C48 (Violeta profundo de Kuiper / Sombra nocturna y Cthulhu Macula)
 *    - #3A4481 (Índigo de neblina atmosférica / Capas de New Horizons)
 *    - #E8D7B7 (Arena de nitrógeno / Dunas de metano y bordes de cuencas)
 *    - #F1F0D7 (Glaciar Corazón luminoso / Tombaugh Regio y Sputnik Planitia)
 *    - #403C34 (Marrón sombra de tolinas / Montes Hillary y Norgay)
 */
export const PlutoPlanet = forwardRef<
  HTMLInputElement | HTMLButtonElement | HTMLDivElement,
  PlutoPlanetProps
>(function PlutoPlanet(
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
      <PlutoGlobe
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
      <PlutoBadge
        label={label ?? title ?? 'Plutón'}
        active={!disabled}
        className={className}
      />
    )
  }

  // 3. Variante: CARD (Tarjeta / Dashboard con Plutón integrado)
  if (resolvedVariant === 'card') {
    return (
      <PlutoCard
        title={title ?? label}
        description={description ?? helperText}
        cardMeta={cardMeta}
        size={size}
        animated={animated}
        className={className}
      >
        {children}
      </PlutoCard>
    )
  }

  // 4. Variante: FORM (Contenedor de formulario completo)
  if (resolvedVariant === 'form') {
    return (
      <PlutoForm
        title={title ?? label}
        description={description ?? helperText}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
      >
        {children}
      </PlutoForm>
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
              color: hasError ? PLUTO_PALETTE.mysticPurple : undefined,
            }}
          >
            <span>{label}</span>
            {required && (
              <span
                aria-hidden="true"
                className="ml-1 font-bold"
                style={{ color: PLUTO_PALETTE.mysticPurple }}
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
        <PlutoDropdownField
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
        <PlutoDatePickerField
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
        <PlutoInputField
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
              style={{ color: PLUTO_PALETTE.mysticPurple }}
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

PlutoPlanet.displayName = 'PlutoPlanet'

