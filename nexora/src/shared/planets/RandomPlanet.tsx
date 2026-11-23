import { Suspense, memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useDeviceResourceProfile } from '../lib/use-device-resource-profile';
import { cn } from '../lib/cn';
import {
  SHARED_PLANETS,
  type PlanetName,
  type PlanetOption,
} from './planets-catalog';

export type { PlanetName, PlanetOption };

function LightweightPlanetOrb({
  planet,
  size,
}: {
  planet: PlanetOption;
  size: number;
}) {
  return (
    <span
      className="relative inline-block rounded-full shadow-2xs"
      style={{
        width: size,
        height: size,
        background: planet.gradient,
      }}
    >
      {planet.hasRing && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-18 rounded-full border"
          style={{
            width: Math.round(size * 1.38),
            height: Math.round(size * 0.42),
            borderColor: planet.ringColor ?? 'rgba(212, 185, 130, 0.65)',
          }}
        />
      )}
    </span>
  );
}

export interface RandomPlanetProps {
  /** Tamaño en píxeles. @default 16 */
  size?: number;
  /** Semilla o identificador opcional para selección determinista estable */
  seed?: string;
  /** Nombre forzado del planeta (si se desea uno específico) */
  planetName?: PlanetName;
  /** Clases CSS adicionales */
  className?: string;
  /** Si debe tener animación de hover / microinteracción */
  interactive?: boolean;
  /** Habilita/deshabilita animaciones continuas GPU del planeta */
  animated?: boolean;
}

/**
 * Componente reutilizable de /shared para renderizar un planeta cósmico
 * optimizado para hardware: en modo estático o ahorro usa un orbe CSS sin blur/bucles.
 */
export const RandomPlanet = memo(function RandomPlanet({
  size = 16,
  seed,
  planetName,
  className,
  interactive = false,
  animated = true,
}: RandomPlanetProps) {
  const {
    policy: { enableAnimations },
  } = useDeviceResourceProfile();
  const prefersReducedMotion = useReducedMotion();

  const effectiveAnimated = Boolean(
    animated && enableAnimations && !prefersReducedMotion
  );

  const selectedPlanet = useMemo(() => {
    try {
      if (planetName) {
        const found = SHARED_PLANETS.find((p) => p.name === planetName);
        if (found) return found;
      }

      if (seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          hash = (hash << 5) - hash + seed.charCodeAt(i);
          hash |= 0;
        }
        const index = Math.abs(hash) % SHARED_PLANETS.length;
        return SHARED_PLANETS[index];
      }

      return SHARED_PLANETS[0];
    } catch {
      return SHARED_PLANETS[0];
    }
  }, [seed, planetName]);

  const content = (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center select-none',
        className
      )}
      style={{ width: size, height: size }}
      title={`Planeta: ${selectedPlanet.name}`}
      aria-label={`Planeta: ${selectedPlanet.name}`}
    >
      {effectiveAnimated ? (
        <Suspense
          fallback={
            <LightweightPlanetOrb planet={selectedPlanet} size={size} />
          }
        >
          {selectedPlanet.render(size, true)}
        </Suspense>
      ) : (
        <LightweightPlanetOrb planet={selectedPlanet} size={size} />
      )}
    </div>
  );

  if (interactive && effectiveAnimated) {
    return (
      <motion.div
        whileHover={{ scale: 1.15, rotate: 6 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
        className="inline-flex shrink-0 items-center justify-center"
      >
        {content}
      </motion.div>
    );
  }

  return content;
});
