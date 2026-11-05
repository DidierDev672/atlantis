import { cn } from '../../lib'; // ajusta a la ruta de tu helper `cn`

import { LABEL_TEXT, SIZE_PX } from '../lib/config';
import type { LabelPosition, PlanetSize } from '../lib/types';

type PlanetLabelProps = {
  label: string;
  description?: string;
  size: PlanetSize;
  position: LabelPosition;
  selected?: boolean;
  disabled?: boolean;
};

const SHADOW = { textShadow: '0 1px 3px rgba(0,0,0,0.85)' };

/** Molécula: texto principal + descripción del planeta (Recepcionista, Huéspedes, Administrador…). */
export function PlanetLabel({
  label,
  description,
  size,
  position,
  selected = false,
  disabled = false,
}: PlanetLabelProps) {
  const text = LABEL_TEXT[size];
  const inside = position === 'inside';

  return (
    <span
      className={cn(
        'flex flex-col',
        position === 'right'
          ? 'items-start text-left'
          : 'items-center text-center'
      )}
      style={
        position === 'bottom'
          ? { maxWidth: Math.max(SIZE_PX[size] * 1.6, 96) }
          : undefined
      }
    >
      <span
        className={cn(
          text.label,
          'leading-tight font-semibold',
          inside ? 'text-white' : selected ? 'text-primary' : 'text-ink',
          disabled && !inside && 'text-ink-muted'
        )}
        style={inside ? SHADOW : undefined}
      >
        {label}
      </span>
      {description && (
        <span
          className={cn(
            text.description,
            'leading-snug',
            inside ? 'text-white/85' : 'text-ink-muted'
          )}
          style={inside ? SHADOW : undefined}
        >
          {description}
        </span>
      )}
    </span>
  );
}
