/**
 * Configuracion de temas y normalizacion de estados para recepciones y estancias.
 */
export type RecepcionNormalizedEstado =
  | 'progreso'
  | 'cancelada'
  | 'finalizada'
  | 'default';

export interface RecepcionEstadoConfig {
  /** Código HEX oficial solicitado para el estado */
  hex: string;
  /** Color de fondo con opacidad balanceada */
  bg: string;
  /** Color de borde para definición del badge */
  border: string;
  /** Clases Tailwind para el texto con alto contraste accesible (Light / Dark) */
  textClass: string;
  /** Color HEX para el punto de acento */
  dotHex: string;
  /** Clases del punto */
  dotClass: string;
  /** Etiqueta en español para visualización */
  label: string;
}

export const RECEPCION_ESTADO_THEMES: Record<
  RecepcionNormalizedEstado,
  RecepcionEstadoConfig
> = {
  progreso: {
    hex: '#EDCD44',
    bg: 'rgba(237, 205, 68, 0.16)',
    border: 'rgba(237, 205, 68, 0.45)',
    textClass: 'text-[#755d00] dark:text-[#f7e38a]',
    dotHex: '#EDCD44',
    dotClass: 'bg-[#EDCD44]',
    label: 'En progreso',
  },
  cancelada: {
    hex: '#DC3E26',
    bg: 'rgba(220, 62, 38, 0.14)',
    border: 'rgba(220, 62, 38, 0.40)',
    textClass: 'text-[#9c1f0b] dark:text-[#ff7861]',
    dotHex: '#DC3E26',
    dotClass: 'bg-[#DC3E26]',
    label: 'Cancelada',
  },
  finalizada: {
    hex: '#daf6a6',
    bg: 'rgba(218, 246, 166, 0.28)',
    border: 'rgba(154, 214, 69, 0.50)',
    textClass: 'text-[#355403] dark:text-[#d3f595]',
    dotHex: '#7cb518',
    dotClass: 'bg-[#7cb518]',
    label: 'Finalizada',
  },
  default: {
    hex: '#8C8D94',
    bg: 'rgba(140, 141, 148, 0.14)',
    border: 'rgba(140, 141, 148, 0.35)',
    textClass: 'text-ink-muted',
    dotHex: '#8C8D94',
    dotClass: 'bg-[#8C8D94]',
    label: 'Registrada',
  },
};

export function normalizeRecepcionEstado(
  status?: string | null
): RecepcionNormalizedEstado {
  const norm = (status || '').toLowerCase().trim();

  if (
    norm === 'progreso' ||
    norm === 'progress' ||
    norm === 'active' ||
    norm === 'activa' ||
    norm === 'en progreso' ||
    norm === 'en curso'
  ) {
    return 'progreso';
  }

  if (
    norm === 'cancelada' ||
    norm === 'canceled' ||
    norm === 'cancelled' ||
    norm === 'anulada'
  ) {
    return 'cancelada';
  }

  if (
    norm === 'finalizada' ||
    norm === 'completed' ||
    norm === 'checked_out' ||
    norm === 'completada' ||
    norm === 'terminada'
  ) {
    return 'finalizada';
  }

  return 'default';
}

export function getRecepcionEstadoConfig(
  status?: string | null
): RecepcionEstadoConfig {
  const key = normalizeRecepcionEstado(status);
  const config = RECEPCION_ESTADO_THEMES[key];

  if (key === 'default' && status && status.trim()) {
    return {
      ...config,
      label: status.trim(),
    };
  }

  return config;
}
