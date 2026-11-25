import { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTableCellsLarge,
  faTableList,
} from '@fortawesome/free-solid-svg-icons';
import type { RecepcionesViewMode } from '../../domain/stay';

export interface RecepcionesViewSwitchProps {
  viewMode: RecepcionesViewMode;
  onChange: (mode: RecepcionesViewMode) => void;
  className?: string;
}

const VIEW_MODES: ReadonlyArray<{
  mode: RecepcionesViewMode;
  label: string;
  title: string;
  icon: typeof faTableCellsLarge;
}> = [
  {
    mode: 'card',
    label: 'Visualizar en tarjetas',
    title: 'Tarjetas',
    icon: faTableCellsLarge,
  },
  {
    mode: 'table',
    label: 'Visualizar en tabla',
    title: 'Tabla',
    icon: faTableList,
  },
];

/**
 * Switch icon-only con microinteracción animada para alternar entre vista de Tarjetas y Tabla.
 */
export const RecepcionesViewSwitch = memo(function RecepcionesViewSwitch({
  viewMode,
  onChange,
  className = '',
}: RecepcionesViewSwitchProps) {
  const handleSelect = useCallback(
    (mode: RecepcionesViewMode) => {
      try {
        onChange(mode);
      } catch (err) {
        console.error('Error al alternar vista de recepciones:', err);
      }
    },
    [onChange]
  );

  return (
    <div
      role="radiogroup"
      aria-label="Modo de visualización de recepciones"
      className={`border-line bg-canvas/90 inline-flex items-center gap-1 rounded-xl border p-1 shadow-xs ${className}`}
    >
      {VIEW_MODES.map(({ mode, label, title, icon }) => {
        const isActive = viewMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={title}
            onClick={() => handleSelect(mode)}
            className={`focus-visible:ring-primary/40 relative grid size-8 cursor-pointer place-items-center rounded-lg transition focus-visible:ring-2 focus-visible:outline-none ${
              isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeRecepcionesViewSwitchIndicator"
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

export default RecepcionesViewSwitch;
