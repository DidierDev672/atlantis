import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { UranusAtmosphereGlow } from '../atoms/UranusAtmosphereGlow'
import { UranusSphereShading } from '../atoms/UranusSphereShading'
import { UranusHazeBands } from '../atoms/UranusHazeBands'
import { UranusMethaneClouds } from '../atoms/UranusMethaneClouds'
import { UranusPolarCollar } from '../atoms/UranusPolarCollar'
import { UranusVerticalRings } from '../atoms/UranusVerticalRings'
import { URANUS_PALETTE } from '../lib/colors'
import { URANUS_SIZE_PX, type UranusPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

export interface UranusGlobeProps {
  size?: UranusPlanetSize
  customPx?: number
  animated?: boolean
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: ReactNode
}

/**
 * Molécula: El Globo del Planeta Urano ensamblado con arquitectura atómica:
 * - Capa trasera de los Anillos Verticales (layer="back")
 * - Halo atmosférico cian metánico
 * - Globo esférico con neblina, cirros de metano y collar polar
 * - Capa frontal de los Anillos Verticales (layer="front")
 * - Efectos de interacción (hover, tap, active focus)
 */
export function UranusGlobe({
  size = 'medium',
  customPx,
  animated = true,
  active = false,
  disabled = false,
  onClick,
  className,
  children,
}: UranusGlobeProps) {
  const px = customPx ?? URANUS_SIZE_PX[size]

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
      {/* 1. Sección trasera de los anillos verticales (detrás del globo) */}
      <UranusVerticalRings layer="back" animated={animated && !disabled} />

      {/* 2. Halo atmosférico exterior */}
      <UranusAtmosphereGlow animated={animated && !disabled} />

      {/* 3. Disco esférico de Urano */}
      <div
        className="relative z-10 size-full overflow-hidden rounded-full shadow-md"
        style={{
          background: `linear-gradient(135deg, ${URANUS_PALETTE.frostedMint} 0%, ${URANUS_PALETTE.glacialAqua} 45%, ${URANUS_PALETTE.deepTeal} 100%)`,
          isolation: 'isolate',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          boxShadow: active
            ? `0 0 16px 2px ${URANUS_PALETTE.cyanBlue}66`
            : `0 4px 12px -2px rgba(53,91,109,0.35)`,
        }}
      >
        {/* Bandas convectivas de neblina metánica */}
        <UranusHazeBands animated={animated && !disabled} />

        {/* Cirros de metano de alta velocidad */}
        <UranusMethaneClouds animated={animated && !disabled} />

        {/* Collar Polar brillante */}
        <UranusPolarCollar animated={animated && !disabled} />

        {/* Sombreado 3D esférico y terminador */}
        <UranusSphereShading />

        {/* Contenido centrado opcional */}
        {children && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>

      {/* 4. Sección frontal de los anillos verticales (por delante del globo) */}
      <UranusVerticalRings layer="front" animated={animated && !disabled} />
    </motion.div>
  )
}

