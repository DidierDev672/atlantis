import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib';
import { RocketLaunchIcon } from '../atoms/RocketLaunchIcon';
import { useBalancedPostLoading } from '../hooks/useBalancedPostLoading';
import { PayloadTelemetryBadge } from '../molecules/PayloadTelemetryBadge';
import { PostStageIndicator } from '../molecules/PostStageIndicator';
import type { PostPayloadLoaderProps, PostStage } from '../type';

const VARIANT_CONTAINERS: Record<NonNullable<PostPayloadLoaderProps['variant']>, string> = {
  overlay:
    'absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-panel/85 dark:bg-panel/90 backdrop-blur-md rounded-[inherit] transition-all',
  fullscreen:
    'fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-panel/90 dark:bg-canvas/90 backdrop-blur-md transition-all',
  block:
    'w-full flex flex-col items-center justify-center p-8 bg-panel/50 dark:bg-panel/40 border border-line/60 rounded-2xl transition-all my-4',
};

/**
 * Organismo: Cargador de carga balanceada especializado en endpoints POST.
 *
 * Combina:
 * - Cohete FontAwesome (faRocket) animado con despegue y estela de partículas.
 * - Carga balanceada en 3 fases: Preparación de payload ➔ Despegue/Transmisión ➔ Confirmación.
 * - Copywriting psicológico orientado a la certidumbre y control del usuario.
 * - Soporte para variantes `overlay`, `fullscreen` y `block`.
 */
export function PostPayloadLoader({
  visible,
  variant = 'overlay',
  endpoint,
  title,
  description,
  payloadSummary,
  stage: controlledStage,
  minDuration = 850,
  className,
}: PostPayloadLoaderProps) {
  // Manejo de tiempos mínimos balanceados y fases automáticas
  const { isBalancedVisible, stage: autoStage } = useBalancedPostLoading({
    active: visible,
    totalMinDuration: minDuration,
  });

  // Permite forzar una fase manual si el consumidor lo requiere
  const currentStage: PostStage = controlledStage ?? autoStage;
  const isDisplaying = controlledStage ? visible : isBalancedVisible;

  return (
    <AnimatePresence>
      {isDisplaying && (
        <motion.div
          key="post-payload-loader"
          role="status"
          aria-live="polite"
          aria-busy="true"
          className={cn(VARIANT_CONTAINERS[variant], className)}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* Tarjeta interior con elevación y estética aeroespacial */}
          <div className="relative flex flex-col items-center justify-center gap-5 max-w-sm w-full py-4">
            {/* Telemetría del endpoint o payload */}
            <PayloadTelemetryBadge
              endpoint={endpoint}
              payloadSummary={payloadSummary}
              stage={currentStage}
            />

            {/* Cohete de despegue animado */}
            <div className="py-2">
              <RocketLaunchIcon stage={currentStage} />
            </div>

            {/* Indicador de fases y texto con psicología */}
            <PostStageIndicator
              stage={currentStage}
              customTitle={title}
              customDescription={description}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
