import type { ReactNode } from 'react'
import { getPlanetTheme } from '../lib/colors'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertDescriptionProps {
  children: ReactNode
  variant?: AlertVariant
  planet?: AlertPlanet
  className?: string
}

/**
 * Átomo: Contenedor de descripción/mensaje de la alerta.
 * Diseñado con tipografía adaptable para soportar mensajes cortos, medianos o muy extensos
 * sin romper el layout ni desbordar la interfaz.
 */
export function AlertDescription({
  children,
  variant = 'info',
  planet,
  className,
}: AlertDescriptionProps) {
  const theme = getPlanetTheme(variant, planet)

  return (
    <div
      className={cn(
        'text-xs sm:text-sm leading-relaxed break-words whitespace-pre-line overflow-wrap-anywhere transition-colors duration-200',
        className
      )}
    >
      <div className="dark:hidden" style={{ color: theme.textLight }}>
        {children}
      </div>
      <div className="hidden dark:block" style={{ color: theme.textDark }}>
        {children}
      </div>
    </div>
  )
}
