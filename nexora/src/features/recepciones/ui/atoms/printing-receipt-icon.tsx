import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faReceipt } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../../../shared/lib/cn'

export interface PrintingReceiptIconProps {
  isPrinting: boolean
  className?: string
  slotClassName?: string
}

/**
 * Átomo visual del icono de recibo con animación hover tipo impresión térmica:
 * al activarse, el ticket se desliza y despliega hacia abajo desde la ranura superior.
 */
export function PrintingReceiptIcon({
  isPrinting,
  className,
  slotClassName,
}: PrintingReceiptIconProps) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex items-center justify-center pt-[2px]"
    >
      {/* Ranura superior de la impresora */}
      <motion.span
        animate={
          isPrinting
            ? { scaleX: [0.85, 1.1, 1], opacity: [0.5, 1, 0.8] }
            : { scaleX: 0.75, opacity: 0 }
        }
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={cn(
          'absolute top-0 h-[1.5px] w-3.5 rounded-full bg-current',
          slotClassName
        )}
      />

      {/* Recibo saliendo de la impresora */}
      <span className="inline-flex overflow-hidden pt-[1px]">
        <motion.span
          animate={
            isPrinting
              ? {
                  y: [-9, -4, 1.5, 0],
                  scaleY: [0.7, 0.9, 1.05, 1],
                  opacity: [0.25, 0.85, 1, 1],
                }
              : { y: 0, scaleY: 1, opacity: 1 }
          }
          transition={{ duration: 0.52, ease: 'easeOut' }}
          style={{ transformOrigin: 'top center' }}
          className="inline-flex items-center justify-center"
        >
          <FontAwesomeIcon
            icon={faReceipt}
            className={cn('size-3.5', className)}
          />
        </motion.span>
      </span>
    </span>
  )
}
