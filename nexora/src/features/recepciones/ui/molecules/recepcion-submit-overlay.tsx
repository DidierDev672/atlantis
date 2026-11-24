import { Suspense, lazy, memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket } from '@fortawesome/free-solid-svg-icons';
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile';

const LazyRocket = lazy(() =>
  import('../../../../shared/rocket/organisms/Rocket').then((m) => ({
    default: m.Rocket,
  }))
);

export interface RecepcionSubmitOverlayProps {
  visible: boolean;
  stage: 'idle' | 'preparing' | 'transmitting' | 'confirming';
}

/**
 * Molécula: Overlay perezoso con animación Rocket adaptada a GPU/VRAM durante POST /stay.
 */
export const RecepcionSubmitOverlay = memo(function RecepcionSubmitOverlay({
  visible,
  stage,
}: RecepcionSubmitOverlayProps) {
  const {
    policy: { enableBackdropBlur, enableAnimations, tier },
  } = useDeviceResourceProfile();

  const useLightweightBadge = !enableAnimations || tier === 'ultra-light';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 ${
            enableBackdropBlur ? 'backdrop-blur-xs' : ''
          }`}
          initial={enableAnimations ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={enableAnimations ? { opacity: 0 } : undefined}
        >
          <motion.div
            initial={enableAnimations ? { opacity: 0, scale: 0.95, y: 12 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              enableAnimations ? { opacity: 0, scale: 0.95, y: 12 } : undefined
            }
            className="bg-panel border-line flex w-full max-w-sm flex-col items-center rounded-3xl border p-8 text-center shadow-2xl"
          >
            {useLightweightBadge ? (
              <div className="ring-primary/20 bg-primary/10 text-primary grid size-20 place-items-center rounded-2xl ring-1">
                <FontAwesomeIcon
                  icon={faRocket}
                  className="size-8"
                  aria-hidden="true"
                />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="bg-line/35 size-24 animate-pulse rounded-2xl" />
                }
              >
                <LazyRocket
                  size="md"
                  autoLaunch={enableAnimations}
                  loop={tier === 'full'}
                  showStars={tier === 'full'}
                  interactive={false}
                  timing={{ ignitionMs: 600, ascentMs: 1400 }}
                  className="ring-primary/20 bg-canvas/60 shadow-xl ring-1"
                />
              </Suspense>
            )}
            <div className="mt-5 space-y-1.5">
              <h4 className="text-ink text-lg font-bold">
                {stage === 'preparing'
                  ? 'Preparando recepción…'
                  : stage === 'transmitting'
                    ? 'Registrando estadía…'
                    : '¡Recepción confirmada!'}
              </h4>
              <p className="text-ink-muted text-xs leading-relaxed">
                Consumiendo endpoint POST /stay con balanceo de carga. Tus datos
                están seguros.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default RecepcionSubmitOverlay;
