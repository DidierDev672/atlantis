import { revocarBlobUrlSegura } from '../domain/item-menu'
import {
  detectarPerfilRedDisponible,
  optimizarUrlImagenParaRed,
} from './network-quality'

const DEFAULT_MAX_CARD_DIMENSION = 640
const DEFAULT_WEBP_QUALITY = 0.82
const SMALL_RASTER_THRESHOLD_BYTES = 35 * 1024
const PASSTHROUGH_RASTER_MAX_BYTES = 100 * 1024

// Evita reintentar fetch CORS repetidamente contra orígenes que ya bloquearon CORS
const corsBlockedOrigins = new Set<string>()

export interface DownscaleImageOptions {
  /** Dimensión máxima en píxeles (ancho o alto) para la textura en tarjeta. Por defecto 640px. */
  maxDimension?: number
  /** Calidad de compresión WebP/JPEG entre 0 y 1. */
  quality?: number
  /** Timeout máximo de descarga en ms. */
  timeoutMs?: number
}

export interface DownscaleDiagnosticsResult {
  blobUrl: string | null
  /** URL ya optimizada para el perfil de red actual (CDN resize si aplica) */
  networkUrl: string
  /** True si el servidor respondió error HTTP definitivo (4xx/5xx), evitando doble descarga con <img> */
  httpFailed: boolean
  /** True si el origen bloqueó CORS */
  corsBlocked: boolean
}

function getSafeOrigin(url: string): string | null {
  try {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null
    return new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://localhost').origin
  } catch {
    return null
  }
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
export async function downscaleImageWithDiagnostics(
  url: string,
  options: DownscaleImageOptions = {}
): Promise<DownscaleDiagnosticsResult> {
  const networkProfile = detectarPerfilRedDisponible()
  const requestedDim = options.maxDimension ?? DEFAULT_MAX_CARD_DIMENSION
  const maxDimension =
    requestedDim <= 160
      ? Math.min(requestedDim, networkProfile.thumbnailWidth)
      : Math.min(requestedDim, networkProfile.imageWidth)
  const quality = options.quality ?? Math.min(DEFAULT_WEBP_QUALITY, networkProfile.imageQuality)
  const timeoutMs = options.timeoutMs ?? 10000
  const networkUrl = optimizarUrlImagenParaRed(url, maxDimension)

  if (!url || typeof window === 'undefined') {
    return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: false }
  }

  const isDataUrl = url.startsWith('data:')
  const origin = getSafeOrigin(networkUrl)

  // Si el origen ya falló por CORS antes o la red está en Save-Data/2G con URL externa ya optimizada,
  // evita descarga por fetch + decodificación duplicada y pasa directo a carga única ligera.
  if (!isDataUrl && origin && corsBlockedOrigins.has(origin)) {
    return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: true }
  }
  if (!isDataUrl && networkProfile.preferLightweightImages) {
    return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: false }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  let bitmap: ImageBitmap | null = null
  let tempImgUrl: string | null = null
  let surface: OffscreenCanvas | HTMLCanvasElement | null = null

  try {
    let response: Response
    try {
      response = await fetch(
        networkUrl,
        isDataUrl
          ? { signal: controller.signal }
          : {
              signal: controller.signal,
              mode: 'cors',
              credentials: 'omit',
            }
      )
    } catch (fetchError) {
      if (origin && fetchError instanceof TypeError) {
        corsBlockedOrigins.add(origin)
        return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: true }
      }
      return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: false }
    }

    if (!response.ok) {
      return { blobUrl: null, networkUrl, httpFailed: true, corsBlocked: false }
    }

    const sourceBlob = await response.blob()
    if (!sourceBlob || !sourceBlob.type.startsWith('image/')) {
      return { blobUrl: null, networkUrl, httpFailed: true, corsBlocked: false }
    }

    if (sourceBlob.type === 'image/svg+xml') {
      return {
        blobUrl: URL.createObjectURL(sourceBlob),
        networkUrl,
        httpFailed: false,
        corsBlocked: false,
      }
    }

    if (!isDataUrl && sourceBlob.size <= SMALL_RASTER_THRESHOLD_BYTES) {
      return {
        blobUrl: URL.createObjectURL(sourceBlob),
        networkUrl,
        httpFailed: false,
        corsBlocked: false,
      }
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
        if (!loaded) {
          return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: false }
        }
        source = loaded.image
        tempImgUrl = loaded.tempUrl
        srcWidth = loaded.image.naturalWidth || loaded.image.width
        srcHeight = loaded.image.naturalHeight || loaded.image.height
      }
    } else {
      const loaded = await decodificarViaImage(sourceBlob)
      if (!loaded) {
        return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: false }
      }
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
      return {
        blobUrl: URL.createObjectURL(sourceBlob),
        networkUrl,
        httpFailed: false,
        corsBlocked: false,
      }
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
    if (!ctx) {
      return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: false }
    }

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
    if (!optimizedBlob) {
      return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: false }
    }

    return {
      blobUrl: URL.createObjectURL(optimizedBlob),
      networkUrl,
      httpFailed: false,
      corsBlocked: false,
    }
  } catch {
    return { blobUrl: null, networkUrl, httpFailed: false, corsBlocked: false }
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

export async function downscaleImageToBlobUrl(
  url: string,
  options: DownscaleImageOptions = {}
): Promise<string | null> {
  const result = await downscaleImageWithDiagnostics(url, options)
  return result.blobUrl
}
