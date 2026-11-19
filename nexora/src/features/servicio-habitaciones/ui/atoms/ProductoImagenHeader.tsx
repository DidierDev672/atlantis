import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import {
  type ItemMenuProducto,
  resolverImagenProducto,
} from '../../domain/item-menu'
import {
  isImageCached,
  loadBalancedImage,
} from '../../infrastructure/image-load-balancer'
import { Loading } from '../../../../shared/loading'

const FALLBACK_PRODUCT_IMG =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'

export interface ProductoImagenHeaderProps {
  producto: ItemMenuProducto
}

/**
 * Átomo visual de cabecera para la card de producto:
 * muestra la fotografía del platillo usando el balanceador de cargas
 * (`image-load-balancer.ts`) y `/shared/loading` mientras se descarga.
 */
export function ProductoImagenHeader({ producto }: ProductoImagenHeaderProps) {
  const primaryUrl = resolverImagenProducto(producto)

  const [loadedState, setLoadedState] = useState<{
    sourceKey: string
    resolvedUrl: string
  } | null>(() =>
    isImageCached(primaryUrl)
      ? { sourceKey: primaryUrl, resolvedUrl: primaryUrl }
      : null
  )

  useEffect(() => {
    if (isImageCached(primaryUrl)) return

    let active = true
    void loadBalancedImage(primaryUrl, {
      fallbackUrl: FALLBACK_PRODUCT_IMG,
    }).then((result) => {
      if (!active) return
      setLoadedState({
        sourceKey: primaryUrl,
        resolvedUrl: result.resolvedUrl,
      })
    })

    return () => {
      active = false
    }
  }, [primaryUrl])

  const cachedReady = isImageCached(primaryUrl)
  const isImageReady = cachedReady || loadedState?.sourceKey === primaryUrl
  const activeSrc = cachedReady
    ? primaryUrl
    : loadedState?.sourceKey === primaryUrl
      ? loadedState.resolvedUrl
      : null

  return (
    <div className="bg-canvas relative h-44 w-full overflow-hidden">
      <Loading
        visible={!isImageReady}
        variant="overlay"
        size="sm"
        label="Cargando imagen…"
        delay={0}
        minDuration={250}
      />

      {activeSrc && (
        <img
          src={activeSrc}
          alt={producto.name}
          loading="lazy"
          onError={() => {
            if (activeSrc !== FALLBACK_PRODUCT_IMG) {
              setLoadedState({
                sourceKey: primaryUrl,
                resolvedUrl: FALLBACK_PRODUCT_IMG,
              })
            }
          }}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      )}

      <span
        title="Ver detalle completo"
        className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-black/45 text-white/90 backdrop-blur-xs transition-colors group-hover:bg-primary group-hover:text-white"
      >
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3" />
      </span>
    </div>
  )
}
