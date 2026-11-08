import { URANUS_PALETTE } from '../lib/colors'

/**
 * Átomo: Sombreado Esférico y Terminador 3D de Urano.
 * Modela la iluminación solar glacial con #EAECDF y la sombra profunda del gigante helado con #384555 y #355B6D.
 */
export function UranusSphereShading() {
  return (
    <>
      {/* Sombra de oclusión 3D y terminador */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full select-none"
        style={{
          background: `radial-gradient(circle at 35% 30%, 
            rgba(255, 255, 255, 0.20) 0%, 
            rgba(165, 190, 189, 0.05) 45%, 
            ${URANUS_PALETTE.deepTeal}66 75%, 
            ${URANUS_PALETTE.slateNavy}ee 100%)`,
        }}
      />

      {/* Brillo especular sutil en el hemisferio iluminado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full select-none"
        style={{
          background: `radial-gradient(circle at 26% 22%, 
            ${URANUS_PALETTE.glacialCream}77 0%, 
            transparent 46%)`,
        }}
      />
    </>
  )
}

