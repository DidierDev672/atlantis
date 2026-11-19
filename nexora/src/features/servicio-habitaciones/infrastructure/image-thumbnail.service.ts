import { revocarBlobUrlSegura } from '../domain/item-menu'

const DEFAULT_THUMBNAIL_MAX_PX = 160
const DEFAULT_THUMBNAIL_QUALITY = 0.82

export interface GenerarMiniaturaOptions {
  /** Dimensión máxima (ancho o alto) en píxeles CSS/Retina para la miniatura. Por defecto 160px (2x de 80px). */
  maxDimension?: number
  /** Calidad de compresión WebP/JPEG entre 0 y 1. */
  quality?: number
}

function calcularDimensionesProporcionales(
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

  const scale = maxDimension / maxSide
  return {
    targetWidth: Math.max(1, Math.round(width * scale)),
    targetHeight: Math.max(1, Math.round(height * scale)),
  }
}

function exportarCanvasComoBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
            return
          }
          // Fallback a JPEG si el navegador no soporta codificación WebP en canvas
          if (mimeType !== 'image/jpeg') {
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve(jpegBlob)
                } else {
                  reject(new Error('No se pudo serializar la miniatura desde canvas.'))
                }
              },
              'image/jpeg',
              quality
            )
            return
          }
          reject(new Error('No se pudo serializar la miniatura desde canvas.'))
        },
        mimeType,
        quality
      )
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Error al exportar miniatura.'))
    }
  })
}

async function cargarImagenTemporal(file: File): Promise<{
  image: HTMLImageElement
  tempUrl: string
}> {
  const tempUrl = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve({ image: img, tempUrl })
    img.onerror = () => {
      revocarBlobUrlSegura(tempUrl)
      reject(new Error('No se pudo decodificar la imagen seleccionada.'))
    }
    img.src = tempUrl
  })
}

/**
 * Genera una miniatura ligera (`blob:` URL de <=160px) para evitar:
 * 1) Convertir archivos de hasta 15 MB a Base64 en RAM (`FileReader.readAsDataURL`).
 * 2) Decodificar bitmaps completos (ej. 4000x3000 px) en RAM/VRAM para un thumbnail de 80x80 px.
 *
 * Libera inmediatamente los recursos temporales (`ImageBitmap`, `canvas` y URLs intermedias).
 */
export async function generarMiniaturaBlobUrl(
  file: File,
  options: GenerarMiniaturaOptions = {}
): Promise<string> {
  const maxDimension = options.maxDimension ?? DEFAULT_THUMBNAIL_MAX_PX
  const quality = options.quality ?? DEFAULT_THUMBNAIL_QUALITY

  // Los SVG son vectoriales y no requieren rasterizado por canvas
  if (file.type === 'image/svg+xml') {
    try {
      return URL.createObjectURL(file)
    } catch (svgError) {
      throw new Error('No se pudo generar la vista previa para el archivo SVG.', {
        cause: svgError,
      })
    }
  }

  let bitmap: ImageBitmap | null = null
  let tempSourceUrl: string | null = null
  let canvas: HTMLCanvasElement | null = null

  try {
    canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) {
      throw new Error('Contexto 2D no disponible para generar miniatura.')
    }

    let source: CanvasImageSource
    let srcWidth: number
    let srcHeight: number

    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file)
        source = bitmap
        srcWidth = bitmap.width
        srcHeight = bitmap.height
      } catch {
        const loaded = await cargarImagenTemporal(file)
        source = loaded.image
        tempSourceUrl = loaded.tempUrl
        srcWidth = loaded.image.naturalWidth || loaded.image.width
        srcHeight = loaded.image.naturalHeight || loaded.image.height
      }
    } else {
      const loaded = await cargarImagenTemporal(file)
      source = loaded.image
      tempSourceUrl = loaded.tempUrl
      srcWidth = loaded.image.naturalWidth || loaded.image.width
      srcHeight = loaded.image.naturalHeight || loaded.image.height
    }

    const { targetWidth, targetHeight } = calcularDimensionesProporcionales(
      srcWidth,
      srcHeight,
      maxDimension
    )

    canvas.width = targetWidth
    canvas.height = targetHeight
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'medium'
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

    const outputMime =
      file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/avif'
        ? 'image/webp'
        : 'image/jpeg'

    const thumbBlob = await exportarCanvasComoBlob(canvas, outputMime, quality)
    return URL.createObjectURL(thumbBlob)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo procesar la vista previa de la imagen.'
    throw new Error(message, { cause: error })
  } finally {
    try {
      bitmap?.close()
    } catch {
      // Ignora si el bitmap ya fue liberado
    }
    revocarBlobUrlSegura(tempSourceUrl)
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
