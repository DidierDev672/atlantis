type SphereShadingProps = {
  px: number;
};

/** Átomo: sombreado que convierte la escena plana en una esfera (brillo arriba-izquierda, borde oscuro). */
export function SphereShading({ px }: SphereShadingProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{
        background:
          'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 38%), radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 52%, rgba(20,6,2,0.55) 82%, rgba(10,3,1,0.85) 100%)',
        boxShadow: `inset ${-px * 0.06}px ${-px * 0.08}px ${px * 0.18}px rgba(0,0,0,0.55)`,
      }}
    />
  );
}
