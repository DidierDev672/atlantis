import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

/**
 * - tiny:   32px · para dentro de botones, celdas de calendario o inputs
 * - small:  64px · listas, tarjetas compactas
 * - medium: 112px · tarjetas y selectores de rol (por defecto)
 * - large:  176px · héroes, pantallas de bienvenida
 */
export type PlanetSize = 'tiny' | 'small' | 'medium' | 'large';

/**
 * - bottom: texto centrado debajo del planeta (por defecto)
 * - right:  texto a la derecha (filas de lista, formularios)
 * - inside: texto sobre el planeta (solo medium y large; en los demás cae a `bottom`)
 */

export type LabelPosition = 'bottom' | 'right' | 'inside';

export interface VanusPlanetProps {
  /** Texto principal. Ej.: "Recepcionista", "Huéspedes", "Administrador". */
  label?: string;
  /** Texto secundario bajo el principal. Ej.: "Check-in y check-out". */
  description?: string;
  /** Icono de FontAwesome centrado sobre el planeta. */
  icon?: IconDefinition;
  size?: PlanetSize;
  labelPosition?: LabelPosition;
  /** Anima nubes, lava, bruma y brasas. Por defecto `true`. */
  animated?: boolean;
  /** Estado seleccionado: anillo, halo intenso y marca de verificación. */
  selected?: boolean;
  /** Planeta apagado (gris, sin animación) y sin interacción. */
  disabled?: boolean;
  /** Si se pasa, el componente se vuelve un botón (selector de rol, opción de formulario…). */
  onClick?: () => void;
  className?: string;
  /** Nombre accesible cuando no hay `label` visible. */
  'aria-label'?: string;
}

/** Una nube: posición y tamaño en % dentro de su capa. */
export interface CloudBlob {
  /** Borde izquierdo, en % del ancho del planeta (0-100). */
  x: number;
  /** Ancho, en % del ancho del planeta. */
  w: number;
  /** Posición vertical dentro de la capa, en %. */
  y: number;
  /** Alto, en % de la capa. */
  h: number;
  color: string;
}

export interface CloudLayerConfig {
  /** Posición vertical de la capa, en % del planeta. */
  top: number;
  /** Alto de la capa, en % del planeta. */
  height: number;
  /** Segundos que tarda en recorrer una vuelta completa. */
  duration: number;
  opacity: number;
  blobs: CloudBlob[];
}

export interface RiverConfig {
  /** Trazo (coordenadas del viewBox 0 0 200 200). */
  d: string;
  /** Grosor en unidades del viewBox. */
  w: number;
}

export interface EmberConfig {
  left: number;
  bottom: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
}

export interface HazeBandConfig {
  top: number;
  height: number;
  background: string;
  duration: number;
  drift: number;
  delay: number;
}
