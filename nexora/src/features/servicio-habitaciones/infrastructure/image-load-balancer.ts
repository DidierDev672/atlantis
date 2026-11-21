/**
 * Balanceador de carga para la descarga controlada y optimizada de imágenes de productos y categorías.
 * - Limita la concurrencia simultánea para evitar saturar la red o el CDN.
 * - Reduce fotos pesadas (15 MB / 4000x3000 px) y Base64 a texturas `blob:` acotadas (`<=maxDimension`).
 * - Aplica micro-jitter adaptativo y reintentos con retroceso exponencial.
 */

import { sleep } from '../../reservas/infrastructure/api-load-balancer'
import {
  buildImageCacheKey,
  getImageCacheEntry,
  hasImageCacheEntry,
  setImageCacheEntry,
} from './image-cache-lru'
import { downscaleImageWithDiagnostics } from './image-downscaler'
import {
  detectarPerfilRedDisponible,
  optimizarUrlImagenParaRed,
} from './network-quality'

export interface ImageLoadBalancerOptions {
  /** Máximo de imágenes descargándose en paralelo (pool compartido) */
  maxConcurrent?: number
  /** Reintentos por imagen ante fallo transitorio de red */
  maxRetries?: number
  /** Multiplicador de retroceso exponencial entre reintentos */
  backoffMultiplier?: number
  /** Tiempo máximo de espera por intento (ms) */
  timeoutMs?: number
  /** URL alternativa si la imagen principal falla tras los reintentos */
  fallbackUrl?: string
  /** Dimensión máxima en px para reducir fotos pesadas. Por defecto 640px (96px para avatares). */
  maxDimension?: number
}

export interface BalancedImageResult {
  resolvedUrl: string
  usedFallback: boolean
  fromCache: boolean
}

export interface ImageLoadBalancerSnapshot {
  activeCount: number
  queuedCount: number
  isRunning: boolean
}

interface QueuedImageTask {
  url: string
  fallbackUrl?: string
  maxRetries: number
  backoffMultiplier: number
  timeoutMs: number
  maxDimension: number
  resolve: (result: BalancedImageResult) => void
}

const DEFAULT_MAX_CONCURRENT = 3
const DEFAULT_MAX_DIMENSION = 640

const inFlightByKey = new Map<string, Promise<BalancedImageResult>>()
const pendingQueue: QueuedImageTask[] = []
const listeners = new Set<() => void>()

let activeDownloads = 0
let currentSnapshot: ImageLoadBalancerSnapshot = {
  activeCount: 0,
  queuedCount: 0,
  isRunning: false,
}

function emitSnapshot(): void {
  const queuedCount = pendingQueue.length
  const isRunning = activeDownloads > 0 || queuedCount > 0

  if (
    currentSnapshot.activeCount === activeDownloads &&
    currentSnapshot.queuedCount === queuedCount &&
    currentSnapshot.isRunning === isRunning
  ) {
    return
  }

  currentSnapshot = { activeCount: activeDownloads, queuedCount, isRunning }
  listeners.forEach((listener) => listener())
}

export function subscribeImageLoadBalancer(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getImageLoadBalancerSnapshot(): ImageLoadBalancerSnapshot {
  return currentSnapshot
}

export function resolveNetworkImageDimension(
  requestedMaxDimension: number = DEFAULT_MAX_DIMENSION
): number {
  const networkProfile = detectarPerfilRedDisponible()
  return requestedMaxDimension <= 160
    ? Math.min(requestedMaxDimension, networkProfile.thumbnailWidth)
    : Math.min(requestedMaxDimension, networkProfile.imageWidth)
}

export function isImageCached(
  url: string,
  maxDimension: number = DEFAULT_MAX_DIMENSION
): boolean {
  return hasImageCacheEntry(url, resolveNetworkImageDimension(maxDimension))
}

export function getCachedImageUrl(
  url: string,
  maxDimension: number = DEFAULT_MAX_DIMENSION
): string | null {
  return (
    getImageCacheEntry(url, resolveNetworkImageDimension(maxDimension))
      ?.resolvedUrl ?? null
  )
}

function attemptSingleImageLoad(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false)
      return
    }

    const img = new Image()
    let settled = false

    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      img.onload = null
      img.onerror = null
      clearTimeout(timerId)
      resolve(ok)
    }

    const timerId = window.setTimeout(() => finish(false), timeoutMs)
    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.decoding = 'async'
    img.src = url
  })
}

async function resolveOptimizedImage(
  url: string,
  maxDimension: number,
  timeoutMs: number
): Promise<{ ok: boolean; resolvedUrl: string; isBlob: boolean }> {
  try {
    const downscaleRes = await downscaleImageWithDiagnostics(url, {
      maxDimension,
      timeoutMs,
    })
    if (downscaleRes.blobUrl) {
      return { ok: true, resolvedUrl: downscaleRes.blobUrl, isBlob: true }
    }

    // Evita doble descarga cuando el servidor devolvió 404/403 explícito
    if (downscaleRes.httpFailed) {
      return { ok: false, resolvedUrl: downscaleRes.networkUrl, isBlob: false }
    }

    const loaded = await attemptSingleImageLoad(downscaleRes.networkUrl, timeoutMs)
    return {
      ok: loaded,
      resolvedUrl: downscaleRes.networkUrl,
      isBlob: false,
    }
  } catch {
    return { ok: false, resolvedUrl: url, isBlob: false }
  }
}

