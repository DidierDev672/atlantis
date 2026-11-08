import { EARTH_PALETTE } from '../lib/colors'

interface EarthSphereShadingProps {
  px: number
}

/**
 * Átomo: Sombreado e iluminación esférica 3D que modela el terminador día/noche
 * de la Tierra, con luz solar suave y sombra profunda (#0F161D y #172842).
 */
export function EarthSphereShading({ px }: EarthSphereShadingProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 28%, rgba(213,211,196,0.4) 0%, rgba(213,211,196,0) 45%), radial-gradient(circle at 68% 68%, transparent 42%, ${EARTH_PALETTE.nightShadow}88 78%, ${EARTH_PALETTE.nightShadow} 100%)`,
        boxShadow: `inset ${-px * 0.08}px ${-px * 0.09}px ${px * 0.22}px ${EARTH_PALETTE.nightShadow}dd, inset ${px * 0.05}px ${px * 0.05}px ${px * 0.12}px ${EARTH_PALETTE.cloudIce}44`,
      }}
    />
  )
}
