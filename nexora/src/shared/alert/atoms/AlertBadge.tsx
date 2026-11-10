import type { ReactNode } from 'react'
import { getPlanetTheme } from '../lib/colors'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertBadgeProps {
  children?: ReactNode
  variant?: AlertVariant
  planet?: AlertPlanet
  className?: string
}

/**
 * Átomo: Insignia / Pill que identifica el planeta cósmico y el nivel de severidad
 */
export function AlertBadge({ children, variant = 'info', planet, className }: AlertBadgeProps) {
  const theme = getPlanetTheme(variant, planet)
  const defaultLabel = `${theme.planetName.toUpperCase()} • ${theme.label.toUpperCase()}`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase select-none transition-colors duration-200',
        className
      )}
      style={{
        backgroundColor: theme.badgeBg,
        color: theme.badgeText,
        border: `1px solid ${theme.badgeBorder}`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: theme.iconColor }}
      />
      {children ?? defaultLabel}
    </span>
  )
}
