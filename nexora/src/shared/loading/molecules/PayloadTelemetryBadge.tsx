import { motion } from 'motion/react';
import type { PostStage } from '../type';

interface PayloadTelemetryBadgeProps {
  endpoint?: string;
  payloadSummary?: string;
  stage: PostStage;
}

/**
 * Molécula: Chip de telemetría y seguridad para peticiones POST.
 * Da transparencia sobre el endpoint y la transmisión de datos.
 */
export function PayloadTelemetryBadge({
  endpoint,
  payloadSummary,
  stage,
}: PayloadTelemetryBadgeProps) {
  if (!endpoint && !payloadSummary) return null;

  const isTransmitting = stage === 'transmitting';
  const isConfirming = stage === 'confirming';

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-canvas/70 border border-line/70 text-[11px] text-ink-muted font-mono tracking-tight shadow-xs">
      <motion.span
        className={`size-2 rounded-full ${
          isConfirming
            ? 'bg-emerald-500'
            : isTransmitting
            ? 'bg-amber-500'
            : 'bg-primary/70'
        }`}
        animate={{
          scale: isTransmitting ? [1, 1.35, 1] : 1,
          opacity: isTransmitting ? [0.7, 1, 0.7] : 1,
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      {endpoint && <span className="font-semibold text-ink">{endpoint}</span>}
      {endpoint && payloadSummary && <span className="text-line">•</span>}
      {payloadSummary && <span>{payloadSummary}</span>}
    </div>
  );
}
