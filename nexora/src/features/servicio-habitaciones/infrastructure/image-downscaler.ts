import { revocarBlobUrlSegura } from '../domain/item-menu'

const DEFAULT_MAX_CARD_DIMENSION = 640
const DEFAULT_WEBP_QUALITY = 0.82
const SMALL_RASTER_THRESHOLD_BYTES = 35 * 1024
const PASSTHROUGH_RASTER_MAX_BYTES = 100 * 1024

export interface DownscaleImageOptions {
  /** Dimensión máxima en píxeles (ancho o alto) para la textura en tarjeta. Por defecto 640px. */
  maxDimension?: number
  /** Calidad de compresión WebP/JPEG entre 0 y 1. */
  quality?: number
  /** Timeout máximo de descarga en ms. */
  timeoutMs?: number
}

function calcularTamanoProporcional(
  width: number,
  height: number,
  maxDimension: number
): { targetWidth: number; targetHeight: number } {
  if (width <= 0 || height <= 0) {
    return { targetWidth: maxDimension, targetHeight: maxDimension }
  }

  const maxSide = Math.max(width, height)
  if (maxSide <= maxDimension) {
    return { targetWidth: width, targetHeight: height }
  }

  const ratio = maxDimension / maxSide
  return {
    targetWidth: Math.max(1, Math.round(width * ratio)),
    targetHeight: Math.max(1, Math.round(height * ratio)),
  }
}

async function encodeSurfaceToBlob(
  surface: OffscreenCanvas | HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  try {
    if (typeof OffscreenCanvas !== 'undefined' && surface instanceof OffscreenCanvas) {
      try {
        return await surface.convertToBlob({ type: mimeType, quality })
      } catch {
        if (mimeType !== 'image/jpeg') {
          return await surface.convertToBlob({ type: 'image/jpeg', quality })
        }
        return null
      }
    }

    const htmlCanvas = surface as HTMLCanvasElement
    return await new Promise((resolve) => {
      try {
        htmlCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
              return
            }
            if (mimeType !== 'image/jpeg') {
              htmlCanvas.toBlob((jpegBlob) => resolve(jpegBlob), 'image/jpeg', quality)
              return
            }
            resolve(null)
          },
          mimeType,
          quality
        )
      } catch {
        resolve(null)
      }
    })
  } catch {
    return null
  }
}

async function decodificarViaImage(blob: Blob): Promise<{
  image: HTMLImageElement
  tempUrl: string
} | null> {
  const tempUrl = URL.createObjectURL(blob)
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve({ image: img, tempUrl })
    img.onerror = () => {
      revocarBlobUrlSegura(tempUrl)
      resolve(null)
    }
    img.src = tempUrl
  })
}

/**
 * Descarga de forma asíncrona una imagen remota (Supabase/CDN) o Base64 (`data:image/...`)
 * y la reduce a una textura ligera (`<=640px`) en formato `blob:` WebP/JPEG,
 * evitando que fotos de 4000x3000 px (15 MB / ~48 MB VRAM) o Base64 saturen RAM/VRAM.
 *
 * Retorna `null` si el origen bloquea CORS o falla la decodificación, para caer
 * de forma segura al flujo estándar `<img src>`.
 */
export async function downscaleImageToBlobUrl(
  url: string,
  options: DownscaleImageOptions = {}
): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_CARD_DIMENSION
  const quality = options.quality ?? DEFAULT_WEBP_QUALITY
  const timeoutMs = options.timeoutMs ?? 10000

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  let bitmap: ImageBitmap | null = null
  let tempImgUrl: string | null = null
  let surface: OffscreenCanvas | HTMLCanvasElement | null = null

  try {
    const isDataUrl = url.startsWith('data:')
    const response = await fetch(
      url,
      isDataUrl
        ? { signal: controller.signal }
        : {
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit',
          }
    )

    if (!response.ok) return null

    const sourceBlob = await response.blob()
    if (!sourceBlob || !sourceBlob.type.startsWith('image/')) return null

    if (sourceBlob.type === 'image/svg+xml') {
      return URL.createObjectURL(sourceBlob)
    }

    if (!isDataUrl && sourceBlob.size <= SMALL_RASTER_THRESHOLD_BYTES) {
      return URL.createObjectURL(sourceBlob)
    }

    let source: CanvasImageSource
    let srcWidth = 0
    let srcHeight = 0

    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(sourceBlob)
        source = bitmap
        srcWidth = bitmap.width
        srcHeight = bitmap.height
      } catch {
        const loaded = await decodificarViaImage(sourceBlob)
        if (!loaded) return null
        source = loaded.image
        tempImgUrl = loaded.tempUrl
        srcWidth = loaded.image.naturalWidth || loaded.image.width
        srcHeight = loaded.image.naturalHeight || loaded.image.height
      }
    } else {
      const loaded = await decodificarViaImage(sourceBlob)
      if (!loaded) return null
      source = loaded.image
      tempImgUrl = loaded.tempUrl
      srcWidth = loaded.image.naturalWidth || loaded.image.width
      srcHeight = loaded.image.naturalHeight || loaded.image.height
    }

    // Si la imagen ya cabe dentro de maxDimension y tiene peso acotado, evita crear canvas y llamar ctx.drawImage
    if (
      !isDataUrl &&
      Math.max(srcWidth, srcHeight) <= maxDimension &&
      sourceBlob.size <= PASSTHROUGH_RASTER_MAX_BYTES
    ) {
      return URL.createObjectURL(sourceBlob)
    }

    const { targetWidth, targetHeight } = calcularTamanoProporcional(
      srcWidth,
      srcHeight,
      maxDimension
    )

    surface =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(targetWidth, targetHeight)
        : document.createElement('canvas')

    if (!(typeof OffscreenCanvas !== 'undefined' && surface instanceof OffscreenCanvas)) {
      surface.width = targetWidth
      surface.height = targetHeight
    }

    const requiresAlpha = sourceBlob.type !== 'image/jpeg'
    const ctx = surface.getContext('2d', { alpha: requiresAlpha }) as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null
    if (!ctx) return null

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = maxDimension <= 200 ? 'low' : 'medium'
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

    const outputMime =
      sourceBlob.type === 'image/png' ||
      sourceBlob.type === 'image/webp' ||
      sourceBlob.type === 'image/avif'
        ? 'image/webp'
        : 'image/jpeg'

    const optimizedBlob = await encodeSurfaceToBlob(surface, outputMime, quality)
    if (!optimizedBlob) return null

    return URL.createObjectURL(optimizedBlob)
  } catch {
    return null
  } finally {
    window.clearTimeout(timeoutId)
    try {
      bitmap?.close()
    } catch {
      // Ignora si el bitmap ya fue liberado
    }
    revocarBlobUrlSegura(tempImgUrl)
    if (surface) {
      surface.width = 0
      surface.height = 0
    }
  }
}
