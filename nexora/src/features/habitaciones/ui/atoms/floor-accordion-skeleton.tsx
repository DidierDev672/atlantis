import { memo } from 'react';
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile';
import { useResourcePolicy } from '../../application/resource-policy/use-resource-policy';

export interface FloorAccordionSkeletonProps {
  count?: number;
  animate?: boolean;
}

export const FloorAccordionSkeleton = memo(function FloorAccordionSkeleton({
  count = 3,
  animate,
}: FloorAccordionSkeletonProps) {
  const {
    policy: { enableAnimations, tier },
  } = useDeviceResourceProfile();
  const resourcePolicy = useResourcePolicy();
  const shouldPulse =
    animate ??
    (enableAnimations && resourcePolicy.animation !== 'none' && tier === 'full');

  return (
    <div className="space-y-3" aria-label="Cargando pisos">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`border-line bg-panel rounded-2xl border p-4 sm:p-5 ${
            shouldPulse ? 'animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-line/60 size-10 rounded-xl" />
              <div className="space-y-2">
                <div className="bg-line/70 h-4 w-28 rounded-md" />
                <div className="bg-line/40 h-3 w-40 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-line/50 hidden h-6 w-24 rounded-full sm:block" />
              <div className="bg-line/60 size-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
