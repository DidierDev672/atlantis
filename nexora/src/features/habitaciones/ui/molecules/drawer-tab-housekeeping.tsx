import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faEye,
  faScrewdriverWrench,
  faTags,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import {
  matchesHabitacionStatus,
  type RoomRow,
} from '../../domain/habitacion-lista';

export interface DrawerTabHousekeepingProps {
  room: RoomRow;
  actionLoading: boolean;
  onChangeStatus: (newStatus: string) => Promise<void> | void;
  onOpenTarifas?: () => void;
  onOpenFullDetail?: (room: RoomRow) => void;
}

const OPERATIONAL_STATES = [
  {
    key: 'available',
    label: 'Disponible (Limpia y lista)',
    icon: faCircleCheck,
    iconClass: 'text-emerald-500',
    activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  },
  {
    key: 'cleaning',
    label: 'Por Limpiar (Housekeeping)',
    icon: faWandMagicSparkles,
    iconClass: 'text-amber-500',
    activeClass: 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
  {
    key: 'maintenance',
    label: 'Mantenimiento / Bloqueada',
    icon: faScrewdriverWrench,
    iconClass: 'text-rose-500',
    activeClass: 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300',
  },
] as const;

/**
 * Molécula: Pestaña 'Estado / Aseo' del Drawer Operativo de Habitación.
 */
export const DrawerTabHousekeeping = memo(function DrawerTabHousekeeping({
  room,
  actionLoading,
  onChangeStatus,
  onOpenTarifas,
  onOpenFullDetail,
}: DrawerTabHousekeepingProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <h4 className="text-ink-muted text-xs font-bold tracking-wider uppercase">
          Cambiar Estado Operativo
        </h4>

        {OPERATIONAL_STATES.map((item) => {
          const isCurrent = matchesHabitacionStatus(room.status, item.key);
          return (
            <button
              key={item.key}
              type="button"
              disabled={actionLoading || isCurrent}
              onClick={() => void onChangeStatus(item.key)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-left text-xs font-semibold transition-all disabled:cursor-default ${
                isCurrent
                  ? item.activeClass
                  : 'border-line bg-panel text-ink hover:border-primary/40'
              }`}
            >
              <span className="inline-flex items-center gap-2.5">
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`size-4 ${item.iconClass}`}
                />
                <span>{item.label}</span>
              </span>
              {isCurrent && (
                <span className="rounded-full bg-current/15 px-2 py-0.5 text-[10px] font-bold">
                  Actual
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-line/70 space-y-2 border-t pt-3.5">
        <h4 className="text-ink-muted text-xs font-bold tracking-wider uppercase">
          Configuración de la Habitación
        </h4>

        {onOpenTarifas && (
          <button
            type="button"
            onClick={onOpenTarifas}
            className="border-line bg-panel text-ink hover:border-primary/40 inline-flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-semibold transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faTags} className="text-primary size-3.5" />
              <span>Gestionar tarifas de la habitación</span>
            </span>
            <span className="text-primary text-[11px]">Abrir</span>
          </button>
        )}

        {onOpenFullDetail && (
          <button
            type="button"
            onClick={() => onOpenFullDetail(room)}
            className="border-line bg-panel text-ink hover:border-primary/40 inline-flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-semibold transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faEye} className="text-secondary size-3.5" />
              <span>Ver detalle técnico y auditoría</span>
            </span>
            <span className="text-primary text-[11px]">Ver</span>
          </button>
        )}
      </div>
    </div>
  );
});

export default DrawerTabHousekeeping;
