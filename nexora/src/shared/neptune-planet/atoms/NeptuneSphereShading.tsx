import { NEPTUNE_PALETTE } from '../lib/colors'

/**
 * Átomo: Sombreado Esférico y Terminador 3D de Neptuno.
 * Modela la iluminación solar con brillo especular cian (#89F3FF) y la profunda
 * noche abisal del gigante azul con #212354.
 */
export function NeptuneSphereShading() {
  return (
    <>
      {/* Sombra de oclusión 3D y terminador nocturno */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full select-none"
        style={{
          background: `radial-gradient(circle at 35% 30%, 
            rgba(255, 255, 255, 0.22) 0%, 
            rgba(62, 102, 249, 0.05) 45%, 
            ${NEPTUNE_PALETTE.abyssalNavy}77 75%, 
            ${NEPTUNE_PALETTE.abyssalNavy}ee 100%)`,
        }}
      />

      {/* Brillo especular sutil en el hemisferio iluminado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full select-none"
        style={{
          background: `radial-gradient(circle at 26% 22%, 
            ${NEPTUNE_PALETTE.luminousCyan}77 0%, 
            transparent 46%)`,
        }}
      />
    </>
  )
}

