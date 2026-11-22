import { Suspense, lazy, memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HabitacionesErrorBoundary } from '../molecules/habitaciones-error-boundary';

const LazyRocket = lazy(() =>
  import('../../../../shared/rocket/organisms/Rocket').then((m) => ({
    default: m.Rocket,
  }))
);

export interface AsignarHuespedRocketOverlayProps {
  visible: boolean;
  roomNumber: string;
}

/**
 * Organismo: Overlay de lanzamiento con Rocket mientras se guarda la asignación de huésped.
 */
export const AsignarHuespedRocketOverlay = memo(
  function AsignarHuespedRocketOverlay({
    visible,
    roomNumber,
  }: AsignarHuespedRocketOverlayProps) {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            key="asignar-huesped-rocket-overlay"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22 }}
              className="border-line/70 bg-panel/95 flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border p-6 text-center shadow-2xl"
            >
              <HabitacionesErrorBoundary fallbackMessage="Procesando asignación de huésped…">
                <Suspense
                  fallback={
                    <div className="bg-line/40 size-36 animate-pulse rounded-2xl" />
                  }
                >
                  <LazyRocket
                    loop
                    size="lg"
                    interactive={false}
                    className="border-line/60 bg-canvas/85 border shadow-inner"
                  />
                </Suspense>
              </HabitacionesErrorBoundary>

              <div className="space-y-1">
                <p className="text-ink text-sm font-bold">
                  Guardando asignación · Habitación {roomNumber}
                </p>
                <p className="text-ink-muted text-xs leading-relaxed">
                  Registrando estancia y actualizando el estado de la
                  habitación…
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

export default AsignarHuespedRocketOverlay;
