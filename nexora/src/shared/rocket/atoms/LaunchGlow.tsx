import { motion } from 'motion/react';

import type { RocketPhase } from '../types';

const OPACITY: Record<RocketPhase, number> = {
  idle: 0,
  countdown: 0.15,
  ignition: 0.85,
  ascent: 0.35,
  done: 0,
};

/** Átomo: resplandor naranja sobre la plataforma cuando los motores se encienden. */
export function LaunchGlow({ phase }: { phase: RocketPhase }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute bottom-[3%] left-1/2 h-[16%] w-[75%] -translate-x-1/2 rounded-full bg-orange-400/70 blur-xl"
      initial={false}
      animate={{ opacity: OPACITY[phase] }}
      transition={{ duration: phase === 'ascent' ? 1.4 : 0.4 }}
    />
  );
}
