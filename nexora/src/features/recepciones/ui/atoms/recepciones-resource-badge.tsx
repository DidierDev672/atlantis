import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGaugeHigh, faLeaf, faWifi } from '@fortawesome/free-solid-svg-icons';
import type { RecepcionesDeviceBudget } from '../../infrastructure/recepciones-resource-detector';

export interface RecepcionesResourceBadgeProps {
  budget: RecepcionesDeviceBudget;
}

/**
 * Átomo visual minimalista (icon-only): muestra únicamente el icono representativo
 * del perfil adaptativo (GPU / RAM / VRAM / Red), dejando el detalle técnico en tooltip y aria-label.
 */
export const RecepcionesResourceBadge = memo(function RecepcionesResourceBadge({
  budget,
}: RecepcionesResourceBadgeProps) {
  try {
    const { ram, gpu, vram, network, policy } = budget;

    if (policy.tier === 'full' && network.tier === 'high') {
      return null;
    }

    const metricsSummary = [
      ram.deviceMemoryGb != null
        ? `RAM ${ram.deviceMemoryGb} GB`
        : `RAM ${ram.tier}`,
      vram.estimatedVramMb != null
        ? `VRAM ~${vram.estimatedVramMb} MB (${vram.tier})`
        : `VRAM ${vram.tier}`,
      `GPU ${gpu.tier}`,
      `Red: ${network.label}`,
    ].join(' · ');

    const icon =
      network.tier === 'offline' || network.tier === 'low'
        ? faWifi
        : policy.tier === 'ultra-light'
          ? faLeaf
          : faGaugeHigh;

    const toneClass =
      policy.tier === 'ultra-light'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-amber-600 dark:text-amber-400';

    const label = `${policy.summaryLabel} — ${metricsSummary}`;

    return (
      <span
        role="status"
        title={label}
        aria-label={label}
        className="border-line bg-panel hover:border-primary/40 grid size-8 shrink-0 place-items-center rounded-full border shadow-2xs transition-colors select-none"
      >
        <FontAwesomeIcon
          icon={icon}
          className={`size-3.5 ${toneClass}`}
          aria-hidden="true"
        />
      </span>
    );
  } catch (err) {
    console.error('Error al renderizar indicador de recursos:', err);
    return null;
  }
});

export default RecepcionesResourceBadge;
