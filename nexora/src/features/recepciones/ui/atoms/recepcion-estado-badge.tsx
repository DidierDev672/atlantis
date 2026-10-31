/**
 * ============================================================================
 * ARCHIVO REUTILIZABLE: GESTOR DE ESTADOS PARA RECEPCIONES Y ESTANCIAS
 * ============================================================================
 * 
 * 📌 ¿CÓMO FUNCIONA ESTE ARCHIVO REUTILIZABLE?
 * ----------------------------------------------------------------------------
 * 1. Centralización (Single Source of Truth):
 *    Este módulo es el único punto de configuración para los estados de las
 *    recepciones y estancias en Nexora. Al cambiar un color o regla aquí, se
 *    actualiza automáticamente en tablas, tarjetas y modales.
 * 
 * 2. Paleta cromática oficial implementada:
 *    - Progreso   -> #EDCD44 (Tono dorado/ámbar cálido para ocupación activa)
 *    - Cancelada  -> #DC3E26 (Tono rojo bermellón de alta visibilidad para cancelaciones)
 *    - Finalizada -> #daf6a6 (Tono verde lima pastel para estancias concluidas)
 * 
 * 3. Normalización de estados (`normalizeRecepcionEstado`):
 *    El backend o las APIs externas pueden responder con variantes en inglés o
 *    español ("progress", "progreso", "active", "completed", "finalizada",
 *    "checked_out", "canceled", "cancelada"). Esta función limpia espacios,
 *    convierte a minúsculas y clasifica el valor en una de las 4 claves canónicas:
 *    'progreso' | 'cancelada' | 'finalizada' | 'default'.
 * 
 * 4. Contraste y Accesibilidad (WCAG AA/AAA):
 *    Los colores hexadecimales asignados (#EDCD44, #DC3E26, #daf6a6) se utilizan
 *    para bordes, fondos translúcidos y puntos indicadores. Para los textos, se
 *    calculan tonos con el contraste óptimo tanto en modo claro como en modo
 *    oscuro, asegurando que el contenido sea 100% legible y amigable a la vista.
 * 
 * 5. Doble forma de consumo:
 *    a) Componente React: `<RecepcionEstadoBadge status={stay.status} />`
 *       Para renderizar el badge visual con animación y microinteracción.
 *    b) Función pura: `getRecepcionEstadoConfig(status)`
 *       Para obtener el objeto de estilos { hex, bg, border, textClass, label }
 *       cuando se requiera usar en gráficos, estilos inline o exportaciones.
 * ============================================================================
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
  /** Clases del punto (ej. animate-pulse para estados activos) */
  dotClass: string;
  /** Etiqueta en español para visualización */
  label: string;
}

/**
 * Mapeo de estilos y colores por estado normalizado.
 * Implementa estrictamente los colores solicitados:
 * - Progreso:   #EDCD44
 * - Cancelada:  #DC3E26
 * - Finalizada: #daf6a6
 */
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
    dotClass: 'bg-[#EDCD44] animate-pulse',
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

/**
 * Normaliza cualquier variante de estado recibida desde la API o interfaz
 * hacia una clave canónica del sistema.
 *
 * @param status Valor original del estado (ej. "progress", "active", "finalizada", etc.)
 * @returns Clave canónica normalizada
 */
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

/**
 * Retorna la configuración completa de estilos y labels para un estado dado.
 *
 * @param status Estado en string (puede ser nulo o indefinido)
 * @returns Objeto RecepcionEstadoConfig con colores hex, clases y etiqueta
 */
export function getRecepcionEstadoConfig(
  status?: string | null
): RecepcionEstadoConfig {
  const key = normalizeRecepcionEstado(status);
  const config = RECEPCION_ESTADO_THEMES[key];

  // Si el estado original no es conocido pero existe texto, conservamos su etiqueta
  if (key === 'default' && status && status.trim()) {
    return {
      ...config,
      label: status.trim(),
    };
  }

  return config;
}

export interface RecepcionEstadoBadgeProps {
  /** Estado de la estancia (ej. "progress", "completed", "canceled") */
  status?: string | null;
  /** Sobrescribir etiqueta opcionalmente */
  label?: string;
  /** Tamaño del badge: 'sm' (predeterminado) o 'md' */
  size?: 'sm' | 'md';
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente atómico reutilizable para mostrar el estado de una recepción/estancia
 * con los colores oficiales de Nexora:
 * - Progreso:   #EDCD44
 * - Cancelada:  #DC3E26
 * - Finalizada: #daf6a6
 */
export function RecepcionEstadoBadge({
  status,
  label,
  size = 'sm',
  className = '',
}: RecepcionEstadoBadgeProps) {
  const config = getRecepcionEstadoConfig(status);
  const displayLabel = label || config.label;
  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-0.5 text-xs gap-1.5' : 'px-3 py-1 text-xs gap-2';

  return (
    <span
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
      className={`inline-flex items-center rounded-full border font-semibold shadow-2xs select-none transition-colors ${sizeClasses} ${config.textClass} ${className}`}
    >
      <span
        style={{ backgroundColor: config.dotHex }}
        className={`size-1.5 rounded-full ${config.dotClass}`}
        aria-hidden="true"
      />
      <span className="leading-none">{displayLabel}</span>
    </span>
  );
}

