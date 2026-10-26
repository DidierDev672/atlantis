import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { cn } from '../../lib';

import type { Placement } from '../hooks/usePopover';

type PickerPopoverProps = {
  open: boolean;
  id: string;
  label: string;
  placement: Placement;
  align: 'start' | 'end';
  children: React.ReactNode;
};

/** Molécula: contenedor flotante con animación de entrada/salida. */
export function PickerPopover({
  open,
  id,
  label,
  placement,
  align,
  children,
}: PickerPopoverProps) {
  const reduced = useReducedMotion();
  const offset = reduced ? 0 : placement === 'bottom' ? -8 : 8;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={id}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          initial={{ opacity: 0, y: offset, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: offset, scale: 0.97 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            transformOrigin: `${placement === 'bottom' ? 'top' : 'bottom'} ${
              align === 'start' ? 'left' : 'right'
            }`,
          }}
          className={cn(
            'bg-panel border-line absolute z-30 w-[19rem] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-lg outline-none',
            placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
            align === 'start' ? 'left-0' : 'right-0'
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
