import type { Ref } from 'react';
import { faCalendarDays, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '../../lib';

type DateTriggerProps = {
  id: string;
  buttonRef: Ref<HTMLButtonElement>;
  popupId: string;
  displayValue: string;
  placeholder: string;
  hasValue: boolean;
  open: boolean;
  disabled?: boolean;
  invalid?: boolean;
  clearable: boolean;
  clearLabel: string;
  describedBy?: string;
  onToggle: () => void;
  onClear: () => void;
};

/** Molécula: botón que parece un input + icono de calendario + botón de borrar. */
export function DateTrigger({
  id,
  buttonRef,
  popupId,
  displayValue,
  placeholder,
  hasValue,
  open,
  disabled,
  invalid,
  clearable,
  clearLabel,
  describedBy,
  onToggle,
  onClear,
}: DateTriggerProps) {
  const showClear = clearable && hasValue && !disabled;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          'bg-panel flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm shadow-2xs transition outline-none',
          'focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
          hasValue ? 'text-ink' : 'text-ink-muted',
          invalid
            ? 'border-danger/60 focus-visible:border-danger focus-visible:ring-danger/25'
            : open
              ? 'border-primary ring-primary/30 ring-2'
              : 'border-line hover:border-primary/50 focus-visible:border-primary focus-visible:ring-primary/30',
          showClear && 'pr-10'
        )}
      >
        <motion.span
          aria-hidden="true"
          animate={{ y: open ? -1 : 0, scale: open ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className={cn(
            'shrink-0 transition-colors',
            invalid ? 'text-danger' : open ? 'text-primary' : 'text-ink-muted'
          )}
        >
          <FontAwesomeIcon icon={faCalendarDays} />
        </motion.span>
        <span className="truncate">
          {hasValue ? displayValue : placeholder}
        </span>
      </button>

      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <AnimatePresence>
          {showClear && (
            <motion.button
              type="button"
              aria-label={clearLabel}
              onClick={onClear}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="text-ink-muted hover:bg-danger/10 hover:text-danger focus-visible:ring-danger/40 pointer-events-auto flex size-6 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </motion.button>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}
