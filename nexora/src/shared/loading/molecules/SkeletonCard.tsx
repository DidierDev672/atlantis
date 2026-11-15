import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib';
import { Skeleton } from '../atoms/Skeleton';
import type { SkeletonCardProps } from '../type';

/**
 * Molécula: Tarjeta Skeleton reutilizable (`/shared/loading`).
 * Simula una imagen rectangular o avatar circular, una línea de título
 * y dos líneas de descripción mientras `isLoading` sea `true`.
 */
export function SkeletonCard({
  mediaShape = 'rectangular',
  isLoading = true,
  children,
  animation = 'shimmer',
  className,
}: SkeletonCardProps) {
  const isCircular = mediaShape === 'circular';

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton-card"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Cargando contenido"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            'border-line bg-panel w-full rounded-3xl border p-5 shadow-xs',
            className
          )}
        >
          {isCircular ? (
            <div className="flex items-start gap-4">
              {/* Avatar circular */}
              <Skeleton
                variant="circular"
                animation={animation}
                width={56}
                height={56}
                className="shrink-0"
              />

              <div className="min-w-0 flex-1 space-y-3 pt-1">
                {/* Título de línea */}
                <Skeleton
                  variant="text"
                  animation={animation}
                  className="h-5 w-2/3"
                />
                {/* Dos líneas de descripción */}
                <Skeleton variant="text" animation={animation} lines={2} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Imagen rectangular */}
              <Skeleton
                variant="rounded"
                animation={animation}
                className="h-44 w-full"
              />

              <div className="space-y-3">
                {/* Título de línea */}
                <Skeleton
                  variant="text"
                  animation={animation}
                  className="h-5 w-3/5"
                />
                {/* Dos líneas de descripción */}
                <Skeleton variant="text" animation={animation} lines={2} />
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="skeleton-card-content"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
