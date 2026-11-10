import { getPlanetTheme } from '../lib/colors'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertGlowLineProps {
  variant?: AlertVariant
  planet?: AlertPlanet
  position?: 'top' | 'left'
  className?: string
}

/**
 * Átomo: Línea de resplandor atmosférico con el gradiente característico del planeta
 */
export function AlertGlowLine({
  variant = 'info',
  planet,
  position = 'top',
  className,
}: AlertGlowLineProps) {
  const theme = getPlanetTheme(variant, planet)

  if (position === 'left') {
    return (
      <div
        className={cn('pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-2xl', className)}
        style={{
          background: theme.glowGradient,
          boxShadow: `0 0 10px ${theme.border}`,
        }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={cn('pointer-events-none absolute inset-x-0 top-0 h-[2.5px] rounded-t-2xl', className)}
      style={{
        background: theme.glowGradient,
        boxShadow: `0 0 12px ${theme.border}`,
      }}
      aria-hidden="true"
    />
  )
}
