import { memo, useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { cn } from '../lib/cn'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
  children: ReactNode
}

/**
 * Átomo: Modal accesible con políticas adaptativas de GPU/VRAM
 * (`enableBackdropBlur` y `enableAnimations` vía `useDeviceResourceProfile`).
 */
export const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  className,
  children,
}: ModalProps) {
  const { policy } = useDeviceResourceProfile()

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen && !policy.enableAnimations) {
    return null
  }

  const backdropClassName = policy.enableBackdropBlur
    ? 'absolute inset-0 bg-black/50 backdrop-blur-sm'
    : 'absolute inset-0 bg-black/65'

  const panelClassName = cn(
    'w-full max-w-md rounded-2xl border border-line bg-panel p-5 sm:p-6',
    policy.enableBackdropBlur ? 'shadow-xl' : 'shadow-md',
    className
  )

  const headerNode = title ? (
    <div className="mb-4 flex items-start justify-between gap-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        title="Cerrar"
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-ink-muted outline-none transition-colors hover:bg-primary/5 hover:text-ink active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  ) : null

  if (!policy.enableAnimations) {
    return (
      <div className="fixed inset-0 z-50" onClick={onClose}>
        <div className={backdropClassName} aria-hidden="true" />
        <div className="relative flex min-h-full items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(event) => event.stopPropagation()}
            className={panelClassName}
          >
            {headerNode}
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50" onClick={onClose}>
          <motion.div
            className={backdropClassName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
          <div className="relative flex min-h-full items-center justify-center p-4">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              onClick={(event) => event.stopPropagation()}
              className={panelClassName}
            >
              {headerNode}
              {children}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  )
})
