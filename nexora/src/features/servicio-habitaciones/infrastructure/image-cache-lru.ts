import { revocarBlobUrlSegura } from '../domain/item-menu'

export interface ImageCacheEntry {
  resolvedUrl: string
  usedFallback: boolean
  isBlob: boolean
}

const MAX_CACHE_ENTRIES = 120
const REUSABLE_DIMENSIONS = [640, 480, 320] as const
const loadedUrlCache = new Map<string, ImageCacheEntry>()

export function buildImageCacheKey(url: string, maxDimension: number): string {
  return maxDimension === 640 ? url : `${url}::${maxDimension}`
}

function findReusableCacheKey(url: string, maxDimension: number): string | null {
  const exactKey = buildImageCacheKey(url, maxDimension)
  if (loadedUrlCache.has(exactKey)) return exactKey

  // Si se solicita una miniatura (<= 160px) o versión menor, reutiliza textura mayor ya descargada sin tocar la red
  for (const dim of REUSABLE_DIMENSIONS) {
    if (dim >= maxDimension) {
      const candidateKey = buildImageCacheKey(url, dim)
      if (loadedUrlCache.has(candidateKey)) {
        return candidateKey
      }
    }
  }
  return null
}

export function getImageCacheEntry(
  url: string,
  maxDimension: number = 640
): ImageCacheEntry | undefined {
  if (!url) return undefined
  try {
    const key = findReusableCacheKey(url, maxDimension)
    if (!key) return undefined

    const entry = loadedUrlCache.get(key)
    if (!entry) return undefined

    // Promueve la entrada consultada al final del Map (LRU real) para evitar evicción prematura
    loadedUrlCache.delete(key)
    loadedUrlCache.set(key, entry)
    return entry
  } catch {
    return undefined
  }
}

function isResolvedUrlStillReferenced(resolvedUrl: string): boolean {
  for (const existing of loadedUrlCache.values()) {
    if (existing.resolvedUrl === resolvedUrl) {
      return true
    }
  }
  return false
}

export function setImageCacheEntry(
  url: string,
  maxDimension: number,
  entry: ImageCacheEntry
): void {
  const key = buildImageCacheKey(url, maxDimension)
  try {
    if (loadedUrlCache.has(key)) {
      loadedUrlCache.delete(key)
    } else if (loadedUrlCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = loadedUrlCache.keys().next().value
      if (oldestKey !== undefined) {
        const oldest = loadedUrlCache.get(oldestKey)
        loadedUrlCache.delete(oldestKey)
        if (oldest?.isBlob && !isResolvedUrlStillReferenced(oldest.resolvedUrl)) {
          revocarBlobUrlSegura(oldest.resolvedUrl)
        }
      }
    }
    loadedUrlCache.set(key, entry)
  } catch {
    // Mantiene estabilidad si el navegador restringe revocación de blob
  }
}

export function hasImageCacheEntry(
  url: string,
  maxDimension: number = 640
): boolean {
  if (!url) return false
  try {
    return findReusableCacheKey(url, maxDimension) !== null
  } catch {
    return false
  }
}
