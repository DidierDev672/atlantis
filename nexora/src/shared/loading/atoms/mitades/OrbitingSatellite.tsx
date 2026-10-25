import { useMemo } from 'react';
import { faSatellite } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

import { RING_TILT_DEG } from '../../lib/sizes';

type OrbitingSatelliteProps = {
  /** Tamano en px del loader completo */
  box: number;
  animated: boolean;
};

const STEPS = 16;

/**
 * Átomo: satélite (icono FontAwesome) que recorre una órbita elíptica
 * alineada con el anillo. Al pasar "por detrás" del planeta se atenúa
 * y se hace más pequeño para simular profundidad.
 */

export function OrbitingSatellite({ box, animated }: OrbitingSatelliteProps) {
  const rx = box * 0.5;
  const ry = box * 0.15;
  const planetRadius = box * 0.27;
  const iconSize = Math.max(8, box * 0.16);

  const frames = useMemo(() => {
    const points = Array.from({ length: STEPS + 1 }, (_, i) => {
      const t = (i / STEPS) * Math.PI * 2;
      const x = Math.cos(t) * rx;
      const y = Math.sin(t) * ry;
      const front = y >= 0;
      const hiddenByPlanet = !front && Math.abs(x) < planetRadius;
      return {
        x,
        y,
        scale: front ? 1 : 0.75,
        opacity: hiddenByPlanet ? 0 : front ? 1 : 0.5,
      };
    });
    return {
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      scale: points.map((p) => p.scale),
      opacity: points.map((p) => p.opacity),
    };
  }, [rx, ry, planetRadius]);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ rotate: `${RING_TILT_DEG}deg` }}
    >
      <motion.span
        className="text-ink absolute leading-none"
        style={{ fontSize: iconSize }}
        animate={animated ? frames : { x: rx, y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
      >
        <FontAwesomeIcon icon={faSatellite} />
      </motion.span>
    </span>
  );
}
