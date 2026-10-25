import { AnimatePresence, motion } from 'motion/react';

import { cn } from '../../lib'; // ajusta a la ruta

import { useDelayVisibility } from '../hooks/useDelayedVisibility';
import { DEFAULT_SIZE_BY_VARIANT } from '../lib/sizes';
import { LoadingMessage } from '../molecules/LoadingMessage';
import { SaturnLoader } from '../molecules/SaturnLoader';
import type { LoadingProps, LoadingVariant } from '../type';

const CONTAINER_STYLES: Record<LoadingVariant, string> = {
  inline: 'inline-flex flex-row items-center gap-2.5 py-1',
  block: 'flex w-full flex-col items-center justify-center gap-3 py-10',
  overlay:
    'bg-panel/70 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[inherit] backdrop-blur-sm',
  fullscreen:
    'bg-panel/80 fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-sm',
};

/**
 * Organismo: loading reutilizable con Saturno animado.
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
