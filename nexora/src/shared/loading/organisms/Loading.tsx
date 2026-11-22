import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib';
import { useDelayVisibility } from '../hooks/useDelayedVisibility';
import { DEFAULT_SIZE_BY_VARIANT } from '../lib/sizes';
import { LoadingMessage } from '../molecules/LoadingMessage';
import { SaturnLoader } from '../molecules/SaturnLoader';
import type { LoadingProps, LoadingVariant } from '../type';
import { DEFAULT_HOTEL_LOGO, useTemaStore } from '../../../features/tema/application/tema-store';

const CONTAINER_STYLES: Record<LoadingVariant, string> = {
  inline: 'inline-flex flex-row items-center gap-2.5 py-1',
  block: 'flex w-full flex-col items-center justify-center gap-3 py-10',
  overlay:
    'bg-panel/70 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[inherit] backdrop-blur-sm',
  fullscreen:
    'bg-panel/80 fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-sm',
};

/**
 * Organismo: loading reutilizable con Saturno animado y branding representativo del hotel.
 *
 * - `inline`     → dentro de un dropdown, botón o lista.
 * - `block`      → en lugar del contenido de una tabla o tarjeta.
 * - `overlay`    → sobre un formulario (el padre necesita `relative`).
 * - `fullscreen` → bloquea toda la pantalla (envíos largos).
 */
export function Loading({
  visible = true,
  variant = 'block',
  size,
  label = 'Cargando…',
  description,
  delay = 150,
  minDuration = 400,
  className,
}: LoadingProps) {
  const show = useDelayVisibility(visible, { delay, minDuration });
  const resolvedSize = size ?? DEFAULT_SIZE_BY_VARIANT[variant];
  const isInline = variant === 'inline';

  const hotelLogo = useTemaStore((state) => state.hotelLogo);
  const hotelName = useTemaStore((state) => state.hotelName);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
          className={cn(CONTAINER_STYLES[variant], className)}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {/* Logo representativo del hotel en la pantalla de carga / bienvenida */}
          {(variant === 'fullscreen' || variant === 'block' || variant === 'overlay') && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.2 }}
              className="flex items-center gap-2.5 rounded-2xl border border-line/60 bg-panel/90 px-3.5 py-1.5 shadow-xs mb-1 backdrop-blur-xs"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-cream text-primary overflow-hidden shadow-xs shrink-0">
                <img
                  src={hotelLogo || DEFAULT_HOTEL_LOGO}
                  alt={hotelName || 'Logo del proyecto'}
                  className={hotelLogo ? 'size-full object-cover' : 'size-full object-contain p-0.5'}
                />
              </span>
              <div className="text-left">
                <p className="text-[11px] font-bold text-ink leading-tight">Aloja</p>
                <p className="text-[10px] text-ink-muted leading-tight truncate max-w-[150px]">
                  {hotelName}
                </p>
              </div>
            </motion.div>
          )}

          <SaturnLoader size={resolvedSize} />
          <LoadingMessage
            label={label}
            description={description}
            size={resolvedSize}
            align={isInline ? 'left' : 'center'}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
