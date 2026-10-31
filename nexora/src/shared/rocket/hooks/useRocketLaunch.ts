import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_TIMING } from '../lib/config';
import type { RocketPhase, RocketTiming } from '../types';

type Options = {
  timing?: Partial<RocketTiming>;
  countdown?: number;
  autoReset?: boolean;
  loop?: boolean;
  onLaunchStart?: () => void;
  onLiftoff?: () => void;
  onComplete?: () => void;
};

/**
 * Máquina de estados del lanzamiento.
 * Toda la secuencia vive aquí (temporizadores incluidos), así el componente
 * visual solo decide cómo se ve cada fase.
 */

export function useRocketLaunch(options: Options) {
  const [phase, setPhase] = useState<RocketPhase>('idle');
  const [count, setCount] = useState(0);
  /** Sube en cada reinicio: sirve de `key` para que el cohete reaparezca en la plataforma. */
  const [cycle, setCycle] = useState(0);

  const phaseRef = useRef<RocketPhase>('idle');
  const timers = useRef<number[]>([]);
  const launchRef = useRef<() => void>(() => {});

  // Siempre las últimas opciones y callbacks, sincronizados fuera de la fase de render.
  const opts = useRef(options);

  const goTo = useCallback((next: RocketPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const wait = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  /** Vuelve a la plataforma. Sin efecto si ya está en reposo. */
  const reset = useCallback(() => {
    if (phaseRef.current === 'idle') return;
    clearTimers();
    setCount(0);
    setCycle((c) => c + 1);
    goTo('idle');
  }, [clearTimers, goTo]);

  const launch = useCallback(() => {
    if (phaseRef.current !== 'idle') return;

    const timing = { ...DEFAULT_TIMING, ...opts.current.timing };
    const countdown = Math.max(0, Math.floor(opts.current.countdown ?? 0));
    opts.current.onLaunchStart?.();

    const finish = () => {
      goTo('done');
      opts.current.onComplete?.();

      const { autoReset = true, loop = false } = opts.current;
      if (autoReset || loop) {
        wait(() => {
          reset();
          if (opts.current.loop) wait(() => launchRef.current(), 500);
        }, timing.resetDelayMs);
      }
    };

    const ascend = () => {
      goTo('ascent');
      opts.current.onLiftoff?.();
      wait(finish, timing.ascentMs);
    };

    const ignite = () => {
      goTo('ignition');
      wait(ascend, timing.ignitionMs);
    };

    if (countdown > 0) {
      goTo('countdown');
      setCount(countdown);
      for (let n = countdown - 1; n >= 0; n--) {
        wait(
          () => (n > 0 ? setCount(n) : ignite()),
          (countdown - n) * timing.countStepMs
        );
      }
    } else {
      ignite();
    }
  }, [goTo, reset, wait]);

  // Sincronizar refs fuera de render para cumplir con las reglas de pureza de React
  useEffect(() => {
    opts.current = options;
    launchRef.current = launch;
  });

  // Limpieza al desmontar (y al doble montaje de React StrictMode en desarrollo).
  useEffect(
    () => () => {
      clearTimers();
      phaseRef.current = 'idle';
    },
    [clearTimers]
  );

  return { phase, count, cycle, launch, reset };
}
