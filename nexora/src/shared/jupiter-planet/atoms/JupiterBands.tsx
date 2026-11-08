import { motion } from 'motion/react'
import { JUPITER_PALETTE } from '../lib/colors'

export interface JupiterBandsProps {
  animated?: boolean
}

/**
 * Átomo: Bandas de nubes atmosféricas de Júpiter (Cinturones y Zonas).
 * Representa los flujos zonales característicos alternando las 5 tonalidades:
 * #82614D (Cinturones oscuros), #D3C7AF (Zonas de amoníaco), #8B7A62 (Bandas templadas),
 * #FEAC4D (Corrientes áureas) y #D26F37 (Bordes de tormenta).
 */
export function JupiterBands({ animated = true }: JupiterBandsProps) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      {/* Capa de bandas horizontales con animación de desplazamiento continuo (rotación de gas) */}
      <motion.div
        className="absolute inset-0 w-[200%] h-full flex"
        animate={
          animated
            ? {
                x: ['0%', '-50%'],
              }
            : { x: '0%' }
        }
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Gradiente vertical para la atmósfera base de Júpiter */}
            <linearGradient id="jup-bg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={JUPITER_PALETTE.mutedOchre} />
              <stop offset="12%" stopColor={JUPITER_PALETTE.lightCream} />
              <stop offset="26%" stopColor={JUPITER_PALETTE.darkBrown} />
              <stop offset="38%" stopColor={JUPITER_PALETTE.lightCream} />
              <stop offset="48%" stopColor={JUPITER_PALETTE.amberGold} />
              <stop offset="58%" stopColor={JUPITER_PALETTE.lightCream} />
              <stop offset="70%" stopColor={JUPITER_PALETTE.terracotta} />
              <stop offset="84%" stopColor={JUPITER_PALETTE.darkBrown} />
              <stop offset="100%" stopColor={JUPITER_PALETTE.mutedOchre} />
            </linearGradient>
          </defs>

          {/* Fondo base joviano */}
          <rect width="400" height="200" fill="url(#jup-bg)" />

          {/* Banda 1: Región Polar Norte */}
          <path
            d="M 0,16 Q 100,20 200,16 T 400,16 L 400,0 L 0,0 Z"
            fill={JUPITER_PALETTE.darkBrown}
            opacity="0.65"
          />

          {/* Banda 2: Cinturón Templado Norte */}
          <path
            d="M 0,34 Q 80,40 180,36 T 400,34 L 400,50 Q 320,44 220,48 T 0,50 Z"
            fill={JUPITER_PALETTE.mutedOchre}
            opacity="0.8"
          />

          {/* Banda 3: Cinturón Ecuatorial Norte (NEB) - prominente, oscuro y turbulento */}
          <path
            d="M 0,64 Q 60,60 120,66 T 240,62 T 400,64 L 400,84 Q 340,88 260,82 T 120,86 T 0,84 Z"
            fill={JUPITER_PALETTE.darkBrown}
            opacity="0.95"
          />
          {/* Filamentos interiores del NEB */}
          <path
            d="M 0,72 Q 70,68 150,74 T 300,70 T 400,72"
            fill="none"
            stroke={JUPITER_PALETTE.terracotta}
            strokeWidth="3.5"
            opacity="0.75"
          />

          {/* Banda 4: Zona Ecuatorial (EZ) - brillante en tonos crema y ámbar */}
          <path
            d="M 0,94 Q 100,98 200,93 T 400,94"
            fill="none"
            stroke={JUPITER_PALETTE.lightCream}
            strokeWidth="5"
            opacity="0.9"
          />
          <path
            d="M 0,102 Q 80,106 180,100 T 400,102"
            fill="none"
            stroke={JUPITER_PALETTE.amberGold}
            strokeWidth="3"
            opacity="0.85"
          />

          {/* Banda 5: Cinturón Ecuatorial Sur (SEB) - alberga la Gran Mancha Roja */}
          <path
            d="M 0,118 Q 70,124 150,118 T 300,122 T 400,118 L 400,142 Q 330,138 230,144 T 0,142 Z"
            fill={JUPITER_PALETTE.darkBrown}
            opacity="0.9"
          />
          <path
            d="M 0,126 Q 90,122 190,128 T 400,126"
            fill="none"
            stroke={JUPITER_PALETTE.terracotta}
            strokeWidth="4"
            opacity="0.8"
          />

          {/* Banda 6: Cinturón Templado Sur (STB) */}
          <path
            d="M 0,154 Q 60,150 140,156 T 280,152 T 400,154 L 400,168 Q 340,172 240,166 T 0,168 Z"
            fill={JUPITER_PALETTE.mutedOchre}
            opacity="0.85"
          />
          <path
            d="M 0,160 Q 80,164 180,158 T 400,160"
            fill="none"
            stroke={JUPITER_PALETTE.lightCream}
            strokeWidth="3"
            opacity="0.6"
          />

          {/* Banda 7: Región Polar Sur */}
          <path
            d="M 0,182 Q 100,180 200,184 T 400,182 L 400,200 L 0,200 Z"
            fill={JUPITER_PALETTE.darkBrown}
            opacity="0.75"
          />
        </svg>
      </motion.div>
    </div>
  )
}

