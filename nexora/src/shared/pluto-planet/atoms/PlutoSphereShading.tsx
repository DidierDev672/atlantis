import { PLUTO_PALETTE } from '../lib/colors'

/**
 * Átomo: Sombreado Esférico y Terminador 3D de Plutón.
 * Modela la tenue iluminación solar a 40 UA de distancia con brillo glacial #F1F0D7
 * y la profunda noche del Cinturón de Kuiper con #2E1C48 y #403C34.
 */
export function PlutoSphereShading() {
  return (
    <>
      {/* Sombra de oclusión 3D y terminador nocturno */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full select-none"
        style={{
          background: `radial-gradient(circle at 35% 30%, 
            rgba(255, 255, 255, 0.18) 0%, 
            rgba(232, 215, 183, 0.05) 45%, 
            ${PLUTO_PALETTE.tholinUmber}66 75%, 
            ${PLUTO_PALETTE.kuiperViolet}ee 100%)`,
        }}
      />

      {/* Brillo especular sutil en el hemisferio iluminado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full select-none"
        style={{
          background: `radial-gradient(circle at 26% 22%, 
            ${PLUTO_PALETTE.heartGlacier}77 0%, 
            transparent 46%)`,
        }}
      />
    </>
  )
}

