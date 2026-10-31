import type {
  FlameIntensity,
  RocketLabels,
  RocketPhase,
  RocketSize,
  RocketTiming,
} from '../types';

export const DEFAULT_TIMING: RocketTiming = {
  countStepMs: 900,
  ignitionMs: 1300,
  ascentMs: 2600,
  resetDelayMs: 900,
};

export const DEFAULT_LABELS: RocketLabels = {
  launch: 'Lanzar cohete',
  idle: 'Cohete listo para despegar',
  countdown: (n) => `Despegue en ${n}`,
  ignition: 'Encendiendo motores',
  ascent: 'Despegando',
  done: 'Despegue completado',
};

/** Tamaño del escenario (proporción 2:3). El cohete y los efectos escalan con él. */
export const SIZE_CLASSES: Record<RocketSize, string> = {
  sm: 'h-40 w-28',
  md: 'h-72 w-48',
  lg: 'h-[28rem] w-72',
};

/** La llama crece a medida que avanza el lanzamiento. */
export const FLAME_BY_PHASE: Record<RocketPhase, FlameIntensity> = {
  idle: 'low',
  countdown: 'low',
  ignition: 'medium',
  ascent: 'high',
  done: 'off',
};

export const resolveLabels = (
  labels?: Partial<RocketLabels>
): RocketLabels => ({
  ...DEFAULT_LABELS,
  ...labels,
});
