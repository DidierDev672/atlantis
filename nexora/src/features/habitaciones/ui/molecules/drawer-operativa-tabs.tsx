import { memo, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBagShopping,
  faBed,
  faBroom,
} from '@fortawesome/free-solid-svg-icons';
import type { DrawerTabKey } from '../organisms/habitacion-operativa-drawer';

export interface DrawerOperativaTabsProps {
  activeTab: DrawerTabKey;
  consumptionsCount: number;
  onChangeTab: (tab: DrawerTabKey) => Promise<void> | void;
}

const TAB_ITEMS: ReadonlyArray<{
  key: DrawerTabKey;
  label: string;
  hint: string;
  icon: IconDefinition;
}> = [
  {
    key: 'summary',
    label: 'Estadía',
    hint: 'Fechas, huéspedes y saldo de cuenta',
    icon: faBed,
  },
  {
    key: 'consumptions',
    label: 'Consumos',
    hint: 'Buscar y cargar productos a la habitación',
    icon: faBagShopping,
  },
  {
    key: 'housekeeping',
    label: 'Estado',
    hint: 'Cambiar disponibilidad, aseo o mantenimiento',
    icon: faBroom,
  },
];

/**
 * Molécula: Barra de pestañas minimalista centrada en iconos FontAwesome
 * con guía contextual sutil para facilitar la lectura del recepcionista.
 */
export const DrawerOperativaTabs = memo(function DrawerOperativaTabs({
  activeTab,
  consumptionsCount,
  onChangeTab,
}: DrawerOperativaTabsProps) {
  const handleSelect = useCallback(
    async (tab: DrawerTabKey) => {
      try {
        await onChangeTab(tab);
      } catch (err) {
        console.error('Error al cambiar pestaña del drawer:', err);
      }
    },
    [onChangeTab]
  );

  const activeMeta = useMemo(
    () => TAB_ITEMS.find((item) => item.key === activeTab) ?? TAB_ITEMS[0],
    [activeTab]
  );

  return (
    <div className="border-line bg-panel/95 border-b px-4 pt-2 pb-2 lg:px-5">
      <div
        role="tablist"
        aria-label="Secciones de la habitación"
        className="flex items-center justify-between gap-1"
      >
        {TAB_ITEMS.map(({ key, label, hint, icon }) => {
          const isActive = activeTab === key;
          const showBadge = key === 'consumptions' && consumptionsCount > 0;

          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`${label}: ${hint}`}
              title={`${label} — ${hint}`}
              onClick={() => void handleSelect(key)}
              className={`focus-visible:ring-primary/40 relative flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas/60 font-medium'
              }`}
            >
              <FontAwesomeIcon
                icon={icon}
                className="size-3.5 shrink-0"
                aria-hidden="true"
              />
              {isActive && (
                <span className="truncate text-[11px] lg:text-xs">{label}</span>
              )}
              {showBadge && (
                <span className="bg-primary/12 text-primary rounded-full px-1.5 py-0.2 text-[10px] leading-tight font-bold tabular-nums">
                  {consumptionsCount}
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId="operativaDrawerActiveUnderline"
                  transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                  className="bg-primary absolute right-3 bottom-0 left-3 h-0.5 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-ink-muted mt-1.5 truncate text-center text-[11px]">
        <span className="text-ink font-semibold">{activeMeta.label}:</span>{' '}
        {activeMeta.hint}
      </p>
    </div>
  );
});

export default DrawerOperativaTabs;
