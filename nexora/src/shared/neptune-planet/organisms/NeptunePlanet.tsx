import {
  forwardRef,
  useId,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../design-tokens/motion'
import { NeptuneInputField } from '../molecules/NeptuneInputField'
import { NeptuneDropdownField } from '../molecules/NeptuneDropdownField'
import { NeptuneDatePickerField } from '../molecules/NeptuneDatePickerField'
import { NeptuneCard } from '../molecules/NeptuneCard'
import { NeptuneForm } from '../molecules/NeptuneForm'
import { NeptuneGlobe } from '../molecules/NeptuneGlobe'
import { NeptuneBadge } from '../atoms/NeptuneBadge'
import { NEPTUNE_PALETTE } from '../lib/colors'
import type { NeptunePlanetProps } from '../lib/types'
import { cn } from '../../lib/cn'

/**
 * Organismo Maestro: NeptunePlanet
 *
 * Componente polimórfico de alta fidelidad basado en el Planeta Neptuno (The Windy Blue Giant).
 *
 * Cumple con los dos pilares fundamentales:
 * 1. Arquitectura Atomic Design:
 *    - Atoms: Halo atmosférico, sombreado esférico 3D, bandas supersónicas, Gran Mancha Oscura, cirros "Scooter", insignia
 *    - Molecules: Globo interactivo 3D, Input, Dropdown, DatePicker, Card, Form
 *    - Organism: Neptuno polimórfico (este componente)
 * 2. Paleta cromática neptuniana estricta:
 *    - #212354 (Azul abisal profundo / Sombra del terminador nocturno)
 *    - #3E54E8 (Azul cobalto real / Capas intermedias y cinturones)
 *    - #3E66F9 (Azul celeste intenso / Manto característico y bordes interactivos)
 *    - #6081FF (Azul eléctrico aciano / Resplandor atmosférico y corona)
 *    - #89F3FF (Cian glacial luminoso / Nubes cirro "Scooter" y brillo solar)
 */
export const NeptunePlanet = forwardRef<
  HTMLInputElement | HTMLButtonElement | HTMLDivElement,
  NeptunePlanetProps
>(function NeptunePlanet(
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
      <NeptuneGlobe
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
      <NeptuneBadge
        label={label ?? title ?? 'Neptuno'}
        active={!disabled}
        className={className}
      />
    )
  }

  // 3. Variante: CARD (Tarjeta / Dashboard con Neptuno integrado)
  if (resolvedVariant === 'card') {
    return (
      <NeptuneCard
        title={title ?? label}
        description={description ?? helperText}
        cardMeta={cardMeta}
        size={size}
        animated={animated}
        className={className}
      >
        {children}
      </NeptuneCard>
    )
  }

  // 4. Variante: FORM (Contenedor de formulario completo)
  if (resolvedVariant === 'form') {
    return (
      <NeptuneForm
        title={title ?? label}
        description={description ?? helperText}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
      >
        {children}
      </NeptuneForm>
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
              color: hasError ? NEPTUNE_PALETTE.azureVivid : undefined,
            }}
          >
            <span>{label}</span>
            {required && (
              <span
                aria-hidden="true"
                className="ml-1 font-bold"
                style={{ color: NEPTUNE_PALETTE.azureVivid }}
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
        <NeptuneDropdownField
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
        <NeptuneDatePickerField
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
        <NeptuneInputField
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
              style={{ color: NEPTUNE_PALETTE.azureVivid }}
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

NeptunePlanet.displayName = 'NeptunePlanet'

