import { memo, useSyncExternalStore } from 'react'
import {
  getImageLoadBalancerSnapshot,
  subscribeImageLoadBalancer,
} from '../../infrastructure/image-load-balancer'
import { Loading, useDelayVisibility } from '../../../../shared/loading'

export interface ImageBalancerStatusBannerProps {
  suppressed?: boolean
}

/**
 * Molécula aislada para mostrar el estado del balanceador de imágenes.
 * Encapsula `useSyncExternalStore` para evitar que cada `emitSnapshot()`
 * re-renderice `ItemMenuProductosMasonry` y todas las tarjetas del catálogo.
 */
export const ImageBalancerStatusBanner = memo(
  function ImageBalancerStatusBanner({
    suppressed = false,
  }: ImageBalancerStatusBannerProps) {
    const imageBalancer = useSyncExternalStore(
      subscribeImageLoadBalancer,
      getImageLoadBalancerSnapshot
    )

    const visible = useDelayVisibility(
      imageBalancer.isRunning && !suppressed,
      { delay: 0, minDuration: 350 }
    )

    if (!visible) return null

    return (
      <div className="border-line bg-panel flex items-center justify-center rounded-2xl border px-4 py-1.5 shadow-2xs">
        <Loading
          visible={true}
          variant="inline"
          size="sm"
          label={`Balanceando carga de imágenes (${imageBalancer.activeCount} activas · ${imageBalancer.queuedCount} en cola)…`}
          delay={0}
          minDuration={350}
        />
      </div>
    )
  }
)
