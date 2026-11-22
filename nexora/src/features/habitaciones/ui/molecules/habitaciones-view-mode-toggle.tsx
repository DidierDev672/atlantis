import { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faGrip,
  faTableCellsLarge,
  faTableList,
} from '@fortawesome/free-solid-svg-icons';

export type HabitacionesViewMode = 'cards' | 'compact' | 'table';

export interface HabitacionesViewModeToggleProps {
  viewMode: HabitacionesViewMode;
  onChange: (mode: HabitacionesViewMode) => void;
  className?: string;
}

const VIEW_MODES: ReadonlyArray<{
  mode: HabitacionesViewMode;
  label: string;
  icon: IconDefinition;
}> = [
  { mode: 'cards', label: 'Tarjetas', icon: faTableCellsLarge },
  { mode: 'compact', label: 'Compacta', icon: faGrip },
  { mode: 'table', label: 'Tabla', icon: faTableList },
];

/**
 * Selector icon-only de modo de visualización (Tarjetas / Compacta / Tabla) con FontAwesome.
 */
export const HabitacionesViewModeToggle = memo(function HabitacionesViewModeToggle({
  viewMode,
  onChange,
  className = '',
}: HabitacionesViewModeToggleProps) {
  const handleSelectMode = useCallback(
    (mode: HabitacionesViewMode) => {
      try {
        onChange(mode);
      } catch (err) {
        console.error('Error al cambiar el modo de visualización:', err);
      }
    },
    [onChange]
  );

  return (
    <div
      role="radiogroup"
      aria-label="Modo de visualización de habitaciones"
      className={`border-line bg-canvas/80 inline-flex items-center gap-1 rounded-xl border p-1 shadow-2xs backdrop-blur-xs ${className}`}
    >
      {VIEW_MODES.map(({ mode, label, icon }) => {
        const isActive = viewMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`Visualizar en modo ${label}`}
            title={label}
            onClick={() => handleSelectMode(mode)}
            className={`focus-visible:ring-primary/40 relative grid size-8 cursor-pointer place-items-center rounded-lg transition focus-visible:ring-2 focus-visible:outline-none ${
              isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeHabitacionesViewModeIndicator"
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="bg-panel absolute inset-0 rounded-lg shadow-xs"
              />
            )}
            <FontAwesomeIcon
              icon={icon}
              className="relative z-10 size-3.5"
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
});

export default HabitacionesViewModeToggle;
