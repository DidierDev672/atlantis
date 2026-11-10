import type { ReactNode } from 'react'
import { AlertIcon } from '../atoms/AlertIcon'
import { AlertTitle } from '../atoms/AlertTitle'
import { AlertBadge } from '../atoms/AlertBadge'
import { AlertCloseButton } from '../atoms/AlertCloseButton'
import { AlertPlanetAvatar } from './AlertPlanetAvatar'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertHeaderProps {
  title?: ReactNode
  variant?: AlertVariant
  planet?: AlertPlanet
  showPlanet?: boolean
  planetSizePx?: number
  showBadge?: boolean
  dismissible?: boolean
  onClose?: () => void
  className?: string
}

/**
 * Molécula: Cabecera integral de la alerta, ensambla el avatar del planeta o icono,
 * la insignia del estado cósmico, el título y el botón de cierre.
 */
export function AlertHeader({
  title,
  variant = 'info',
  planet,
  showPlanet = true,
  planetSizePx = 32,
  showBadge = true,
  dismissible = false,
  onClose,
  className,
}: AlertHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Avatar del planeta o icono temático */}
        {showPlanet ? (
          <AlertPlanetAvatar variant={variant} planet={planet} sizePx={planetSizePx} />
        ) : (
          <AlertIcon variant={variant} planet={planet} />
        )}

        {/* Título e insignia */}
        <div className="flex flex-col gap-1 min-w-0 pt-0.5">
          {showBadge && (
            <div className="flex items-center gap-2">
              <AlertBadge variant={variant} planet={planet} />
            </div>
          )}
          {title && (
            <AlertTitle variant={variant} planet={planet}>
              {title}
            </AlertTitle>
          )}
        </div>
      </div>

      {/* Botón de cierre opcional */}
      {dismissible && onClose && (
        <AlertCloseButton variant={variant} planet={planet} onClose={onClose} />
      )}
    </div>
  )
}
