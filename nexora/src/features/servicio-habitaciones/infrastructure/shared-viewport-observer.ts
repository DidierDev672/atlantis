type VisibilityCallback = (isIntersecting: boolean) => void

interface ObserverPoolEntry {
  observer: IntersectionObserver
  callbacks: Map<Element, VisibilityCallback>
}

const observerPool = new Map<string, ObserverPoolEntry>()

function getOrCreatePoolEntry(rootMargin: string): ObserverPoolEntry | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver !== 'function') {
    return null
  }

  const existing = observerPool.get(rootMargin)
  if (existing) return existing

  try {
    const callbacks = new Map<Element, VisibilityCallback>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = callbacks.get(entry.target)
          if (cb) {
            try {
              cb(entry.isIntersecting)
            } catch {
              // Evita interrumpir el resto de entradas del lote
            }
          }
        }
      },
      { root: null, rootMargin, threshold: 0 }
    )

    const poolEntry: ObserverPoolEntry = { observer, callbacks }
    observerPool.set(rootMargin, poolEntry)
    return poolEntry
  } catch {
    return null
  }
}

/**
 * Comparte un único `IntersectionObserver` nativo por cada `rootMargin`,
 * evitando instanciar decenas de observadores individuales por tarjeta.
 */
export function observeElementVisibility(
  element: Element,
  rootMargin: string,
  callback: VisibilityCallback
): () => void {
  const poolEntry = getOrCreatePoolEntry(rootMargin)
  if (!poolEntry) {
    return () => {}
  }

  try {
    poolEntry.callbacks.set(element, callback)
    poolEntry.observer.observe(element)
  } catch {
    poolEntry.callbacks.delete(element)
    return () => {}
  }

  return () => {
    try {
      poolEntry.observer.unobserve(element)
      poolEntry.callbacks.delete(element)

      if (poolEntry.callbacks.size === 0) {
        poolEntry.observer.disconnect()
        observerPool.delete(rootMargin)
      }
    } catch {
      // Ignora error al limpiar observador
    }
  }
}
