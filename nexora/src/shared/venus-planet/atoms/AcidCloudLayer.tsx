import { motion } from 'framer-motion';

import type { CloudLayerConfig } from '../lib/types';

type AcidCloudLayerProps = {
  layer: CloudLayerConfig;
  /** Desenfoque en px (escala con el tamaño del planeta).  */
  blurPx: number;
  animated: boolean;
};

/**
 * Átomo: una capa de nubes de ácido sulfúrico que deriva en bucle.
 *
 * La capa mide 200% del ancho y repite dos veces el mismo patrón; al desplazarla
 * -50% (un ancho completo del planeta) el final coincide con el inicio y el bucle
 * es continuo. Las nubes son HTML con `blur` CSS: el navegador las rasteriza una vez
 * y solo mueve la capa (más liviano que filtros SVG animados).
 */

export function AcidCloudLayer({
  layer,
  blurPx,
  animated,
}: AcidCloudLayerProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={animated ? 'absolute left-0 will-change-transform' : 'absolute left-0'}
      style={{
        top: `${layer.top}%`,
        height: `${layer.height}%`,
        width: '200%',
        opacity: layer.opacity,
      }}
      animate={animated ? { x: ['0%', '-50%'] } : { x: '0%' }}
      transition={
        animated
          ? {
              duration: layer.duration,
              repeat: Infinity,
              ease: 'linear',
            }
          : { duration: 0 }
      }
    >
      {[0, 50].flatMap((offset) =>
        layer.blobs.map((blob, i) => (
          <span
            key={`${offset}-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${blob.x / 2 + offset}%`,
              width: `${blob.w / 2}%`,
              top: `${blob.y}%`,
              height: `${blob.h}%`,
              background: blob.color,
              filter: animated ? `blur(${blurPx}px)` : undefined,
            }}
          />
        ))
      )}
    </motion.div>
  );
}
