import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import {
  LazyAnimatedWrapper,
  type LazyAnimationVariant,
} from '../LazyAnimatedWrapper'

export interface InfiniteScrollOptimizedItemProps {
  children: ReactNode
  variant?: LazyAnimationVariant
  className?: string
  viewportMargin?: string
  /** Altura estimada para `contain-intrinsic-size` cuando el ítem sale del viewport */
  estimatedHeight?: number
  /** Activa aislamiento GPU/RAM (`content-visibility: auto` y `contain`) */
  optimizeGpuMemory?: boolean
  animate?: boolean
}

/**
 * Átomo optimizado para ítems dentro de `InfiniteScroll`.
 * Aplica `content-visibility: auto` y `contain: layout style paint` para que
 * las tarjetas con imágenes fuera del viewport liberen ciclos de pintura y RAM/VRAM.
 */
export function InfiniteScrollOptimizedItem({
  children,
  variant = 'slideUp',
  className,
  viewportMargin = '-80px',
  estimatedHeight = 320,
  optimizeGpuMemory = true,
  animate = true,
}: InfiniteScrollOptimizedItemProps) {
  const isolationStyle: CSSProperties | undefined = optimizeGpuMemory
    ? {
        contain: 'layout style paint',
        contentVisibility: 'auto',
        containIntrinsicSize: `auto ${estimatedHeight}px`,
      }
    : undefined

  if (!animate) {
    return (
      <div style={isolationStyle} className={cn(className)}>
        {children}
      </div>
    )
  }

  return (
    <div style={isolationStyle} className={cn(className)}>
      <LazyAnimatedWrapper
        variant={variant}
        viewportMargin={viewportMargin}
        once
        className="h-full w-full"
      >
        {children}
      </LazyAnimatedWrapper>
    </div>
  )
}
