import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { fadeUp } from '../../../../design-tokens/motion';
import { cn } from '../lib/cn';
import { DEFAULT_HOTEL_LOGO, useTemaStore } from '../../application/tema-store';

export interface LoaderProps {
  label?: string;
  size?: number;
  fullScreen?: boolean;
  overlay?: boolean;
  visible?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Loader({
  label,
  size = 24,
  fullScreen = false,
  overlay = false,
  visible = true,
  className,
  children,
}: LoaderProps) {
  const hotelLogo = useTemaStore((state) => state.hotelLogo);
  const hotelName = useTemaStore((state) => state.hotelName);

  const spinner = (
    <>
      {(fullScreen || overlay) && (
        <div className="flex items-center gap-2 rounded-2xl border border-line/60 bg-panel/95 px-3.5 py-1.5 shadow-sm mb-1 backdrop-blur-xs">
          <span className="grid size-7 place-items-center rounded-lg bg-cream text-primary overflow-hidden shadow-xs shrink-0">
            <img
              src={hotelLogo || DEFAULT_HOTEL_LOGO}
              alt={hotelName || 'Logo del proyecto'}
              className={hotelLogo ? 'size-full object-cover' : 'size-full object-contain p-0.5'}
            />
          </span>
          <div className="text-left">
            <p className="text-[11px] font-bold text-ink leading-tight">Nexora</p>
            <p className="text-[10px] text-ink-muted leading-tight truncate max-w-[150px]">
              {hotelName}
            </p>
          </div>
        </div>
      )}

      <motion.span
        className="border-primary/20 border-t-primary inline-block rounded-full border-2"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        aria-hidden="true"
      />
      {label ? (
        <span className="text-ink-muted text-sm font-medium">{label}</span>
      ) : null}
      {children}
    </>
  );

  const block = (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Cargando'}
      className={cn(
        'inline-flex flex-col items-center justify-center gap-3',
        fullScreen && 'min-h-[60vh] w-full',
        className
      )}
    >
      {spinner}
    </motion.div>
  );

  if (overlay) {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            aria-hidden={!visible}
          >
            {block}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return <AnimatePresence>{visible && block}</AnimatePresence>;
}
