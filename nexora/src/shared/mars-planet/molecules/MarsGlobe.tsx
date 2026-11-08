import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { MarsAtmosphereGlow } from '../atoms/MarsAtmosphereGlow'
import { MarsSphereShading } from '../atoms/MarsSphereShading'
import { MarsTerrain } from '../atoms/MarsTerrain'
import { MarsDustStorms } from '../atoms/MarsDustStorms'
import { MarsPolarCap } from '../atoms/MarsPolarCap'
import { MARS_PALETTE } from '../lib/colors'
import { MARS_SIZE_PX, type MarsPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

interface MarsGlobeProps {
  size?: MarsPlanetSize
  customPx?: number
  animated?: boolean
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: ReactNode
}

/**
 * Molécula: El Globo del Planeta Marte ensamblado con todas sus capas atómicas:
 * Atmósfera -> Terreno geológico rotatorio -> Casquete polar -> Tormentas de polvo ->
 * Sombreado 3D de esfera -> Contenido hijo opcional.
 */
export function MarsGlobe({
  size = 'medium',
  customPx,
  animated = true,
  active = false,
  disabled = false,
  onClick,
  className,
  children,
}: MarsGlobeProps) {
  const px = customPx ?? MARS_SIZE_PX[size]

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
      <MarsAtmosphereGlow px={px} animated={animated} active={active} />

      {/* 2. Cuerpo del planeta cortado en esfera */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${MARS_PALETTE.rust} 0%, ${MARS_PALETTE.crimson} 55%, ${MARS_PALETTE.deepRed} 100%)`,
          isolation: 'isolate',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        }}
      >
        {/* Capa de terreno en rotación continua */}
        <MarsTerrain animated={animated && !disabled} />

        {/* Casquete polar */}
        <MarsPolarCap />

        {/* Tormentas de polvo atmosféricas */}
        <MarsDustStorms animated={animated && !disabled} />

        {/* Sombreado 3D hiperrealista */}
        <MarsSphereShading px={px} />

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
