import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../lib/cn'
import {
  computeTooltipPosition,
  type TooltipPlacement,
  type TooltipPositionResult,
} from '../lib/tooltip-position'

export type { TooltipPlacement } from '../lib/tooltip-position'

export interface TooltipProps {
  /** Texto o elemento React a mostrar dentro del tooltip */
  content: ReactNode
  /** Elemento que activa el tooltip al pasar el cursor o recibir foco */
  children: ReactNode
  /** Posición preferida; se ajusta automáticamente si no cabe en pantalla */
  preferredPlacement?: TooltipPlacement
  /** Clases CSS para el contenedor del disparador */
  className?: string
  /** Clases CSS adicionales para la caja flotante del tooltip */
  contentClassName?: string
  /** Deshabilita la aparición del tooltip */
  disabled?: boolean
}

const DIRECTION_OFFSET: Record<TooltipPlacement, { x: number; y: number }> = {
  top: { x: 0, y: 4 },
  bottom: { x: 0, y: -4 },
  left: { x: 4, y: 0 },
  right: { x: -4, y: 0 },
}

export function Tooltip({
  content,
  children,
  preferredPlacement = 'top',
  className,
  contentClassName,
  disabled = false,
}: TooltipProps) {
  const tooltipId = useId()
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<TooltipPositionResult>({
    placement: preferredPlacement,
    top: -9999,
    left: -9999,
    arrowTop: 0,
    arrowLeft: 0,
  })

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current
    const tooltipEl = tooltipRef.current
    if (!triggerEl || !tooltipEl) return

    const triggerRect = triggerEl.getBoundingClientRect()
    const tooltipRect = tooltipEl.getBoundingClientRect()

    const nextPosition = computeTooltipPosition({
      triggerRect,
      tooltipWidth: tooltipRect.width,
      tooltipHeight: tooltipRect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      preferredPlacement,
    })

    setPosition(nextPosition)
  }, [preferredPlacement])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()
  }, [isOpen, content, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    const handleReposition = () => updatePosition()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleReposition, { passive: true })
    window.addEventListener('scroll', handleReposition, {
      passive: true,
      capture: true,
    })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, updatePosition])

  const show = !disabled && isOpen && content !== null && content !== undefined
  const offset = DIRECTION_OFFSET[position.placement]

  return (
    <>
      <span
        ref={triggerRef}
        aria-describedby={show ? tooltipId : undefined}
        onMouseEnter={() => {
          if (!disabled) setIsOpen(true)
        }}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => {
          if (!disabled) setIsOpen(true)
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsOpen(false)
          }
        }}
        className={cn('inline-flex', className)}
      >
        {children}
      </span>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {show && (
              <motion.div
                ref={tooltipRef}
                id={tooltipId}
                role="tooltip"
                initial={{ opacity: 0, scale: 0.96, x: offset.x, y: offset.y }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, x: offset.x, y: offset.y }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: position.top,
                  left: position.left,
                }}
                className={cn(
                  'bg-ink text-canvas pointer-events-none z-90 max-w-[min(18rem,calc(100vw-16px))] rounded-xl px-3 py-1.5 text-xs font-medium leading-snug shadow-lg ring-1 ring-black/10 dark:ring-white/15',
                  contentClassName
                )}
              >
                <span
                  aria-hidden="true"
                  style={
                    position.placement === 'top' ||
                    position.placement === 'bottom'
                      ? { left: position.arrowLeft - 4 }
                      : { top: position.arrowTop - 4 }
                  }
                  className={cn(
                    'bg-ink absolute size-2 rotate-45',
                    position.placement === 'top' && '-bottom-1',
                    position.placement === 'bottom' && '-top-1',
                    position.placement === 'left' && '-right-1',
                    position.placement === 'right' && '-left-1'
                  )}
                />
                <span className="relative">{content}</span>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
