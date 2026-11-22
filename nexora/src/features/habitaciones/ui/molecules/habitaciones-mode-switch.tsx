import { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faList, faPlus } from '@fortawesome/free-solid-svg-icons';

export type HabitacionesTabKey = 'lista' | 'registro';

export interface HabitacionesModeSwitchProps {
  activeTab: HabitacionesTabKey;
  onChange: (tab: HabitacionesTabKey) => Promise<void> | void;
}

const TABS: ReadonlyArray<{
  key: HabitacionesTabKey;
  label: string;
  icon: IconDefinition;
}> = [
  { key: 'lista', label: 'Lista de habitaciones', icon: faList },
  { key: 'registro', label: 'Registrar habitación', icon: faPlus },
];

/**
 * Molécula: Switch minimalista icon-only (FontAwesome) para alternar entre Lista y Crear habitación.
 */
export const HabitacionesModeSwitch = memo(function HabitacionesModeSwitch({
  activeTab,
  onChange,
}: HabitacionesModeSwitchProps) {
  const handleSelect = useCallback(
    async (tab: HabitacionesTabKey) => {
      try {
        await onChange(tab);
      } catch (err) {
        console.error('Error al cambiar vista de habitaciones:', err);
      }
    },
    [onChange]
  );

  return (
    <div
      role="tablist"
      aria-label="Cambiar entre lista y registro de habitaciones"
      className="border-line bg-panel/95 inline-flex items-center gap-1 rounded-full border p-1 shadow-lg ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10"
    >
      {TABS.map(({ key, label, icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            title={label}
            onClick={() => void handleSelect(key)}
            className={`focus-visible:ring-primary/40 relative grid size-8 cursor-pointer place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              isActive
                ? 'text-white'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="habitacionesPageModeSwitchIndicator"
                transition={{ type: 'spring', stiffness: 480, damping: 32 }}
                className="bg-primary absolute inset-0 rounded-full shadow-xs"
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

export default HabitacionesModeSwitch;
