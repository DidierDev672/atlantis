import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { NeptuneAtmosphereGlow } from '../atoms/NeptuneAtmosphereGlow'
import { NeptuneSphereShading } from '../atoms/NeptuneSphereShading'
import { NeptuneSupersonicBands } from '../atoms/NeptuneSupersonicBands'
import { NeptuneGreatDarkSpot } from '../atoms/NeptuneGreatDarkSpot'
import { NeptuneScooterClouds } from '../atoms/NeptuneScooterClouds'
import { NEPTUNE_PALETTE } from '../lib/colors'
import { NEPTUNE_SIZE_PX, type NeptunePlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

export interface NeptuneGlobeProps {
  size?: NeptunePlanetSize
  customPx?: number
  animated?: boolean
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: ReactNode
}

/**
 * Molécula: El Globo del Planeta Neptuno ensamblado con arquitectura atómica:
 * - Halo atmosférico azul eléctrico y cian glacial
 * - Globo esférico con bandas supersónicas, Gran Mancha Oscura y cirros "Scooter"
 * - Sombreado 3D hiperrealista y terminador abisal
 * - Efectos de interacción (hover, tap, active focus)
 */
export function NeptuneGlobe({
  size = 'medium',
  customPx,
  animated = true,
  active = false,
  disabled = false,
  onClick,
  className,
  children,
}: NeptuneGlobeProps) {
  const px = customPx ?? NEPTUNE_SIZE_PX[size]

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
      {/* 1. Halo atmosférico exterior */}
      <NeptuneAtmosphereGlow animated={animated && !disabled} />

      {/* 2. Disco esférico de Neptuno */}
      <div
        className="relative z-10 size-full overflow-hidden rounded-full shadow-md"
        style={{
          background: `linear-gradient(135deg, ${NEPTUNE_PALETTE.electricBlue} 0%, ${NEPTUNE_PALETTE.azureVivid} 45%, ${NEPTUNE_PALETTE.abyssalNavy} 100%)`,
          isolation: 'isolate',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          boxShadow: active
            ? `0 0 16px 2px ${NEPTUNE_PALETTE.azureVivid}66`
            : `0 4px 12px -2px rgba(33,35,84,0.45)`,
        }}
      >
        {/* Bandas gaseosas supersónicas */}
        <NeptuneSupersonicBands animated={animated && !disabled} />

        {/* La Gran Mancha Oscura (Great Dark Spot) */}
        <NeptuneGreatDarkSpot animated={animated && !disabled} />

        {/* Cirros de metano y nube rápida "Scooter" */}
        <NeptuneScooterClouds animated={animated && !disabled} />

        {/* Sombreado 3D esférico y terminador nocturno */}
        <NeptuneSphereShading />

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

