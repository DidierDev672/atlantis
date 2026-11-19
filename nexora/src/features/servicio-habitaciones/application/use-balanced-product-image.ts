import { useCallback, useEffect, useState } from 'react'
import {
  getCachedImageUrl,
  loadBalancedImage,
} from '../infrastructure/image-load-balancer'

const DEFAULT_FALLBACK_PRODUCT_IMG =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'

/**
 * Hook de aplicación compartido para cargar de forma asíncrona la imagen optimizada
 * (`<=maxDimension` px blob) de un producto o avatar de categoría, con caché LRU y `try/catch`.
 */
export function useBalancedProductImage(
  primaryUrl: string,
  fallbackUrl: string = DEFAULT_FALLBACK_PRODUCT_IMG,
  maxDimension: number = 640
) {
  const [loadedState, setLoadedState] = useState<{
    sourceKey: string
    resolvedUrl: string
  } | null>(() => {
    const cached = getCachedImageUrl(primaryUrl, maxDimension)
    return cached ? { sourceKey: primaryUrl, resolvedUrl: cached } : null
  })

  useEffect(() => {
    if (!primaryUrl || getCachedImageUrl(primaryUrl, maxDimension)) return

    let active = true

    const cargarImagenAsincrona = async () => {
      try {
        const result = await loadBalancedImage(primaryUrl, {
          fallbackUrl,
          maxDimension,
        })
        if (!active) return
        setLoadedState({
          sourceKey: primaryUrl,
          resolvedUrl: result.resolvedUrl,
        })
      } catch {
        if (!active) return
        setLoadedState({
          sourceKey: primaryUrl,
          resolvedUrl: fallbackUrl,
        })
      }
    }

    void cargarImagenAsincrona()

    return () => {
      active = false
    }
  }, [primaryUrl, fallbackUrl, maxDimension])

  const cachedUrl = getCachedImageUrl(primaryUrl, maxDimension)
  const isImageReady = Boolean(cachedUrl) || loadedState?.sourceKey === primaryUrl
  const activeSrc =
    cachedUrl ??
    (loadedState?.sourceKey === primaryUrl ? loadedState.resolvedUrl : null)

  const handleImageError = useCallback(() => {
    if (activeSrc && activeSrc !== fallbackUrl) {
      setLoadedState({
        sourceKey: primaryUrl,
        resolvedUrl: fallbackUrl,
      })
    }
  }, [activeSrc, fallbackUrl, primaryUrl])

  return {
    activeSrc,
    isImageReady,
    handleImageError,
    fallbackUrl,
  }
}
