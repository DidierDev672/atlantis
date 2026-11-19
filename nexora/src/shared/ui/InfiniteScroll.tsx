import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { createInfiniteScrollBalancer } from '../lib/infinite-scroll-balancer'
import {
  LazyAnimatedWrapper,
  type LazyAnimationVariant,
} from './LazyAnimatedWrapper'
import { InfiniteScrollSentinel } from './atoms/InfiniteScrollSentinel'
import { InfiniteScrollOptimizedItem } from './atoms/InfiniteScrollOptimizedItem'

export type { LazyAnimationVariant }
export {
  InfiniteScrollOptimizedItem,
  type InfiniteScrollOptimizedItemProps,
} from './atoms/InfiniteScrollOptimizedItem'

export interface InfiniteScrollProps {
  onLoadMore: () => Promise<void> | void
  hasMore: boolean
  isLoading: boolean
  children: ReactNode
  loader?: ReactNode
  endMessage?: ReactNode
  /** Se dispara cuando el sentinela cruza este umbral de visibilidad (0..1). Por defecto 0. */
  threshold?: number
  /** Margin extra del root antes de cruzar el umbral (px). Por defecto 200. */
  rootMargin?: string
  className?: string
  /**
   * Variante opcional de animación al aparecer el cierre/elementos.
   * Por optimización GPU/RAM no envuelve toda la lista gigante en una capa `transform`.
   */
  animationVariant?: LazyAnimationVariant
  /** Margen de activación en el viewport para la animación perezosa. Por defecto '-100px'. */
  viewportMargin?: string
  /** Si la animación debe ejecutarse solo una vez al entrar en el viewport. Por defecto true. */
  once?: boolean
  /** Pausa mínima entre lotes para balancear decodificación de imágenes y CPU (ms). Por defecto 140. */
  cooldownMs?: number
  /** Reintentos automáticos si `onLoadMore` falla. Por defecto 1. */
  maxRetries?: number
  /** Mensaje empático personalizado si `onLoadMore` falla tras los reintentos. */
  errorMessage?: string
  /** Callback opcional para reportar errores capturados por el balanceador. */
  onError?: (error: unknown) => void
  /** Aplica aislamiento CSS (`contain: layout style`) para reducir consumo de GPU/RAM. Por defecto true. */
  optimizeGpuMemory?: boolean
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  children,
  loader,
  endMessage,
  threshold = 0,
  rootMargin = '0px 0px 200px 0px',
  className,
  animationVariant,
  viewportMargin = '-100px',
  once = true,
  cooldownMs = 140,
  maxRetries = 1,
  errorMessage,
  onError,
  optimizeGpuMemory = true,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  const onErrorRef = useRef(onError)
  const isLoadingRef = useRef(isLoading)
  const hasMoreRef = useRef(hasMore)

  const [isBalancing, setIsBalancing] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
    onErrorRef.current = onError
    isLoadingRef.current = isLoading
    hasMoreRef.current = hasMore
  }, [onLoadMore, onError, isLoading, hasMore])

  const balancer = useMemo(
    () => createInfiniteScrollBalancer({ cooldownMs, maxRetries }),
    [cooldownMs, maxRetries]
  )

  useEffect(() => {
    return () => {
      balancer.cancel()
    }
  }, [balancer])

  const triggerLoadMore = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingRef.current || balancer.isBusy()) {
      return
    }

    setHasError(false)
    setIsBalancing(true)

    try {
      const result = await balancer.run(() => onLoadMoreRef.current())
      if (!result.ok) {
        setHasError(true)
        onErrorRef.current?.(result.error)
      }
    } catch (error) {
      setHasError(true)
      onErrorRef.current?.(error)
    } finally {
      setIsBalancing(false)
    }
  }, [balancer])

  // Sanitización defensiva del threshold para prevenir RangeError en IntersectionObserver
  const safeThreshold =
    typeof threshold === 'number' && !Number.isNaN(threshold)
      ? threshold >= 0 && threshold <= 1
        ? threshold
        : Math.min(Math.max(threshold > 1 ? 0.1 : threshold, 0), 1)
      : 0

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || hasError) return

    let observer: IntersectionObserver | null = null
    try {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry?.isIntersecting) return
          void triggerLoadMore()
        },
        { root: null, rootMargin, threshold: safeThreshold }
      )
      observer.observe(sentinel)
    } catch (error) {
      onErrorRef.current?.(error)
    }

    return () => {
      observer?.disconnect()
    }
  }, [hasMore, hasError, isLoading, isBalancing, rootMargin, safeThreshold, triggerLoadMore])

  const containerStyle: CSSProperties | undefined = optimizeGpuMemory
    ? { contain: 'layout style' }
    : undefined

  const resolvedEndMessage =
    endMessage &&
    (animationVariant ? (
      <LazyAnimatedWrapper
        variant={animationVariant}
        once={once}
        viewportMargin={viewportMargin}
      >
        {endMessage}
      </LazyAnimatedWrapper>
    ) : (
      endMessage
    ))

  return (
    <div style={containerStyle} className={className}>
      {children}

      <InfiniteScrollSentinel
        sentinelRef={sentinelRef}
        isLoading={isLoading}
        isBalancing={isBalancing}
        hasMore={hasMore}
        hasError={hasError}
        errorMessage={errorMessage}
        loader={loader}
        endMessage={resolvedEndMessage}
        onRetry={() => void triggerLoadMore()}
      />
    </div>
  )
}

export function InfiniteScrollEnd({
  label = 'Llegaste al final.',
  animationVariant,
}: {
  label?: string
  animationVariant?: LazyAnimationVariant
}) {
  const node = (
    <p className={cn('py-6 text-center text-sm text-neutral')}>{label}</p>
  )
  if (animationVariant) {
    return (
      <LazyAnimatedWrapper variant={animationVariant} once>
        {node}
      </LazyAnimatedWrapper>
    )
  }
  return node
}

export interface InfiniteScrollAnimatedItemProps {
  children: ReactNode
  variant?: LazyAnimationVariant
  className?: string
  viewportMargin?: string
  estimatedHeight?: number
  optimizeGpuMemory?: boolean
}

/**
 * Envoltorio atómico optimizado para ítems individuales dentro de un InfiniteScroll
 * (aplica `content-visibility: auto` y aislamiento GPU/RAM).
 */
export function InfiniteScrollAnimatedItem({
  children,
  variant = 'slideUp',
  className,
  viewportMargin = '-100px',
  estimatedHeight = 320,
  optimizeGpuMemory = true,
}: InfiniteScrollAnimatedItemProps) {
  return (
    <InfiniteScrollOptimizedItem
      variant={variant}
      viewportMargin={viewportMargin}
      estimatedHeight={estimatedHeight}
      optimizeGpuMemory={optimizeGpuMemory}
      className={className}
    >
      {children}
    </InfiniteScrollOptimizedItem>
  )
}
