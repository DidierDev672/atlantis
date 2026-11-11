/**
 * Balanceador de carga para la descarga controlada de imágenes de productos.
 * - Limita la concurrencia simultánea para evitar saturar la red o el CDN.
 * - Aplica micro-jitter adaptativo y reintentos con retroceso exponencial.
 * - Deduplica peticiones en vuelo y cachea URLs ya resueltas.
 * - Expone el estado en tiempo real para sincronizar indicadores `/shared/loading`.
 */

import { sleep } from '../../reservas/infrastructure/api-load-balancer'

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
  resolve: (result: BalancedImageResult) => void
}

const DEFAULT_MAX_CONCURRENT = 4
const loadedUrlCache = new Set<string>()
const inFlightByUrl = new Map<string, Promise<BalancedImageResult>>()
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

  currentSnapshot = {
    activeCount: activeDownloads,
    queuedCount,
    isRunning,
  }

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

export function isImageCached(url: string): boolean {
  return Boolean(url) && loadedUrlCache.has(url)
}

function attemptSingleImageLoad(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false)
      return
    }

    const img = new Image()
    let settled = false

    const cleanup = () => {
      img.onload = null
      img.onerror = null
      clearTimeout(timerId)
    }

    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(ok)
    }

    const timerId = window.setTimeout(() => finish(false), timeoutMs)

    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.decoding = 'async'
    img.src = url
  })
}

async function executeImageTask(task: QueuedImageTask): Promise<BalancedImageResult> {
  const { url, fallbackUrl, maxRetries, backoffMultiplier, timeoutMs } = task

  // Micro-jitter adaptativo (4-16ms) para distribuir ráfagas de montaje en el grid
  const jitterMs = Math.floor(Math.random() * 12) + 4
  await sleep(jitterMs)

  let attempt = 0
  let delayMs = 150

  while (attempt <= maxRetries) {
    const loaded = await attemptSingleImageLoad(url, timeoutMs)
    if (loaded) {
      loadedUrlCache.add(url)
      return { resolvedUrl: url, usedFallback: false, fromCache: false }
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
    if (loadedUrlCache.has(fallbackUrl)) {
      return { resolvedUrl: fallbackUrl, usedFallback: true, fromCache: true }
    }
    const fallbackOk = await attemptSingleImageLoad(fallbackUrl, timeoutMs)
    if (fallbackOk) {
      loadedUrlCache.add(fallbackUrl)
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
 * Carga una imagen a través del balanceador de carga compartido (cola con concurrencia limitada,
 * micro-jitter, reintentos con exponential backoff y fallback automático).
 */
export function loadBalancedImage(
  url: string,
  options: ImageLoadBalancerOptions = {}
): Promise<BalancedImageResult> {
  const {
    maxConcurrent = DEFAULT_MAX_CONCURRENT,
    maxRetries = 2,
    backoffMultiplier = 1.5,
    timeoutMs = 10000,
    fallbackUrl,
  } = options

  if (isImageCached(url)) {
    return Promise.resolve({
      resolvedUrl: url,
      usedFallback: false,
      fromCache: true,
    })
  }

  const existing = inFlightByUrl.get(url)
  if (existing) {
    return existing
  }

  const taskPromise = new Promise<BalancedImageResult>((resolve) => {
    pendingQueue.push({
      url,
      fallbackUrl,
      maxRetries,
      backoffMultiplier,
      timeoutMs,
      resolve,
    })
    emitSnapshot()
    drainQueue(maxConcurrent)
  }).finally(() => {
    inFlightByUrl.delete(url)
  })

  inFlightByUrl.set(url, taskPromise)
  return taskPromise
}
