import { useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { EarthGlobe } from '../earth-planet';
import { JupiterGlobe } from '../jupiter-planet';
import { MarsGlobe } from '../mars-planet';
import { NeptuneGlobe } from '../neptune-planet';
import { PlutoGlobe } from '../pluto-planet';
import { SaturnGlobe } from '../saturn-planet';
import { UranusGlobe } from '../uranus-planet';
import { VenusGlobe } from '../venus-planet';
import { cn } from '../lib/cn';

export type PlanetName =
  | 'Tierra'
  | 'Marte'
  | 'Júpiter'
  | 'Saturno'
  | 'Urano'
  | 'Neptuno'
  | 'Plutón'
  | 'Venus';

export interface PlanetOption {
  name: PlanetName;
  render: (sizePx: number) => ReactNode;
}

export const SHARED_PLANETS: PlanetOption[] = [
  {
    name: 'Tierra',
    render: (px) => <EarthGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Marte',
    render: (px) => <MarsGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Júpiter',
    render: (px) => <JupiterGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Saturno',
    render: (px) => <SaturnGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Urano',
    render: (px) => <UranusGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Neptuno',
    render: (px) => <NeptuneGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Plutón',
    render: (px) => <PlutoGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Venus',
    render: (px) => (
      <div
        className="flex items-center justify-center overflow-visible"
        style={{ width: px, height: px }}
      >
        <div style={{ transform: `scale(${px / 32})`, transformOrigin: 'center' }}>
          <VenusGlobe size="tiny" animated={true} />
        </div>
      </div>
    ),
  },
];

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
}

/**
 * Componente reutilizable de /shared para renderizar un planeta cósmico
 * seleccionado aleatoria o determinísticamente entre los 8 mundos disponibles.
 */
export function RandomPlanet({
  size = 16,
  seed,
  planetName,
  className,
  interactive = false,
}: RandomPlanetProps) {
  const selectedPlanet = useMemo(() => {
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

    // Selección aleatoria estable por instancia/montaje
    const randomIndex = Math.floor(Math.random() * SHARED_PLANETS.length);
    return SHARED_PLANETS[randomIndex];
  }, [seed, planetName]);

  const content = (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center select-none',
        className
      )}
      style={{ width: size, height: size }}
      title={`Planeta: ${selectedPlanet.name}`}
      aria-label={`Planeta: ${selectedPlanet.name}`}
    >
      {selectedPlanet.render(size)}
    </div>
  );

  if (interactive) {
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
}

