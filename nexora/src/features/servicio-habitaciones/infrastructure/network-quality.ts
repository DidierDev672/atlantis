export type NetworkTier = 'offline' | 'low' | 'medium' | 'high'

export interface NetworkProfile {
  online: boolean
  tier: NetworkTier
  effectiveType: string
  downlinkMbps: number | null
  rttMs: number | null
  saveData: boolean
  label: string
  /** Máximo de peticiones API concurrentes en pools secundarios */
  maxConcurrentRequests: number
  /** Máximo de descargas simultáneas de imágenes */
  maxConcurrentImages: number
  /** Dimensión máxima recomendada para tarjetas de catálogo (px) */
  imageWidth: number
  /** Dimensión máxima recomendada para miniaturas (px) */
  thumbnailWidth: number
  /** Calidad WebP/JPEG recomendada (0-1) */
  imageQuality: number
  /** Si conviene omitir descarga de blob completo para downscale en JS cuando Save-Data / 2G está activo */
  preferLightweightImages: boolean
  /** Si se permiten consultas automáticas de enriquecimiento en segundo plano */
  enableBackgroundMetadata: boolean
  /** Tiempo de vigencia de caché en memoria adaptativo (ms) */
  cacheTtlMs: number
}

interface NetworkInformationLike extends EventTarget {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

function getNetworkConnection(): NetworkInformationLike | null {
  try {
    if (typeof navigator === 'undefined') return null
    const nav = navigator as Navigator & {
      connection?: NetworkInformationLike
      mozConnection?: NetworkInformationLike
      webkitConnection?: NetworkInformationLike
    }
    return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null
  } catch {
    return null
  }
}

function buildProfileSnapshot(): NetworkProfile {
  const online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true

  if (!online) {
    return {
      online: false,
      tier: 'offline',
      effectiveType: 'offline',
      downlinkMbps: 0,
      rttMs: null,
      saveData: true,
      label: 'Sin conexión (modo caché)',
      maxConcurrentRequests: 1,
      maxConcurrentImages: 0,
      imageWidth: 160,
      thumbnailWidth: 120,
      imageQuality: 0.6,
      preferLightweightImages: true,
      enableBackgroundMetadata: false,
      cacheTtlMs: 10 * 60 * 1000,
    }
  }

  const conn = getNetworkConnection()
  const effectiveType = conn?.effectiveType || '4g'
  const downlinkMbps = typeof conn?.downlink === 'number' ? conn.downlink : null
  const rttMs = typeof conn?.rtt === 'number' ? conn.rtt : null
  const saveData = Boolean(conn?.saveData)

  const isLow =
    saveData ||
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    (downlinkMbps !== null && downlinkMbps > 0 && downlinkMbps < 1.2) ||
    (rttMs !== null && rttMs > 650)

  if (isLow) {
    return {
      online: true,
      tier: 'low',
      effectiveType,
      downlinkMbps,
      rttMs,
      saveData,
      label: saveData ? 'Ahorro de datos activo' : `Red lenta (${effectiveType})`,
      maxConcurrentRequests: 2,
      maxConcurrentImages: 1,
      imageWidth: 320,
      thumbnailWidth: 120,
      imageQuality: 0.65,
      preferLightweightImages: true,
      enableBackgroundMetadata: false,
      cacheTtlMs: 5 * 60 * 1000,
    }
  }

  const isMedium =
    effectiveType === '3g' ||
    (downlinkMbps !== null && downlinkMbps >= 1.2 && downlinkMbps < 4) ||
    (rttMs !== null && rttMs >= 250 && rttMs <= 650)

  if (isMedium) {
    return {
      online: true,
      tier: 'medium',
      effectiveType,
      downlinkMbps,
      rttMs,
      saveData,
      label: `Red media (${effectiveType})`,
      maxConcurrentRequests: 3,
      maxConcurrentImages: 2,
      imageWidth: 480,
      thumbnailWidth: 160,
      imageQuality: 0.74,
      preferLightweightImages: false,
      enableBackgroundMetadata: true,
      cacheTtlMs: 3 * 60 * 1000,
    }
  }

  return {
    online: true,
    tier: 'high',
    effectiveType,
    downlinkMbps,
    rttMs,
    saveData,
    label: `Red rápida (${effectiveType})`,
    maxConcurrentRequests: 4,
    maxConcurrentImages: 3,
    imageWidth: 640,
    thumbnailWidth: 160,
    imageQuality: 0.82,
    preferLightweightImages: false,
    enableBackgroundMetadata: true,
    cacheTtlMs: 2 * 60 * 1000,
  }
}

let cachedSnapshot: NetworkProfile = buildProfileSnapshot()
const listeners = new Set<() => void>()
let isListeningBrowserEvents = false

function profilesAreEqual(a: NetworkProfile, b: NetworkProfile): boolean {
  return (
    a.online === b.online &&
    a.tier === b.tier &&
    a.effectiveType === b.effectiveType &&
    a.saveData === b.saveData &&
    a.imageWidth === b.imageWidth &&
    a.maxConcurrentImages === b.maxConcurrentImages
  )
}

function handleNetworkChange(): void {
  try {
    const next = buildProfileSnapshot()
    if (!profilesAreEqual(cachedSnapshot, next)) {
      cachedSnapshot = next
      listeners.forEach((fn) => fn())
    }
  } catch {
    // Mantiene el último perfil estable si el navegador restringe la API de red
  }
}

function ensureNetworkListeners(): void {
  if (isListeningBrowserEvents || typeof window === 'undefined') return
  try {
    isListeningBrowserEvents = true
    window.addEventListener('online', handleNetworkChange)
    window.addEventListener('offline', handleNetworkChange)
    const conn = getNetworkConnection()
    conn?.addEventListener?.('change', handleNetworkChange)
  } catch {
    // Fallback seguro en entornos sin soporte de eventos de conexión
  }
}

/**
 * Detecta la red disponible actualmente (`navigator.onLine`, Network Information API y `saveData`)
 * y retorna los parámetros óptimos de concurrencia, caché y calidad de imagen.
 */
export function detectarPerfilRedDisponible(): NetworkProfile {
  try {
    ensureNetworkListeners()
    const fresh = buildProfileSnapshot()
    if (!profilesAreEqual(cachedSnapshot, fresh)) {
      cachedSnapshot = fresh
    }
    return cachedSnapshot
  } catch {
    return cachedSnapshot
  }
}

export function subscribeNetworkProfile(listener: () => void): () => void {
  ensureNetworkListeners()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Optimiza parámetros de ancho/compresión en URLs de CDN compatibles (Pexels, Unsplash)
 * para reducir el peso descargado por red antes de solicitar la imagen.
 */
export function optimizarUrlImagenParaRed(
  rawUrl: string,
  requestedMaxDimension: number = 640
): string {
  if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl
  }

  try {
    const profile = detectarPerfilRedDisponible()
    const maxAllowed =
      requestedMaxDimension <= 160
        ? Math.min(requestedMaxDimension, profile.thumbnailWidth)
        : Math.min(requestedMaxDimension, profile.imageWidth)

    const parsed = new URL(rawUrl, typeof window !== 'undefined' ? window.location.origin : 'https://localhost')
    const host = parsed.hostname.toLowerCase()

    if (host.includes('pexels.com') || host.includes('unsplash.com')) {
      parsed.searchParams.set('auto', 'compress')
      parsed.searchParams.set('w', String(maxAllowed))
      if (profile.tier === 'low' || profile.tier === 'offline') {
        parsed.searchParams.set('q', '65')
      } else if (profile.tier === 'medium') {
        parsed.searchParams.set('q', '75')
      }
      return parsed.toString()
    }

    return rawUrl
  } catch {
    return rawUrl
  }
}
