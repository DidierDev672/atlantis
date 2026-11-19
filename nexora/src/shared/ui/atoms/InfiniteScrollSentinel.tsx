import type { ReactNode, RefObject } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'

export interface InfiniteScrollSentinelProps {
  sentinelRef: RefObject<HTMLDivElement | null>
  isLoading: boolean
  isBalancing: boolean
  hasMore: boolean
  hasError: boolean
  errorMessage?: string
  loader?: ReactNode
  endMessage?: ReactNode
  onRetry: () => void
}

/**
 * Átomo visual para el estado final del InfiniteScroll (loader, sentinela, error o fin de lista).
 * Mantiene una altura estable para evitar saltos de layout durante el scroll.
 */
export function InfiniteScrollSentinel({
  sentinelRef,
  isLoading,
  isBalancing,
  hasMore,
  hasError,
  errorMessage,
  loader,
  endMessage,
  onRetry,
}: InfiniteScrollSentinelProps) {
  if (hasError) {
    return (
      <div
        role="alert"
        className="border-danger/30 bg-danger/5 my-4 flex flex-col items-center justify-center gap-2.5 rounded-2xl border px-4 py-4 text-center sm:flex-row sm:text-left"
      >
        <div className="text-danger flex items-center gap-2 text-xs font-medium">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="size-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            {errorMessage ??
              'No pudimos cargar el siguiente lote. Tus datos están seguros; intenta nuevamente.'}
          </span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
        >
          <FontAwesomeIcon
            icon={faArrowsRotate}
            className="size-3"
            aria-hidden="true"
          />
          <span>Reintentar</span>
        </button>
      </div>
    )
  }

  if (isLoading || isBalancing) {
    return (
      loader ?? (
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-12 items-center justify-center py-4"
        >
          <span className="border-primary/20 border-t-primary inline-block size-6 animate-spin rounded-full border-2" />
        </div>
      )
    )
  }

  if (hasMore) {
    return (
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none h-10 w-full opacity-0"
      />
    )
  }

  return endMessage ?? null
}
