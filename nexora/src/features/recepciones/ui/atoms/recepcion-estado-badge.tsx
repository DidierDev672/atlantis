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

import {
  getRecepcionEstadoConfig,
  type RecepcionEstadoConfig,
  type RecepcionNormalizedEstado,
} from '../../domain/recepcion-estado-theme';

export type { RecepcionEstadoConfig, RecepcionNormalizedEstado };

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
      className={`inline-flex items-center rounded-full border font-semibold shadow-2xs transition-colors select-none ${sizeClasses} ${config.textClass} ${className}`}
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
