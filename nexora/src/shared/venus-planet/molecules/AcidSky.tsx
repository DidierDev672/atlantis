import { AcidCloudLayer } from '../atoms/AcidCloudLayer';

import { CLOUD_LAYERS } from '../lib/scenery';

type AcidSkyProps = {
  /** Índices de CLOUD_LAYERS a mostrar. */
  layers: number[];
  px: number;
  animated: boolean;
};

/** Molécula: cielo cubierto por capas densas de nubes amarillas de ácido sulfúrico. */
export function AcidSky({ layers, px, animated }: AcidSkyProps) {
  const blurPx = Math.max(1, px * 0.026);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      {layers.map((index) => (
        <AcidCloudLayer
          key={index}
          layer={CLOUD_LAYERS[index]}
          blurPx={blurPx}
          animated={animated}
        />
      ))}
    </div>
  );
}
