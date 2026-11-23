import { motion, useReducedMotion } from 'framer-motion';
import { useDeviceResourceProfile } from '../../lib/use-device-resource-profile';

import { OrbitingSatellite } from '../atoms/mitades/OrbitingSatellite';
import { SaturnPlanet } from '../atoms/SaturnPlanet';
import { TwinkleStar } from '../atoms/elíptica/TwinkleStar';
import { SIZE_PX } from '../lib/sizes';
import type { LoadingSize } from '../type';

type SaturnLoaderProps = {
  size: LoadingSize;
};

const STARS = [
  { position: { top: '2%', left: '6%' }, scale: 0.12, delay: 0 },
  { position: { top: '14%', right: '0%' }, scale: 0.09, delay: 0.7 },
  { position: { bottom: '4%', left: '16%' }, scale: 0.1, delay: 1.3 },
] as const;

/**
 * Molécula: planeta + satélite + estrellas.
 * Respeta `prefers-reduced-motion`: sin movimiento, queda la imagen estática.
 */

export function SaturnLoader({ size }: SaturnLoaderProps) {
  const box = SIZE_PX[size];
  const reduced = useReducedMotion() ?? false;
  const {
    policy: { enableAnimations },
  } = useDeviceResourceProfile();
  const animated = !reduced && enableAnimations;
  const showStars = box >= 48; // en tamaño `sm` las estrellas solo meten ruido

  return (
    <div
      aria-hidden="true"
      className="relative shrink-0"
      style={{ width: box, height: box }}
    >
      {showStars &&
        STARS.map((star, i) => (
          <TwinkleStar
            key={i}
            position={star.position}
            size={Math.max(6, box * star.scale)}
            delay={star.delay}
            animated={animated}
          />
        ))}

      <motion.div
        className="size-full"
        animate={animated ? { y: [0, -box * 0.04, 0] } : { y: 0 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SaturnPlanet />
      </motion.div>

      <OrbitingSatellite box={box} animated={animated} />
    </div>
  );
}
