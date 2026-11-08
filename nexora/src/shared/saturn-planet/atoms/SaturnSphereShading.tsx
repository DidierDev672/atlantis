import { SATURN_PALETTE } from '../lib/colors'

/**
 * Átomo: Sombreado Esférico y Terminador 3D de Saturno.
 * Modela la iluminación solar desde el cuadrante superior izquierdo y la sombra profunda
 * nocturna del gigante gaseoso con #4E493F.
 */
export function SaturnSphereShading() {
  return (
    <>
      {/* Sombra de oclusión 3D y terminador */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full select-none"
        style={{
          background: `radial-gradient(circle at 32% 28%, 
            rgba(255, 255, 255, 0.22) 0%, 
            rgba(217, 189, 159, 0.05) 45%, 
            ${SATURN_PALETTE.deepUmber}66 78%, 
            ${SATURN_PALETTE.deepUmber}ee 100%)`,
        }}
      />

      {/* Brillo especular sutil en el hemisferio iluminado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full select-none"
        style={{
          background: `radial-gradient(circle at 25% 22%, 
            ${SATURN_PALETTE.paleCream}77 0%, 
            transparent 48%)`,
        }}
      />
    </>
  )
}

