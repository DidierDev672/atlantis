import {
  forwardRef,
  useId,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../design-tokens/motion'
import { JupiterInputField } from '../molecules/JupiterInputField'
import { JupiterDropdownField } from '../molecules/JupiterDropdownField'
import { JupiterDatePickerField } from '../molecules/JupiterDatePickerField'
import { JupiterCard } from '../molecules/JupiterCard'
import { JupiterForm } from '../molecules/JupiterForm'
import { JupiterGlobe } from '../molecules/JupiterGlobe'
import { JupiterBadge } from '../atoms/JupiterBadge'
import { JUPITER_PALETTE } from '../lib/colors'
import type { JupiterPlanetProps } from '../lib/types'
import { cn } from '../../lib/cn'

/**
 * Organismo Maestro: JupiterPlanet
 *
 * Componente polimórfico de alta fidelidad basado en el Planeta Júpiter.
 *
 * Cumple con los dos pilares fundamentales:
 * 1. Arquitectura Atomic Design:
 *    - Atoms: Atmósfera, bandas gaseosas, Gran Mancha Roja, vórtices, sombreado esférico, insignia
 *    - Molecules: Globo interactivo, Input, Dropdown, DatePicker, Card, Form
 *    - Organism: Júpiter polimórfico (este componente)
 * 2. Paleta de colores cromática joviana estricta:
 *    - #82614D (Marrón joviano oscuro / Cinturones ecuatoriales)
 *    - #D3C7AF (Crema amoniacal claro / Zonas brillantes de nubes)
 *    - #8B7A62 (Gris pardo templado / Vórtices y bandas templadas)
 *    - #FEAC4D (Ámbar dorado radiante / Corona atmosférica y foco)
 *    - #D26F37 (Terracota / Gran Mancha Roja y tormentas)
 */
export const JupiterPlanet = forwardRef<
  HTMLInputElement | HTMLButtonElement | HTMLDivElement,
  JupiterPlanetProps
>(function JupiterPlanet(
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
      <JupiterGlobe
        size={size}
        customPx={customPx ?? (size === 'tiny' ? 16 : undefined)}
        animated={animated}
        disabled={disabled}
        className={className}
      />
    )
  }

  if (resolvedVariant === 'badge') {
    return (
      <JupiterBadge
        label={label ?? title ?? 'Júpiter'}
        active={!disabled}
        className={className}
      />
    )
  }

  // 3. Variante: CARD (Tarjeta / Dashboard con Júpiter integrado)
  if (resolvedVariant === 'card') {
    return (
      <JupiterCard
        title={title ?? label}
        description={description ?? helperText}
        cardMeta={cardMeta}
        size={size}
        animated={animated}
        className={className}
      >
        {children}
      </JupiterCard>
    )
  }

  // 4. Variante: FORM (Contenedor de formulario completo)
  if (resolvedVariant === 'form') {
    return (
      <JupiterForm
        title={title ?? label}
        description={description ?? helperText}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
      >
        {children}
      </JupiterForm>
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
              color: hasError ? JUPITER_PALETTE.terracotta : undefined,
            }}
          >
            <span>{label}</span>
            {required && (
              <span
                aria-hidden="true"
                className="ml-1 font-bold"
                style={{ color: JUPITER_PALETTE.terracotta }}
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
        <JupiterDropdownField
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
        <JupiterDatePickerField
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
        <JupiterInputField
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
              style={{ color: JUPITER_PALETTE.terracotta }}
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

JupiterPlanet.displayName = 'JupiterPlanet'

