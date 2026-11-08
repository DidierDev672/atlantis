import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { PlutoAtmosphereHaze } from '../atoms/PlutoAtmosphereHaze'
import { PlutoSphereShading } from '../atoms/PlutoSphereShading'
import { PlutoTerrain } from '../atoms/PlutoTerrain'
import { PlutoHeartGlacier } from '../atoms/PlutoHeartGlacier'
import { PlutoCthulhuMacula } from '../atoms/PlutoCthulhuMacula'
import { PLUTO_PALETTE } from '../lib/colors'
import { PLUTO_SIZE_PX, type PlutoPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

export interface PlutoGlobeProps {
  size?: PlutoPlanetSize
  customPx?: number
  animated?: boolean
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: ReactNode
}

/**
 * Molécula: El Globo del Planeta Plutón ensamblado con arquitectura atómica:
 * - Halo de neblina atmosférica azul índigo estratificada (New Horizons)
 * - Globo esférico con terreno de tolinas, Cthulhu Macula y el Glaciar Corazón (Tombaugh Regio)
 * - Sombreado 3D hiperrealista y terminador de Kuiper
 * - Efectos de interacción (hover, tap, active focus)
 */
export function PlutoGlobe({
  size = 'medium',
  customPx,
  animated = true,
  active = false,
  disabled = false,
  onClick,
  className,
  children,
}: PlutoGlobeProps) {
  const px = customPx ?? PLUTO_SIZE_PX[size]

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
      {/* 1. Halo atmosférico exterior de neblina azul estratificada */}
      <PlutoAtmosphereHaze animated={animated && !disabled} />

      {/* 2. Disco esférico de Plutón */}
      <div
        className="relative z-10 size-full overflow-hidden rounded-full shadow-md"
        style={{
          background: `linear-gradient(135deg, ${PLUTO_PALETTE.heartGlacier} 0%, ${PLUTO_PALETTE.nitrogenSand} 35%, ${PLUTO_PALETTE.kuiperViolet} 100%)`,
          isolation: 'isolate',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          boxShadow: active
            ? `0 0 16px 2px ${PLUTO_PALETTE.mysticPurple}66`
            : `0 4px 12px -2px rgba(46,28,72,0.45)`,
        }}
      >
        {/* Terreno de tolinas y cráteres */}
        <PlutoTerrain animated={animated && !disabled} />

        {/* Región oscura de Cthulhu Macula y cordilleras */}
        <PlutoCthulhuMacula animated={animated && !disabled} />

        {/* El famoso Corazón de Plutón (Tombaugh Regio / Sputnik Planitia) */}
        <PlutoHeartGlacier animated={animated && !disabled} />

        {/* Sombreado 3D esférico y terminador nocturno */}
        <PlutoSphereShading />

        {/* Contenido centrado opcional */}
        {children && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  )
}

