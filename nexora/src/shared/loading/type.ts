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

/**
 * Fases de una carga balanceada para peticiones POST:
 * 1. `preparing`: Empaquetado y validación previa del payload.
 * 2. `transmitting`: Despegue del cohete y transmisión activa al endpoint por red.
 * 3. `confirming`: Recepción de la respuesta 2xx y confirmación cognitiva segura.
 */
export type PostStage = 'preparing' | 'transmitting' | 'confirming';

export interface PostStageDetails {
  key: PostStage;
  stepNumber: number;
  label: string;
  title: string;
  description: string;
}

export interface PostPayloadLoaderProps {
  /** Controla si la carga está activa (ej: estado `submitting` de un formulario) */
  visible: boolean;
  /**
   * Disposición visual:
   * - `overlay`: cubre el contenedor relativo padre (ideal para tarjetas de formulario)
   * - `fullscreen`: cubre toda la pantalla (ideal para procesos de checkout o envíos globales)
   * - `block`: contenedor estático en el flujo del documento
   */
  variant?: 'overlay' | 'fullscreen' | 'block';
  /** Nombre o ruta del endpoint a mostrar (ej: "POST /stay", "POST /reservas") */
  endpoint?: string;
  /** Título principal personalizado (opcional; si no se provee, se usa el de la fase) */
  title?: string;
  /** Descripción o mensaje de contexto psicológico (opcional) */
  description?: string;
  /** Resumen o etiqueta del payload a transmitir (ej: "Payload: 5 campos • JSON seguro") */
  payloadSummary?: string;
  /** Forzado manual de fase si el invocador desea coordinarla externamente */
  stage?: PostStage;
  /** Tiempo mínimo garantizado de visualización (por defecto 850ms) */
  minDuration?: number;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
}
