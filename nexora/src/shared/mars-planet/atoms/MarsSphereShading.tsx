import { MARS_PALETTE } from '../lib/colors'

interface MarsSphereShadingProps {
  px: number
}

/**
 * Átomo: Capa de sombreado e iluminación esférica que convierte el relieve plano
 * en una esfera 3D realista con luz estelar cenital y sombra de corteza (#73242A).
 */
export function MarsSphereShading({ px }: MarsSphereShadingProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 28%, rgba(242,208,145,0.4) 0%, rgba(242,208,145,0) 42%), radial-gradient(circle at 65% 65%, transparent 45%, ${MARS_PALETTE.deepRed}88 80%, ${MARS_PALETTE.deepRed} 100%)`,
        boxShadow: `inset ${-px * 0.08}px ${-px * 0.09}px ${px * 0.22}px ${MARS_PALETTE.deepRed}cc, inset ${px * 0.05}px ${px * 0.05}px ${px * 0.12}px ${MARS_PALETTE.sand}44`,
      }}
    />
  )
}
