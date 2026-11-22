import { memo } from 'react';
import { motion } from 'motion/react';

export interface PisoAccordionChevronProps {
  isOpen: boolean;
}

export const PisoAccordionChevron = memo(function PisoAccordionChevron({
  isOpen,
}: PisoAccordionChevronProps) {
  return (
    <motion.span
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="border-line bg-canvas/80 text-ink-muted grid size-8 shrink-0 place-items-center rounded-lg border"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </motion.span>
  );
});
