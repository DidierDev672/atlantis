import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { JupiterAtmosphereGlow } from '../atoms/JupiterAtmosphereGlow'
import { JupiterSphereShading } from '../atoms/JupiterSphereShading'
import { JupiterBands } from '../atoms/JupiterBands'
import { JupiterGreatRedSpot } from '../atoms/JupiterGreatRedSpot'
import { JupiterStormEddies } from '../atoms/JupiterStormEddies'
import { JUPITER_PALETTE } from '../lib/colors'
import { JUPITER_SIZE_PX, type JupiterPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

export interface JupiterGlobeProps {
  size?: JupiterPlanetSize
  customPx?: number
  animated?: boolean
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: ReactNode
}

/**
 * Molécula: El Globo del Planeta Júpiter ensamblado con todas sus capas atómicas:
 * Atmósfera áurea -> Bandas convectivas gaseosas -> Gran Mancha Roja -> Remolinos ->
 * Sombreado 3D hiperrealista -> Contenido hijo opcional.
 */
export function JupiterGlobe({
  size = 'medium',
  customPx,
  animated = true,
  active = false,
  disabled = false,
  onClick,
  className,
  children,
}: JupiterGlobeProps) {
  const px = customPx ?? JUPITER_SIZE_PX[size]

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
      {/* 1. Halo atmosférico exterior áureo */}
      <JupiterAtmosphereGlow px={px} animated={animated} active={active} />

      {/* 2. Cuerpo del gigante gaseoso cortado en esfera */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full shadow-lg"
        style={{
          background: `linear-gradient(180deg, ${JUPITER_PALETTE.darkBrown} 0%, ${JUPITER_PALETTE.lightCream} 50%, ${JUPITER_PALETTE.darkBrown} 100%)`,
          isolation: 'isolate',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        }}
      >
        {/* Capa atómica de bandas en convección */}
        <JupiterBands animated={animated && !disabled} />

        {/* Remolinos y vórtices atmosféricos */}
        <JupiterStormEddies animated={animated && !disabled} />

        {/* La Gran Mancha Roja anticiclónica */}
        <JupiterGreatRedSpot animated={animated && !disabled} />

        {/* Sombreado 3D esférico y terminador de sombra */}
        <JupiterSphereShading px={px} />

        {/* Contenido centrado opcional */}
        {children && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  )
}

