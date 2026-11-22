import { memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faScrewdriverWrench,
  faUserCheck,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import {
  isHabitacionOcupada,
  matchesHabitacionStatus,
} from '../../domain/habitacion-lista';

export interface DrawerHousekeepingQuickGridProps {
  currentStatus: string;
  actionLoading: boolean;
  onChangeStatus: (newStatus: string) => Promise<void> | void;
}

const ASEO_OPTIONS = [
  {
    key: 'available',
    label: 'Disponible',
    icon: faCircleCheck,
    activeClass:
      'border-emerald-500/50 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'occupied',
    label: 'Ocupadas',
    icon: faUserCheck,
    activeClass:
      'border-rose-500/50 bg-rose-500/12 text-rose-700 dark:text-rose-300',
  },
  {
    key: 'cleaning',
    label: 'Limpiar',
    icon: faWandMagicSparkles,
    activeClass:
      'border-sky-500/50 bg-sky-500/12 text-sky-700 dark:text-sky-300',
  },
  {
    key: 'maintenance',
    label: 'Mantenimiento',
    icon: faScrewdriverWrench,
    activeClass:
      'border-amber-500/50 bg-amber-500/12 text-amber-700 dark:text-amber-300',
  },
] as const;

/**
 * Molécula: Grid rápido de estados operativos "Aseo de hoy".
 */
export const DrawerHousekeepingQuickGrid = memo(
  function DrawerHousekeepingQuickGrid({
    currentStatus,
    actionLoading,
    onChangeStatus,
  }: DrawerHousekeepingQuickGridProps) {
    const handleSelect = useCallback(
      async (targetKey: string) => {
        try {
          await onChangeStatus(targetKey);
        } catch (err) {
          console.error('Error al cambiar estado de aseo:', err);
        }
      },
      [onChangeStatus]
    );

    return (
      <div className="space-y-2">
        <h4 className="text-ink-muted text-xs font-bold tracking-wider uppercase">
          Aseo de hoy
        </h4>

        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Aseo de hoy"
        >
          {ASEO_OPTIONS.map((item) => {
            const isCurrent =
              item.key === 'occupied'
                ? isHabitacionOcupada(currentStatus)
                : matchesHabitacionStatus(currentStatus, item.key);

            return (
              <button
                key={item.key}
                type="button"
                disabled={actionLoading || isCurrent}
                onClick={() => void handleSelect(item.key)}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[11px] font-semibold transition-all disabled:cursor-default ${
                  isCurrent
                    ? item.activeClass
                    : 'border-line bg-panel text-ink-muted hover:border-primary/40 hover:text-ink'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="size-3 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

export default DrawerHousekeepingQuickGrid;
