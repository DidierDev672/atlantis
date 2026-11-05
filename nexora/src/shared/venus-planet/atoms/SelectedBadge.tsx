import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

type SelectedBadgeProps = {
  px: number;
};

/** Átomo: marca de verificación que aparece con efecto resorte al seleccionar. */
export function SelectedBadge({ px }: SelectedBadgeProps) {
  const size = Math.max(14, px * 0.26);

  return (
    <motion.span
      aria-hidden="true"
      className="bg-primary border-panel absolute flex items-center justify-center rounded-full border-2 text-white shadow-sm"
      style={{
        width: size,
        height: size,
        right: -size * 0.15,
        bottom: -size * 0.15,
        fontSize: size * 0.5,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    >
      <FontAwesomeIcon icon={faCheck} />
    </motion.span>
  );
}
