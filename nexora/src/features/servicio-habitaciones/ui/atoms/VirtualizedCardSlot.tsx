import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import { observeElementVisibility } from '../../infrastructure/shared-viewport-observer'

export interface VirtualizedCardSlotProps {
  children: ReactNode
  estimatedHeight?: number
  className?: string
  rootMargin?: string
}

/**
 * Átomo: Ranura virtualizada que comparte un único `IntersectionObserver` global por `rootMargin`.
 * Cuando la tarjeta sale lejos del viewport (>800px), desmonta el árbol interno
 * (liberando hooks, suscripciones y nodos DOM) manteniendo la altura medida.
 */
export const VirtualizedCardSlot = memo(function VirtualizedCardSlot({
  children,
  estimatedHeight = 340,
  className = '',
  rootMargin = '800px 0px 800px 0px',
}: VirtualizedCardSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const measuredHeightRef = useRef<number>(estimatedHeight)
  const [isNearViewport, setIsNearViewport] = useState(true)
  const [placeholderHeight, setPlaceholderHeight] = useState(estimatedHeight)

  useEffect(() => {
    const el = slotRef.current
    if (!el) return

    return observeElementVisibility(el, rootMargin, (isIntersecting) => {
      if (isIntersecting) {
        setIsNearViewport(true)
        return
      }

      try {
        const currentHeight = el.offsetHeight
        if (currentHeight > 0) {
          measuredHeightRef.current = currentHeight
          setPlaceholderHeight(currentHeight)
        }
      } catch {
        // Mantiene altura estimada si la medición falla
      }
      setIsNearViewport(false)
    })
  }, [rootMargin])

  return (
    <div
      ref={slotRef}
      style={
        isNearViewport
          ? undefined
          : { minHeight: `${placeholderHeight || measuredHeightRef.current}px` }
      }
      className={className}
    >
      {isNearViewport ? children : null}
    </div>
  )
})
