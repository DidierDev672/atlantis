import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '../../lib';

import { AtmosphereGlow } from '../atoms/AtmosphereGlow';
import { SelectedBadge } from '../atoms/SelectedBadge';
import { SphereShading } from '../atoms/SphereShading';

import { DETAIL, GLOBE_VARIANTS, SIZE_PX, SKY_BACKGROUND } from '../lib/config';
import { AcidSky } from '../molecules/AcidSky';
import { EmberField } from '../molecules/EmberField';
import { HeatHaze } from '../molecules/HeatHaze';
import { VenusLandscape } from '../molecules/VenusLandscape';
import type { PlanetSize } from '../lib/types';

type VenusGlobeProps = {
  size: PlanetSize;
  animated: boolean;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  /** Contenido superpuesto sobre el planeta (icono, texto). */
  children?: ReactNode;
};

/**
 * Organismo: el planeta Venus completo (sin texto ni comportamiento de botón).
 *
 * Capas, de atrás hacia adelante:
 * halo atmosférico → cielo de nubes ácidas → paisaje (suelo, lava, rocas)
 * → brasas → bruma de calor → sombreado esférico → contenido.
 */

export function VenusGlobe({
  size,
  animated,
  selected = false,
  disabled = false,
  className,
  children,
}: VenusGlobeProps) {
  const px = SIZE_PX[size];
  const detail = DETAIL[size];

  return (
    <motion.div
      variants={GLOBE_VARIANTS}
      initial="rest"
      className={cn(
        'relative shrink-0 rounded-full transition-[filter,opacity] duration-300',
        selected && 'ring-primary ring-offset-panel ring-2 ring-offset-2',
        disabled && 'opacity-50 grayscale',
        className
      )}
      style={{ width: px, height: px }}
    >
      <AtmosphereGlow px={px} animated={animated} strong={selected} />

      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={
          animated
            ? {
                background: SKY_BACKGROUND,
                isolation: 'isolate',
                // Corrige el recorte circular de capas animadas en Safari.
                WebkitMaskImage: '-webkit-radial-gradient(white, black)',
              }
            : { background: SKY_BACKGROUND }
        }
      >
        <AcidSky layers={detail.cloudLayers} px={px} animated={animated} />
        <VenusLandscape animated={animated} />
        <EmberField count={detail.embers} animated={animated} />
        <HeatHaze bands={detail.hazeBands} px={px} animated={animated} />
        <SphereShading px={px} />
        {children}
      </div>

      <AnimatePresence>{selected && <SelectedBadge px={px} />}</AnimatePresence>
    </motion.div>
  );
}
