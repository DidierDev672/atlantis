/**
 * Caché en memoria acotada (LRU + TTL) para evitar crecimiento ilimitado de RAM
 * en diccionarios de sesión a nivel de módulo.
 */
export class BoundedTtlCache<K, V> {
  private readonly store = new Map<K, { value: V; expiresAt: number }>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = 60, ttlMs = 5 * 60 * 1000) {
    this.maxEntries = Math.max(1, maxEntries);
    this.ttlMs = Math.max(1000, ttlMs);
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Promover como usado recientemente (LRU)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  set(key: K, value: V, ttlMsOverride?: number): void {
    try {
      const now = Date.now();
      const effectiveTtl =
        ttlMsOverride != null && ttlMsOverride > 0
          ? ttlMsOverride
          : this.ttlMs;
      if (this.store.has(key)) {
        this.store.delete(key);
      } else if (this.store.size >= this.maxEntries) {
        this.pruneExpired(now);
        if (this.store.size >= this.maxEntries) {
          const oldestKey = this.store.keys().next().value;
          if (oldestKey !== undefined) {
            this.store.delete(oldestKey);
          }
        }
      }
      this.store.set(key, { value, expiresAt: now + effectiveTtl });
    } catch (err) {
      console.error('Error al escribir en caché acotada:', err);
    }
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private pruneExpired(now = Date.now()): void {
    for (const [k, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(k);
      }
    }
  }
}
