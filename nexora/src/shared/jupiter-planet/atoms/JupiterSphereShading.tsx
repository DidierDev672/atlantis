import { JUPITER_PALETTE } from '../lib/colors'

export interface JupiterSphereShadingProps {
  px: number
}

/**
 * Átomo: Sombreado e iluminación esférica 3D para el gigante gaseoso.
 * Aplica luz estelar cenital con reflejos en crema (#D3C7AF) y ámbar (#FEAC4D),
 * y sombra de terminador en marrón profundo (#82614D).
 */
export function JupiterSphereShading({ px }: JupiterSphereShadingProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 26%, rgba(254,172,77,0.38) 0%, rgba(211,199,175,0.15) 30%, transparent 55%), radial-gradient(circle at 72% 70%, transparent 42%, ${JUPITER_PALETTE.darkBrown}99 78%, ${JUPITER_PALETTE.darkBrown} 100%)`,
        boxShadow: `inset ${-px * 0.09}px ${-px * 0.1}px ${px * 0.24}px ${JUPITER_PALETTE.darkBrown}ee, inset ${px * 0.05}px ${px * 0.05}px ${px * 0.14}px ${JUPITER_PALETTE.lightCream}55`,
      }}
    />
  )
}

