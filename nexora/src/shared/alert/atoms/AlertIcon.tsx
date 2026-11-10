import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { PLANET_ICONS } from '../lib/constants'
import { getPlanetTheme } from '../lib/colors'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertIconProps {
  variant?: AlertVariant
  planet?: AlertPlanet
  customIcon?: IconDefinition
  className?: string
}

/**
 * Átomo: Icono de alerta estilizado con la identidad cromática del planeta correspondiente
 */
export function AlertIcon({ variant = 'info', planet, customIcon, className }: AlertIconProps) {
  const theme = getPlanetTheme(variant, planet)
  const icon = customIcon ?? PLANET_ICONS[theme.planet]

  return (
    <div
      className={cn(
        'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-300',
        className
      )}
      style={{
        backgroundColor: theme.iconBg,
        color: theme.iconColor,
        border: `1px solid ${theme.border}`,
      }}
      aria-hidden="true"
    >
      <FontAwesomeIcon icon={icon} className="text-base" />
    </div>
  )
}
