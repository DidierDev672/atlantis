import type { ReactNode } from 'react'
import { getPlanetTheme } from '../lib/colors'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertTitleProps {
  children: ReactNode
  variant?: AlertVariant
  planet?: AlertPlanet
  className?: string
}

/**
 * Átomo: Título principal de la alerta, con tipografía refinada y acento del planeta
 */
export function AlertTitle({ children, variant = 'info', planet, className }: AlertTitleProps) {
  const theme = getPlanetTheme(variant, planet)

  return (
    <h4
      className={cn(
        'font-medium text-sm sm:text-base leading-tight tracking-tight flex items-center gap-2',
        className
      )}
      style={{
        color: 'var(--alert-title, currentColor)',
      }}
    >
      <span className="dark:hidden" style={{ color: theme.titleLight }}>
        {children}
      </span>
      <span className="hidden dark:inline" style={{ color: theme.titleDark }}>
        {children}
      </span>
    </h4>
  )
}
