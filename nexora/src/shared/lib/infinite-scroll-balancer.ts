export interface InfiniteScrollBalancerOptions {
  /** Pausa mínima entre lotes para evitar ráfagas de decodificación de imágenes (ms). */
  cooldownMs?: number
  /** Reintentos automáticos si `onLoadMore` falla. */
  maxRetries?: number
  /** Tiempo base para retroceso exponencial entre reintentos (ms). */
  backoffBaseMs?: number
}

export type BalancedBatchResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: unknown }

export interface InfiniteScrollBalancer {
  run: (task: () => Promise<void> | void) => Promise<BalancedBatchResult>
  isBusy: () => boolean
  cancel: () => void
}

function waitFrame(): Promise<void> {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

function sleepAbortable(ms: number, isCancelled: () => boolean): Promise<void> {
  if (ms <= 0 || isCancelled()) return Promise.resolve()
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Balanceador de cargas para scroll infinito:
 * - Evita disparos en ráfaga sobre listas pesadas con imágenes.
 * - Cede el hilo principal (`requestAnimationFrame`) entre lotes para evitar lag en UI.
 * - Ejecuta cada lote dentro de `try / catch` con backoff exponencial y micro-jitter.
 */
export function createInfiniteScrollBalancer(
  options: InfiniteScrollBalancerOptions = {}
): InfiniteScrollBalancer {
  const cooldownMs = Math.max(0, options.cooldownMs ?? 140)
  const maxRetries = Math.max(0, options.maxRetries ?? 1)
  const backoffBaseMs = Math.max(50, options.backoffBaseMs ?? 240)

  let inFlight = false
  let lastCompletedAt = 0
  let cancelled = false

  return {
    isBusy: () => inFlight,
    cancel: () => {
      cancelled = true
    },
    run: async (task) => {
      if (cancelled || inFlight) {
        return { ok: true, skipped: true }
      }

      inFlight = true
      let attempt = 0
      let delayMs = backoffBaseMs

      try {
        // Espera el cooldown restante desde el lote anterior + micro-jitter
        const elapsed = Date.now() - lastCompletedAt
        if (lastCompletedAt > 0 && elapsed < cooldownMs) {
          const jitter = Math.floor(Math.random() * 16)
          await sleepAbortable(cooldownMs - elapsed + jitter, () => cancelled)
        }

        if (cancelled) {
          return { ok: true, skipped: true }
        }

        // Cede al navegador un frame antes de montar el nuevo lote
        await waitFrame()
        if (cancelled) {
          return { ok: true, skipped: true }
        }

        while (attempt <= maxRetries) {
          try {
            await Promise.resolve(task())
            lastCompletedAt = Date.now()
            await waitFrame()
            return { ok: true }
          } catch (error) {
            if (attempt < maxRetries && !cancelled) {
              attempt += 1
              const jitter = Math.floor(Math.random() * 35)
              await sleepAbortable(delayMs + jitter, () => cancelled)
              delayMs = Math.round(delayMs * 1.6)
              continue
            }
            return { ok: false, error }
          }
        }

        return { ok: true }
      } catch (unexpectedError) {
        return { ok: false, error: unexpectedError }
      } finally {
        inFlight = false
      }
    },
  }
}
