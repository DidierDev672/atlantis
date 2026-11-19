import { revocarBlobUrlSegura } from '../domain/item-menu'

export interface ImageCacheEntry {
  resolvedUrl: string
  usedFallback: boolean
  isBlob: boolean
}

const MAX_CACHE_ENTRIES = 50
const loadedUrlCache = new Map<string, ImageCacheEntry>()

export function buildImageCacheKey(url: string, maxDimension: number): string {
  return maxDimension === 640 ? url : `${url}::${maxDimension}`
}

export function getImageCacheEntry(
  url: string,
  maxDimension: number = 640
): ImageCacheEntry | undefined {
  if (!url) return undefined
  return loadedUrlCache.get(buildImageCacheKey(url, maxDimension))
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
        if (oldest?.isBlob) {
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
  return loadedUrlCache.has(buildImageCacheKey(url, maxDimension))
}
