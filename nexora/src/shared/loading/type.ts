export type LoadingSize = 'sm' | 'md' | 'lg';

/**
 * - inline:     una fila compacta (dropdowns, listas, botones)
 * - block:      reemplaza el contenido de una zona (tablas, tarjetas)
 * - overlay:    cubre al contenedor padre (debe tener `relative`) y bloquea clics
 * - fullscreen: cubre toda la pantalla
 */

export type LoadingVariant = 'inline' | 'block' | 'overlay' | 'fullscreen';

export interface LoadingProps {
  /**  Controla si el loading esta activo. Por defecto `true` */
  visible?: boolean;
  variant?: LoadingVariant;
  /** Si no es indica, se elige segun la variante.  */
  size?: LoadingSize;
  label?: string;
  description?: string;
  /** ms de espera antes de mostrarse (evita parpadeos en carga rapidos) */
  delay?: number;
  /** ms minimos visible una vez mostrado (evita que desaperezca al instante) */
  minDuration?: number;
  /** clase extra */
  className?: string;
}
