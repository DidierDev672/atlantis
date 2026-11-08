import { EARTH_PALETTE } from '../lib/colors'

/**
 * Átomo: Casquetes polares Ártico y Antártico de la Tierra (#D5D3C4).
 */
export function EarthPolarCaps() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Polo Norte (Ártico) */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[55%] h-[16%] rounded-[50%]"
        style={{
          background: `radial-gradient(ellipse at 50% 25%, ${EARTH_PALETTE.cloudIce}ff 0%, ${EARTH_PALETTE.cloudIce}aa 50%, transparent 85%)`,
          filter: 'blur(1.5px)',
        }}
      />

      {/* Polo Sur (Antártida) */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[18%] rounded-[50%]"
        style={{
          background: `radial-gradient(ellipse at 50% 75%, ${EARTH_PALETTE.cloudIce}ff 0%, ${EARTH_PALETTE.cloudIce}aa 55%, transparent 90%)`,
          filter: 'blur(1.5px)',
        }}
      />
    </div>
  )
}
