import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EarthAtmosphereGlow } from '../atoms/EarthAtmosphereGlow'
import { EarthSphereShading } from '../atoms/EarthSphereShading'
import { EarthContinents } from '../atoms/EarthContinents'
import { EarthCloudLayer } from '../atoms/EarthCloudLayer'
import { EarthPolarCaps } from '../atoms/EarthPolarCaps'
import { EARTH_PALETTE } from '../lib/colors'
import { EARTH_SIZE_PX, type EarthPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

interface EarthGlobeProps {
  size?: EarthPlanetSize
  customPx?: number
  animated?: boolean
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: ReactNode
}

/**
 * Molécula: El Globo del Planeta Tierra ensamblado con todas sus capas atómicas:
 * Halo atmosférico -> Continentes en rotación -> Casquetes polares ->
 * Capa de nubes orbital -> Sombreado 3D esférico -> Contenido hijo.
 */
export function EarthGlobe({
  size = 'medium',
  customPx,
  animated = true,
  active = false,
  disabled = false,
  onClick,
  className,
  children,
}: EarthGlobeProps) {
  const px = customPx ?? EARTH_SIZE_PX[size]

  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      whileHover={onClick && !disabled ? { scale: 1.05 } : undefined}
      whileTap={onClick && !disabled ? { scale: 0.96 } : undefined}
      className={cn(
        'relative shrink-0 select-none transition-all duration-300',
        onClick && !disabled ? 'cursor-pointer' : '',
        disabled ? 'opacity-50 grayscale' : '',
        className
      )}
      style={{ width: px, height: px }}
    >
      {/* 1. Halo atmosférico exterior */}
      <EarthAtmosphereGlow px={px} animated={animated} active={active} />

      {/* 2. Cuerpo del planeta esférico */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full shadow-lg"
        style={{
          background: `radial-gradient(circle at 40% 35%, ${EARTH_PALETTE.oceanShallow} 0%, ${EARTH_PALETTE.oceanDeep} 70%, ${EARTH_PALETTE.nightShadow} 100%)`,
          isolation: 'isolate',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        }}
      >
        {/* Masas continentales en rotación */}
        <EarthContinents animated={animated && !disabled} />

        {/* Casquetes polares */}
        <EarthPolarCaps />

        {/* Capa de nubes dinámicas */}
        <EarthCloudLayer animated={animated && !disabled} />

        {/* Sombreado esférico 3D día/noche */}
        <EarthSphereShading px={px} />

        {/* Contenido centrado opcional */}
        {children && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  )
}
