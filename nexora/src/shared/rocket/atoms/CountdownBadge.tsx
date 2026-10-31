import { motion } from 'framer-motion';

/** Átomo: número grande de la cuenta regresiva (cada número entra con un "pop"). */
export function CountdownBadge({ count }: { count: number }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-[10%] flex justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.4 }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        key={count}
        className="text-ink text-5xl font-bold tabular-nums"
        initial={{ scale: 1.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      >
        {count}
      </motion.span>
    </motion.div>
  );
}
