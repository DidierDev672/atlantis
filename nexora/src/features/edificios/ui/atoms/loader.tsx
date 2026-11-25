import { memo, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { cn } from '../lib/cn'

export interface LoaderProps {
  label?: string
  size?: number
  fullScreen?: boolean
  overlay?: boolean
  disableBlur?: boolean
  visible?: boolean
  className?: string
  children?: ReactNode
}

/**
 * Átomo: Indicador de carga adaptable a hardware/VRAM (`enableAnimations`,
 * `enableBackdropBlur`) que evita doble desenfoque cuando se pasa `disableBlur`.
 */
export const Loader = memo(function Loader({
  label,
  size = 24,
  fullScreen = false,
  overlay = false,
  disableBlur = false,
  visible = true,
  className,
  children,
}: LoaderProps) {
  const { policy } = useDeviceResourceProfile()

  if (!visible && !policy.enableAnimations) {
    return null
  }

  const useBlur = !disableBlur && policy.enableBackdropBlur
  const overlayClassName = useBlur
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-black/40'

  const content = (
    <>
      <span
        className={cn(
          'inline-block rounded-full border-2 border-primary/20 border-t-primary',
          policy.enableAnimations ? 'animate-spin' : ''
        )}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {label ? (
        <span className="text-sm font-medium text-ink-muted">{label}</span>
      ) : null}
      {children}
    </>
  )

  const blockClassName = cn(
    'inline-flex flex-col items-center justify-center gap-3',
    fullScreen && 'min-h-[60vh] w-full',
    className
  )

  if (!policy.enableAnimations) {
    if (overlay) {
      return (
        <div className={overlayClassName} aria-hidden={!visible}>
          <div
            role="status"
            aria-live="polite"
            aria-label={label ?? 'Cargando'}
            className={blockClassName}
          >
            {content}
          </div>
        </div>
      )
    }

    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label ?? 'Cargando'}
        className={blockClassName}
      >
        {content}
      </div>
    )
  }

  const animatedBlock = (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Cargando'}
      className={blockClassName}
    >
      {content}
    </motion.div>
  )

  if (overlay) {
    return (
      <AnimatePresence>
        {visible ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={overlayClassName}
            aria-hidden={!visible}
          >
            {animatedBlock}
          </motion.div>
        ) : null}
      </AnimatePresence>
    )
  }

  return <AnimatePresence>{visible ? animatedBlock : null}</AnimatePresence>
})
