import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBarsStaggered,
  faTableCellsLarge,
} from '@fortawesome/free-solid-svg-icons';

export type LayoutViewMode = 'masonry' | 'grid';

export interface LayoutViewSwitchProps {
  mode: LayoutViewMode;
  onChange: (mode: LayoutViewMode) => void;
  className?: string;
}

/**
 * Switch accesible y animado para alternar la visualización del catálogo
 * entre formato Cascada (Masonry) y Cuadrícula (Grid) usando iconos de FontAwesome.
 */
export function LayoutViewSwitch({
  mode,
  onChange,
  className = '',
}: LayoutViewSwitchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Modo de visualización de categorías"
      className={`border-line bg-canvas/80 inline-flex items-center gap-1 rounded-2xl border p-1 backdrop-blur-xs select-none ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'masonry'}
        onClick={() => onChange('masonry')}
        title="Visualización en Cascada (Masonry)"
        className={`relative inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
          mode === 'masonry'
            ? 'text-white'
            : 'text-ink-muted hover:text-ink hover:bg-panel/60'
        }`}
      >
        {mode === 'masonry' && (
          <motion.div
            layoutId="activeLayoutPill"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="bg-primary absolute inset-0 rounded-xl shadow-xs"
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faBarsStaggered} className="size-3" />
          <span>Masonry</span>
        </span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mode === 'grid'}
        onClick={() => onChange('grid')}
        title="Visualización en Cuadrícula (Grid)"
        className={`relative inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
          mode === 'grid'
            ? 'text-white'
            : 'text-ink-muted hover:text-ink hover:bg-panel/60'
        }`}
      >
        {mode === 'grid' && (
          <motion.div
            layoutId="activeLayoutPill"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="bg-primary absolute inset-0 rounded-xl shadow-xs"
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faTableCellsLarge} className="size-3" />
          <span>Grid</span>
        </span>
      </button>
    </div>
  );
}
