import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { getPlanetTheme } from '../lib/colors'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertCloseButtonProps {
  onClose: () => void
  variant?: AlertVariant
  planet?: AlertPlanet
  className?: string
  ariaLabel?: string
}

/**
 * Átomo: Botón de descarte/cierre con microinteracción y tinte del planeta
 */
export function AlertCloseButton({
  onClose,
  variant = 'info',
  planet,
  className,
  ariaLabel = 'Cerrar alerta',
}: AlertCloseButtonProps) {
  const theme = getPlanetTheme(variant, planet)

  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={ariaLabel}
      className={cn(
        'group relative -mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition-all duration-200 cursor-pointer',
        'hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        className
      )}
      style={{
        color: theme.iconColor,
      }}
    >
      <span
        className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          backgroundColor: theme.badgeBg,
        }}
      />
      <FontAwesomeIcon icon={faXmark} className="relative z-10 transition-transform duration-200 group-hover:rotate-90" />
    </button>
  )
}
