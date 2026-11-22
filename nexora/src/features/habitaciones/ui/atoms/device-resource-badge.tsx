import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';
import type { DeviceResourceProfile } from '../../infrastructure/device-resource-profile';

export interface DeviceResourceBadgeProps {
  profile: DeviceResourceProfile;
}

/**
 * Átomo: Indicador minimalista y no invasivo que informa cuando el modo de
 * ahorro adaptativo está activo por limitaciones de hardware o red.
 */
export const DeviceResourceBadge = memo(function DeviceResourceBadge({
  profile,
}: DeviceResourceBadgeProps) {
  if (profile.policy.tier === 'full') return null;

  const details = [
    profile.hardware.ramGb != null ? `RAM: ${profile.hardware.ramGb} GB` : null,
    profile.hardware.cpuCores != null
      ? `CPU: ${profile.hardware.cpuCores} núcleos`
      : null,
    `GPU: ${profile.hardware.gpuTier}`,
    `Red: ${profile.network.label}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      role="status"
      title={`${profile.policy.summaryLabel} (${details})`}
      aria-label={`${profile.policy.summaryLabel}. ${details}`}
      className="border-line bg-panel text-ink-muted fixed bottom-5 left-5 z-20 hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-sm sm:inline-flex"
    >
      <FontAwesomeIcon
        icon={faLeaf}
        className="size-3 text-emerald-600 dark:text-emerald-400"
        aria-hidden="true"
      />
      <span>
        {profile.policy.tier === 'ultra-light'
          ? 'Modo ligero activo'
          : 'Modo balanceado'}
      </span>
    </div>
  );
});

export default DeviceResourceBadge;
