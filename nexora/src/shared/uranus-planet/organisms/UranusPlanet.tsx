import {
  forwardRef,
  useId,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../design-tokens/motion'
import { UranusInputField } from '../molecules/UranusInputField'
import { UranusDropdownField } from '../molecules/UranusDropdownField'
import { UranusDatePickerField } from '../molecules/UranusDatePickerField'
import { UranusCard } from '../molecules/UranusCard'
import { UranusForm } from '../molecules/UranusForm'
import { UranusGlobe } from '../molecules/UranusGlobe'
import { UranusBadge } from '../atoms/UranusBadge'
import { URANUS_PALETTE } from '../lib/colors'
import type { UranusPlanetProps } from '../lib/types'
import { cn } from '../../lib/cn'

/**
 * Organismo Maestro: UranusPlanet
 *
 * Componente polimórfico de alta fidelidad basado en el Planeta Urano (El Gigante Inclinado) y sus anillos verticales.
 *
 * Cumple con los dos pilares fundamentales:
 * 1. Arquitectura Atomic Design:
 *    - Atoms: Halo atmosférico, sombreado esférico 3D, bandas de neblina de metano, cirros de hielo, collar polar, anillos verticales, insignia
 *    - Molecules: Globo interactivo 3D con anillos verticales, Input, Dropdown, DatePicker, Card, Form
 *    - Organism: Urano polimórfico (este componente)
 * 2. Paleta cromática uraniana estricta:
 *    - #355B6D (Cian petróleo profundo / Subatmósfera y sombras)
 *    - #218193 (Cian brillante metánico / Acento interactivo y alta atmósfera)
 *    - #79A4A9 (Aguamarina glacial / Zonas templadas y anillos)
 *    - #A5BEBD (Hielo cian suave / Bandas ecuatoriales y dispersión)
 *    - #D1D9CE (Menta escarchada / Collar polar)
 *    - #EAECDF (Crema glacial pálido / Cirros de metano y brillo solar)
 *    - #D0C1AC (Arena mineral / Partículas de polvo de anillos)
 *    - #384555 (Azul pizarra profundo / Terminador nocturno y texto)
 */
export const UranusPlanet = forwardRef<
  HTMLInputElement | HTMLButtonElement | HTMLDivElement,
  UranusPlanetProps
>(function UranusPlanet(
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
      <UranusGlobe
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
      <UranusBadge
        label={label ?? title ?? 'Urano'}
        active={!disabled}
        className={className}
      />
    )
  }

  // 3. Variante: CARD (Tarjeta / Dashboard con Urano integrado)
  if (resolvedVariant === 'card') {
    return (
      <UranusCard
        title={title ?? label}
        description={description ?? helperText}
        cardMeta={cardMeta}
        size={size}
        animated={animated}
        className={className}
      >
        {children}
      </UranusCard>
    )
  }

  // 4. Variante: FORM (Contenedor de formulario completo)
  if (resolvedVariant === 'form') {
    return (
      <UranusForm
        title={title ?? label}
        description={description ?? helperText}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
      >
        {children}
      </UranusForm>
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
              color: hasError ? URANUS_PALETTE.cyanBlue : undefined,
            }}
          >
            <span>{label}</span>
            {required && (
              <span
                aria-hidden="true"
                className="ml-1 font-bold"
                style={{ color: URANUS_PALETTE.cyanBlue }}
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
        <UranusDropdownField
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
        <UranusDatePickerField
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
        <UranusInputField
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
              style={{ color: URANUS_PALETTE.cyanBlue }}
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

UranusPlanet.displayName = 'UranusPlanet'

