import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { SaturnAtmosphereGlow } from '../atoms/SaturnAtmosphereGlow'
import { SaturnSphereShading } from '../atoms/SaturnSphereShading'
import { SaturnBands } from '../atoms/SaturnBands'
import { SaturnHexagon } from '../atoms/SaturnHexagon'
import { SaturnRingsBack } from '../atoms/SaturnRingsBack'
import { SaturnRingsFront } from '../atoms/SaturnRingsFront'
import { SATURN_PALETTE } from '../lib/colors'
import { SATURN_SIZE_PX, type SaturnPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

export interface SaturnGlobeProps {
  size?: SaturnPlanetSize
  customPx?: number
  animated?: boolean
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: ReactNode
}

/**
 * Molécula: El Globo del Planeta Saturno ensamblado con arquitectura atómica:
 * - Capa trasera de los Anillos (SaturnRingsBack)
 * - Globo esférico con atmósfera, bandas y hexágono polar norte
 * - Capa delantera de los Anillos (SaturnRingsFront)
 * - Efectos de interacción (hover, tap, active focus)
 */
export function SaturnGlobe({
  size = 'medium',
  customPx,
  animated = true,
  active = false,
  disabled = false,
  onClick,
  className,
  children,
}: SaturnGlobeProps) {
  const px = customPx ?? SATURN_SIZE_PX[size]

  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      whileHover={onClick && !disabled ? { scale: 1.05 } : undefined}
      whileTap={onClick && !disabled ? { scale: 0.96 } : undefined}
      className={cn(
        'relative shrink-0 select-none transition-all duration-300 flex items-center justify-center',
        onClick && !disabled ? 'cursor-pointer' : '',
        disabled ? 'opacity-50 grayscale' : '',
        className
      )}
      style={{
        width: px,
        height: px,
      }}
    >
      {/* 1. Sección trasera de los anillos (detrás del globo) */}
      <SaturnRingsBack animated={animated && !disabled} />

      {/* 2. Halo atmosférico exterior */}
      <SaturnAtmosphereGlow animated={animated && !disabled} />

      {/* 3. Disco esférico de Saturno */}
      <div
        className="relative z-10 size-full overflow-hidden rounded-full shadow-md"
        style={{
          background: `linear-gradient(180deg, ${SATURN_PALETTE.mutedSlate} 0%, ${SATURN_PALETTE.warmSand} 50%, ${SATURN_PALETTE.deepUmber} 100%)`,
          isolation: 'isolate',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          boxShadow: active
            ? `0 0 16px 2px ${SATURN_PALETTE.goldenOchre}66`
            : `0 4px 12px -2px rgba(78,73,63,0.35)`,
        }}
      >
        {/* Capa atómica de bandas gaseosas y sombra de anillos */}
        <SaturnBands animated={animated && !disabled} />

        {/* El Gran Hexágono Polar Norte */}
        <SaturnHexagon animated={animated && !disabled} />

        {/* Sombreado 3D esférico y terminador */}
        <SaturnSphereShading />

        {/* Contenido centrado opcional */}
        {children && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>

      {/* 4. Sección frontal de los anillos (por delante del globo) */}
      <SaturnRingsFront animated={animated && !disabled} />
    </motion.div>
  )
}

