import { motion } from 'framer-motion';

type AtmosphereGlowProps = {
  px: number;
  animated: boolean;
  /** Halo más intenso (planeta seleccionado). */
  strong?: boolean;
};

/** Átomo: halo cálido de la atmósfera alrededor del planeta; "respira" suavemente. */
export function AtmosphereGlow({
  px,
  animated,
  strong = false,
}: AtmosphereGlowProps) {
  const base = strong ? 1 : 0.7;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[14%] rounded-full"
      style={{
        background:
          'radial-gradient(circle, rgba(255,190,70,0) 66%, rgba(255,170,50,0.75) 76%, rgba(255,140,30,0.28) 88%, rgba(255,120,20,0) 100%)',
        filter: `blur(${px * 0.03}px)`,
      }}
      initial={false}
      animate={
        animated
          ? {
              scale: [1, 1.05, 1],
              opacity: [base, Math.min(1, base + 0.25), base],
            }
          : { scale: 1, opacity: base }
      }
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
