import { Suspense, lazy, memo, useCallback, useRef, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faDoorOpen,
  faTableCellsLarge,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import type { RecepcionesDeviceBudget } from '../../infrastructure/recepciones-resource-detector';
import {
  getRecepcionesPanelId,
  getRecepcionesTabId,
  type RecepcionesTabKey,
} from '../../domain/recepciones-tabs';

const LazyRecepcionesResourceBadge = lazy(
  () => import('../atoms/recepciones-resource-badge')
);

const TABS: ReadonlyArray<{
  key: RecepcionesTabKey;
  label: string;
  icon: typeof faTableCellsLarge;
}> = [
  { key: 'lista', label: 'Listado de recepciones', icon: faTableCellsLarge },
  { key: 'salidas', label: 'Salidas de recepción', icon: faDoorOpen },
  { key: 'nuevo', label: 'Formulario de nuevo', icon: faUserPlus },
];

export type { RecepcionesTabKey };

export interface RecepcionesTabBarProps {
  baseId: string;
  activeTab: RecepcionesTabKey;
  resourceBudget: RecepcionesDeviceBudget;
  onSelectTab: (tab: RecepcionesTabKey) => void;
  onGoToLista: () => void;
}

/**
 * Molécula: Barra de pestañas accesible (WAI-ARIA Tabs) con roving tabindex,
 * navegación por teclado (ArrowLeft, ArrowRight, Home, End) e indicador de recursos.
 */
export const RecepcionesTabBar = memo(function RecepcionesTabBar({
  baseId,
  activeTab,
  resourceBudget,
  onSelectTab,
  onGoToLista,
}: RecepcionesTabBarProps) {
  const tabButtonRefs = useRef<
    Partial<Record<RecepcionesTabKey, HTMLButtonElement | null>>
  >({});

  const handleTabKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      try {
        let targetIndex: number | null = null;
        if (e.key === 'ArrowRight') {
          targetIndex = (currentIndex + 1) % TABS.length;
        } else if (e.key === 'ArrowLeft') {
          targetIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        } else if (e.key === 'Home') {
          targetIndex = 0;
        } else if (e.key === 'End') {
          targetIndex = TABS.length - 1;
        }

        if (targetIndex === null) return;
        e.preventDefault();
        const nextTab = TABS[targetIndex].key;
        onSelectTab(nextTab);
        tabButtonRefs.current[nextTab]?.focus();
      } catch (err) {
        console.error('Error en navegación por teclado de pestañas:', err);
      }
    },
    [onSelectTab]
  );

  return (
    <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b pb-1">
      <div
        role="tablist"
        aria-label="Secciones de recepciones"
        className="flex items-center gap-2 overflow-x-auto"
      >
        {TABS.map(({ key, label, icon }, index) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              ref={(el) => {
                tabButtonRefs.current[key] = el;
              }}
              id={getRecepcionesTabId(baseId, key)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={getRecepcionesPanelId(baseId, key)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(key)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={`focus-visible:ring-primary/40 relative flex shrink-0 cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition focus-visible:ring-2 focus-visible:outline-none ${
                isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FontAwesomeIcon
                icon={icon}
                className="size-3.5"
                aria-hidden="true"
              />
              <span>{label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeRecepcionesTabIndicator"
                  className="bg-primary absolute inset-x-0 bottom-0 h-0.5"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Suspense fallback={null}>
          <LazyRecepcionesResourceBadge budget={resourceBudget} />
        </Suspense>
        {activeTab === 'nuevo' && (
          <button
            type="button"
            onClick={onGoToLista}
            className="text-primary inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold hover:underline"
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="size-3"
              aria-hidden="true"
            />
            <span>Volver al listado</span>
          </button>
        )}
      </div>
    </div>
  );
});

export default RecepcionesTabBar;
