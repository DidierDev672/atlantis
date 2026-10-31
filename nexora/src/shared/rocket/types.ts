/**
 * Fases del lanzamiento:
 * idle → (countdown) → ignition → ascent → done → (autoReset) → idle
 */

export type RocketPhase = 'idle' | 'countdown' | 'ignition' | 'ascent' | 'done';
export type RocketSize = 'sm' | 'md' | 'lg';

/** Intensidad de la llama del motor. */
export type FlameIntensity = 'off' | 'low' | 'medium' | 'high';

export interface RocketTiming {
  /** ms entre cada número de la cuenta regresiva. */
  countStepMs: number;
  /** ms de encendido de motores (vibración + humo) antes de despegar. */
  ignitionMs: number;
  /** ms que dura el ascenso hasta salir del cuadro. */
  ascentMs: number;
  /** ms que espera tras terminar antes de volver a la plataforma. */
  resetDelayMs: number;
}

export interface RocketLabels {
  /** Texto accesible del botón cuando es interactivo. */
  launch: string;
  idle: string;
  countdown: (n: number) => string;
  ignition: string;
  ascent: string;
  done: string;
}

/** Métodos que expone la `ref` del componente. */
export interface RocketHandle {
  launch: () => void;
  reset: () => void;
}

export interface RocketProps {
  /**
   * Modo controlado: al pasar a `true` inicia el despegue; a `false` vuelve a la plataforma.
   * Ideal para dispararlo desde un estado (ej. `success` de un formulario).
   */
  launch?: boolean;
  /** Despega solo al montarse. */
  autoLaunch?: boolean;
  /** Repite el despegue una y otra vez (útil como animación decorativa). */
  loop?: boolean;
  /** Al terminar, vuelve a la plataforma lista para otro despegue. Por defecto `true`. */
  autoReset?: boolean;
  /** Segundos de cuenta regresiva antes del encendido. `0` = sin cuenta regresiva. */
  countdown?: number;
  /** Si es `true` el cohete es un botón: clic o Enter lo lanza. Por defecto `true`. */
  interactive?: boolean;
  size?: RocketSize;
  showStars?: boolean;
  showPad?: boolean;
  timing?: Partial<RocketTiming>;
  labels?: Partial<RocketLabels>;
  onLaunchStart?: () => void;
  /** Se dispara en el instante en que el cohete se despega de la plataforma. */
  onLiftoff?: () => void;
  /** Se dispara cuando el cohete sale del cuadro. */
  onComplete?: () => void;
  className?: string;
}
