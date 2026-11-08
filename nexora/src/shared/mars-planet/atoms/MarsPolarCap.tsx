import { MARS_PALETTE } from '../lib/colors'

/**
 * Átomo: Casquete polar norte de Marte compuesto de hielo y dióxido de carbono
 * congelado teñido de arena marciana (#F2D091).
 */
export function MarsPolarCap() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[55%] h-[18%] rounded-[50%]"
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${MARS_PALETTE.sand}ee 0%, ${MARS_PALETTE.sand}99 50%, transparent 85%)`,
        filter: 'blur(1.5px)',
      }}
    />
  )
}
