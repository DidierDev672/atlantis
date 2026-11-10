import { EarthGlobe } from '../../earth-planet'
import { JupiterGlobe } from '../../jupiter-planet'
import { MarsGlobe } from '../../mars-planet'
import { NeptuneGlobe } from '../../neptune-planet'
import { getPlanetTheme } from '../lib/colors'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertPlanetAvatarProps {
  variant?: AlertVariant
  planet?: AlertPlanet
  sizePx?: number
  className?: string
}

/**
 * Molécula: Renderiza el globo planetario auténtico en miniatura
 * (Tierra, Júpiter, Neptuno o Marte) con atmósfera orbital y escala adaptable
 */
export function AlertPlanetAvatar({
  variant = 'info',
  planet,
  sizePx = 34,
  className,
}: AlertPlanetAvatarProps) {
  const theme = getPlanetTheme(variant, planet)
  const resolvedPlanet = theme.planet

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center select-none',
        className
      )}
      style={{
        width: sizePx + 8,
        height: sizePx + 8,
      }}
      aria-hidden="true"
    >
      {/* Resplandor cósmico difuso en el fondo del globo */}
      <div
        className="absolute inset-0 rounded-full blur-[6px] opacity-40 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${theme.iconColor} 0%, transparent 70%)`,
        }}
      />

      {/* Renderizado condicional del globo según el planeta */}
      <div className="relative z-10 flex items-center justify-center">
        {resolvedPlanet === 'earth' && (
          <EarthGlobe customPx={sizePx} animated={true} />
        )}
        {resolvedPlanet === 'jupiter' && (
          <JupiterGlobe customPx={sizePx} animated={true} />
        )}
        {resolvedPlanet === 'neptune' && (
          <NeptuneGlobe customPx={sizePx} animated={true} />
        )}
        {resolvedPlanet === 'mars' && (
          <MarsGlobe customPx={sizePx} animated={true} />
        )}
      </div>
    </div>
  )
}
