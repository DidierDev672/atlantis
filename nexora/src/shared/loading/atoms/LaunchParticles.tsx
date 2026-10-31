import { motion, useReducedMotion } from 'motion/react';
import type { PostStage } from '../type';

interface LaunchParticlesProps {
  stage: PostStage;
}

const PARTICLES = [
  { id: 1, x: -8, delay: 0, size: 6, duration: 0.7 },
  { id: 2, x: 0, delay: 0.15, size: 8, duration: 0.6 },
  { id: 3, x: 8, delay: 0.3, size: 5, duration: 0.8 },
  { id: 4, x: -14, delay: 0.2, size: 7, duration: 0.65 },
  { id: 5, x: 12, delay: 0.35, size: 6, duration: 0.75 },
  { id: 6, x: -4, delay: 0.45, size: 9, duration: 0.55 },
];

/**
 * Átomo: Partículas de propulsión y condensación emitidas por el cohete.
 * Se intensifican durante el despegue ('transmitting') y se disipan al confirmar.
 */
export function LaunchParticles({ stage }: LaunchParticlesProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  const isActive = stage === 'transmitting';
  const isPreparing = stage === 'preparing';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center overflow-visible w-20 h-16"
    >
      {PARTICLES.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `calc(50% + ${particle.x}px)`,
          }}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={
            isActive
              ? {
                  opacity: [0, 0.85, 0.4, 0],
                  y: [0, 24, 48],
                  scale: [0.6, 1.2, 1.8],
                  backgroundColor: [
                    '#fef08a', // amarillo núcleo
                    '#f97316', // naranja propulsión
                    '#d4c7b7', // humo/condensación acorde a tokens
                  ],
                }
              : isPreparing
              ? {
                  opacity: [0, 0.4, 0],
                  y: [0, 10],
                  scale: [0.4, 0.9, 1.1],
                  backgroundColor: '#f59e0b',
                }
              : {
                  opacity: 0,
                  y: 0,
                }
          }
          transition={{
            duration: isActive ? particle.duration : 1.2,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
