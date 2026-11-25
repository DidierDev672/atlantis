import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import { useResourcePolicy } from '../../application/resource-policy/use-resource-policy';
import type { ResourcePolicy } from '../../domain/resource-policy/types';
import type { DeviceResourceProfile } from '../../infrastructure/device-resource-profile';

export interface DeviceResourceBadgeProps {
  profile: DeviceResourceProfile;
  policy?: ResourcePolicy;
}

/**
 * Átomo: Indicador minimalista y no invasivo del modo adaptativo de recursos.
 * Nunca consulta `navigator` directamente: solo lee la política heredada o recibida.
 */
export const DeviceResourceBadge = memo(function DeviceResourceBadge({
  profile,
  policy: policyProp,
}: DeviceResourceBadgeProps) {
  const inheritedPolicy = useResourcePolicy();
  const effectivePolicy = policyProp ?? inheritedPolicy;

  const isConstrained =
    effectivePolicy.deviceTier !== 'high' ||
    effectivePolicy.networkTier !== 'high' ||
    profile.policy.tier !== 'full';

  if (!isConstrained) return null;

  const isLowMode =
    effectivePolicy.deviceTier === 'low' ||
    effectivePolicy.networkTier === 'low' ||
    profile.policy.tier === 'ultra-light';

  const details = [
    profile.hardware.ramGb != null ? `RAM: ${profile.hardware.ramGb} GB` : null,
    profile.hardware.cpuCores != null
      ? `CPU: ${profile.hardware.cpuCores} núcleos`
      : null,
    `Dispositivo: ${effectivePolicy.deviceTier}`,
    `Red: ${effectivePolicy.networkTier}`,
    `Animación: ${effectivePolicy.animation}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const tooltipLabel = isLowMode
    ? `${profile.policy.summaryLabel} (${details})`
    : `Perfil de recursos adaptativo (${details})`;

  return (
    <div
      role="status"
      title={tooltipLabel}
      aria-label={tooltipLabel}
      className={`border-line bg-panel text-ink-muted fixed bottom-5 left-5 z-20 hidden items-center justify-center rounded-full border text-[11px] font-medium shadow-sm sm:inline-flex ${
        isLowMode ? 'gap-1.5 px-3 py-1.5' : 'size-9'
      }`}
    >
      <FontAwesomeIcon
        icon={isLowMode ? faLeaf : faScaleBalanced}
        className={
          isLowMode
            ? 'size-3 text-emerald-600 dark:text-emerald-400'
            : 'size-4 text-primary'
        }
        aria-hidden="true"
      />
      {isLowMode && <span>Modo ligero activo</span>}
    </div>
  );
});

export default DeviceResourceBadge;
