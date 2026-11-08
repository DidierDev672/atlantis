import { EarthGlobe } from './EarthGlobe'
import { EarthBadge } from '../atoms/EarthBadge'
import { EARTH_PALETTE } from '../lib/colors'
import type { EarthPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

interface EarthDashboardWidgetProps {
  label?: string
  value?: string | number
  unit?: string
  badge?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  size?: EarthPlanetSize
  animated?: boolean
  className?: string
}

/**
 * Molécula: Widget interactivo de métricas para Dashboard con el Planeta Tierra en primer plano.
 */
export function EarthDashboardWidget({
  label = 'Métrica Global',
  value = 0,
  unit,
  badge,
  trend,
  size = 'medium',
  animated = true,
  className,
}: EarthDashboardWidgetProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line bg-panel p-5 shadow-xs transition-all duration-300 hover:shadow-md',
        'flex items-center justify-between gap-4',
        className
      )}
      style={{
        background: `radial-gradient(circle at 90% 10%, rgba(84,109,147,0.08) 0%, transparent 60%)`,
      }}
    >
      {/* Contenido izquierdo: Títulos, Valor y Tendencia */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted truncate">
            {label}
          </span>
          {badge && <EarthBadge label={badge} active />}
        </div>

        {/* Valor Numérico / Texto */}
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-2xl font-bold tracking-tight font-sans truncate"
            style={{ color: EARTH_PALETTE.oceanDeep }}
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

      {/* Globo Terrestre animado a la derecha */}
      <EarthGlobe
        size={size}
        animated={animated}
        className="shrink-0"
      />
    </div>
  )
}