async function executeImageTask(task: QueuedImageTask): Promise<BalancedImageResult> {
  const {
    url,
    fallbackUrl,
    maxRetries,
    backoffMultiplier,
    timeoutMs,
    maxDimension,
  } = task

  await sleep(Math.floor(Math.random() * 12) + 4)

  let attempt = 0
  let delayMs = 150

  while (attempt <= maxRetries) {
    const attemptResult = await resolveOptimizedImage(url, maxDimension, timeoutMs)
    if (attemptResult.ok) {
      setImageCacheEntry(url, maxDimension, {
        resolvedUrl: attemptResult.resolvedUrl,
        usedFallback: false,
        isBlob: attemptResult.isBlob,
      })
      return {
        resolvedUrl: attemptResult.resolvedUrl,
        usedFallback: false,
        fromCache: false,
      }
    }

    if (attempt < maxRetries) {
      attempt++
      await sleep(delayMs)
      delayMs = Math.round(delayMs * backoffMultiplier)
      continue
    }
    break
  }

  if (fallbackUrl && fallbackUrl !== url) {
    const cachedFallback = getImageCacheEntry(fallbackUrl, maxDimension)
    if (cachedFallback) {
      return {
        resolvedUrl: cachedFallback.resolvedUrl,
        usedFallback: true,
        fromCache: true,
      }
    }

    const fallbackRes = await resolveOptimizedImage(
      fallbackUrl,
      maxDimension,
      timeoutMs
    )
    if (fallbackRes.ok) {
      const entry = {
        resolvedUrl: fallbackRes.resolvedUrl,
        usedFallback: true,
        isBlob: fallbackRes.isBlob,
      }
      setImageCacheEntry(fallbackUrl, maxDimension, entry)
      setImageCacheEntry(url, maxDimension, entry)
      return {
        resolvedUrl: fallbackRes.resolvedUrl,
        usedFallback: true,
        fromCache: false,
      }
    }
    return { resolvedUrl: fallbackUrl, usedFallback: true, fromCache: false }
  }

  return { resolvedUrl: url, usedFallback: false, fromCache: false }
}

function drainQueue(maxConcurrent: number): void {
  while (activeDownloads < maxConcurrent && pendingQueue.length > 0) {
    const task = pendingQueue.shift()
    if (!task) break

    activeDownloads++
    emitSnapshot()

    void executeImageTask(task)
      .then((result) => {
        task.resolve(result)
      })
      .finally(() => {
        activeDownloads = Math.max(0, activeDownloads - 1)
        emitSnapshot()
        drainQueue(maxConcurrent)
      })
  }

  emitSnapshot()
}

/**
 * Carga una imagen de forma asíncrona a través del balanceador de carga compartido.
 */
export function loadBalancedImage(
  url: string,
  options: ImageLoadBalancerOptions = {}
): Promise<BalancedImageResult> {
  const networkProfile = detectarPerfilRedDisponible()
  const defaultRetries = networkProfile.tier === 'low' || networkProfile.tier === 'offline' ? 1 : 2
  const defaultConcurrent =
    networkProfile.maxConcurrentImages > 0 ? networkProfile.maxConcurrentImages : 1

  const {
    maxConcurrent = defaultConcurrent || DEFAULT_MAX_CONCURRENT,
    maxRetries = defaultRetries,
    backoffMultiplier = 1.5,
    timeoutMs = 10000,
    fallbackUrl,
    maxDimension: requestedMaxDimension = DEFAULT_MAX_DIMENSION,
  } = options

  const maxDimension = resolveNetworkImageDimension(requestedMaxDimension)

  const cached = getImageCacheEntry(url, maxDimension)
  if (cached) {
    return Promise.resolve({
      resolvedUrl: cached.resolvedUrl,
      usedFallback: cached.usedFallback,
      fromCache: true,
    })
  }

  // Sin conexión: no intentar descargas remotas innecesarias; devolver respaldo o URL optimizada
  if (!networkProfile.online && !url.startsWith('data:') && !url.startsWith('blob:')) {
    const safeFallback = fallbackUrl || url
    return Promise.resolve({
      resolvedUrl: safeFallback,
      usedFallback: Boolean(fallbackUrl),
      fromCache: false,
    })
  }

  const cacheKey = buildImageCacheKey(url, maxDimension)
  const existing = inFlightByKey.get(cacheKey)
  if (existing) {
    return existing
  }

  const optimizedFallback = fallbackUrl
    ? optimizarUrlImagenParaRed(fallbackUrl, maxDimension)
    : undefined

  const taskPromise = new Promise<BalancedImageResult>((resolve) => {
    pendingQueue.push({
      url,
      fallbackUrl: optimizedFallback,
      maxRetries,
      backoffMultiplier,
      timeoutMs,
      maxDimension,
      resolve,
    })
    emitSnapshot()
    drainQueue(maxConcurrent)
  }).finally(() => {
    inFlightByKey.delete(cacheKey)
  })

  inFlightByKey.set(cacheKey, taskPromise)
  return taskPromise
}
