import { MarsGlobe } from './MarsGlobe'
import { MarsBadge } from '../atoms/MarsBadge'
import { MARS_PALETTE } from '../lib/colors'
import type { MarsPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

interface MarsDashboardWidgetProps {
  label?: string
  value?: string | number
  unit?: string
  badge?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  size?: MarsPlanetSize
  animated?: boolean
  className?: string
}

/**
 * Molécula: Widget interactivo de métricas para Dashboard con el Planeta Marte en primer plano.
 */
export function MarsDashboardWidget({
  label = 'Métrica Marciana',
  value = 0,
  unit,
  badge,
  trend,
  size = 'medium',
  animated = true,
  className,
}: MarsDashboardWidgetProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line bg-panel p-5 shadow-xs transition-all duration-300 hover:shadow-md',
        'flex items-center justify-between gap-4',
        className
      )}
      style={{
        background: `radial-gradient(circle at 90% 10%, rgba(242,147,92,0.06) 0%, transparent 60%)`,
      }}
    >
      {/* Contenido izquierdo: Títulos, Valor y Tendencia */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted truncate">
            {label}
          </span>
          {badge && <MarsBadge label={badge} active />}
        </div>

        {/* Valor Numérico / Texto */}
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-2xl font-bold tracking-tight font-sans truncate"
            style={{ color: MARS_PALETTE.deepRed }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-ink-muted">
              {unit}
            </span>
          )}
        </div>

        {/* Indicador de tendencia opcional */}
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            <span
              className={cn(
                'font-bold',
                trend.direction === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend.direction === 'down'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-ink-muted'
              )}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            </span>
            <span className="text-ink-muted text-[11px]">{trend.label}</span>
          </div>
        )}
      </div>

      {/* Globo Marciano animado a la derecha */}
      <MarsGlobe
        size={size}
        animated={animated}
        className="shrink-0"
      />
    </div>
  )
}
