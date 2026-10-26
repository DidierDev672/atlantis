import { motion } from 'framer-motion';

type CalendarActionProps = {
  onClick: () => void;
  children: React.ReactNode;
};

/** Átomo: botón de texto del pie del calendario ("Hoy", "Limpiar"). */
export function CalendarAction({ onClick, children }: CalendarActionProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="text-primary hover:bg-primary/10 focus-visible:ring-primary/50 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2"
    >
      {children}
    </motion.button>
  );
}
