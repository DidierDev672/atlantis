import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { cn } from '../../lib';

import { CountdownBadge } from '../atoms/CountdownBadge';
import { LaunchGlow } from '../atoms/LaunchGlow';
import { useRocketLaunch } from '../hooks/useRocketLaunch';
import { shipAnimation } from '../lib/animations';
import {
  DEFAULT_TIMING,
  FLAME_BY_PHASE,
  SIZE_CLASSES,
  resolveLabels,
} from '../lib/config';
import { LaunchSmoke } from '../molecules/LaunchSmoke';
import { RocketShip } from '../molecules/RocketShip';
import { SpeedLines } from '../molecules/SpeedLines';
import { Starfield } from '../molecules/Starfield';
import type { RocketProps, RocketHandle } from '../types';

/**
 * Organismo: escenario completo del cohete con animación de despegue.
 *
 * Secuencia: reposo (flota) → [cuenta regresiva] → encendido (vibra, humo, llama)
 * → ascenso acelerado con estelas → sale del cuadro → vuelve a la plataforma.
 *
 * Tres formas de dispararlo:
 *  1. Clic / Enter sobre el cohete (`interactive`, por defecto).
 *  2. Prop `launch` (controlado desde un estado).
 *  3. `ref.current.launch()` (imperativo).
 *
 * El escenario recorta lo que sale del cuadro (`overflow-hidden`):
 * dale fondo, borde o forma con `className`.
 */

export const Rocket = forwardRef<RocketHandle, RocketProps>(function Rocket(
  {
    launch: launchProp,
    autoLaunch = false,
    loop = false,
    autoReset = true,
    countdown = 0,
    interactive = true,
    size = 'md',
    showStars = true,
    showPad = true,
    timing,
    labels: labelOverrides,
    onLaunchStart,
    onLiftoff,
    onComplete,
    className,
  },
  ref
) {
  const reduced = useReducedMotion() ?? false;
  const labels = resolveLabels(labelOverrides);
  const ascentMs = timing?.ascentMs ?? DEFAULT_TIMING.ascentMs;

  const { phase, count, cycle, launch, reset } = useRocketLaunch({
    timing,
    countdown,
    autoReset,
    loop,
    onLaunchStart,
    onLiftoff,
    onComplete,
  });

  useImperativeHandle(ref, () => ({ launch, reset }), [launch, reset]);

  useEffect(() => {
    if (autoLaunch || loop) launch();
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (launchProp === undefined) return;
    if (launchProp) launch();
    else reset();
  }, [launchProp, launch, reset]);

  const burning = phase === 'ignition' || phase === 'ascent';

  const status = {
    idle: labels.idle,
    countdown: labels.countdown(count),
    ignition: labels.ignition,
    ascent: labels.ascent,
    done: labels.done,
  }[phase];

  const stage = (
    <div
      data-phase={phase}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        SIZE_CLASSES[size],
        className
      )}
    >
      {showStars && <Starfield animated={!reduced} />}
      <SpeedLines active={phase === 'ascent' && !reduced} />

      {showPad && (
        <div
          aria-hidden="true"
          className="bg-line absolute bottom-[5%] left-1/2 h-1.5 w-[55%] -translate-x-1/2 rounded-full"
        />
      )}

      <LaunchGlow phase={phase} />
      <LaunchSmoke active={burning && !reduced} />

      <div className="absolute inset-x-0 bottom-[8%] flex justify-center">
        <motion.div
          key={cycle}
          className="w-[34%]"
          initial={cycle === 0 ? false : { opacity: 0, y: 16 }}
          animate={shipAnimation(phase, reduced, ascentMs)}
        >
          <RocketShip flame={FLAME_BY_PHASE[phase]} reduced={reduced} />
        </motion.div>
      </div>

      <AnimatePresence>
        {phase === 'countdown' && count > 0 && (
          <CountdownBadge key="countdown" count={count} />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="relative inline-block">
      {interactive ? (
        <button
          type="button"
          aria-label={labels.launch}
          onClick={() => (phase === 'done' ? reset() : launch())}
          className="focus-visible:ring-primary/50 block cursor-pointer rounded-2xl outline-none focus-visible:ring-2"
        >
          {stage}
        </button>
      ) : (
        <div role="img" aria-label={labels.idle}>
          {stage}
        </div>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </div>
  );
});

Rocket.displayName = 'Rocket';
