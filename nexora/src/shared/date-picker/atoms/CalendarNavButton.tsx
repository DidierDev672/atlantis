import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

type CalendarNavButtonProps = {
  direction: 'prev' | 'next';
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

/** Átomo: botón circular para cambiar de mes. */
export function CalendarNavButton({
  direction,
  label,
  disabled,
  onClick,
}: CalendarNavButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className="text-ink-soft hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/50 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current"
    >
      <FontAwesomeIcon
        icon={direction === 'prev' ? faChevronLeft : faChevronRight}
        className="text-xs"
      />
    </motion.button>
  );
}
