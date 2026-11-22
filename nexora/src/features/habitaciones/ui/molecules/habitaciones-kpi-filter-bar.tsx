import { memo, useCallback, useMemo } from 'react';
import {
  isHabitacionOcupada,
  matchesHabitacionStatus,
  type RoomRow,
} from '../../domain/habitacion-lista';
import { KpiFilterPill } from '../atoms/kpi-filter-pill';

export interface HabitacionesKpiFilterBarProps {
  rooms: RoomRow[];
  activeStatuses: string[];
  onSelectStatus: (status: string) => void;
}

/**
 * Molécula: Barra minimalista de píldoras KPI interactivas para filtrar por estado.
 */
export const HabitacionesKpiFilterBar = memo(function HabitacionesKpiFilterBar({
  rooms,
  activeStatuses,
  onSelectStatus,
}: HabitacionesKpiFilterBarProps) {
  const counts = useMemo(() => {
    try {
      const total = rooms.length;
      let available = 0;
      let occupied = 0;
      let cleaning = 0;
      let maintenance = 0;

      for (const room of rooms) {
        if (isHabitacionOcupada(room.status)) {
          occupied += 1;
        } else if (matchesHabitacionStatus(room.status, 'available')) {
          available += 1;
        } else if (matchesHabitacionStatus(room.status, 'cleaning')) {
          cleaning += 1;
        } else if (matchesHabitacionStatus(room.status, 'maintenance')) {
          maintenance += 1;
        }
      }

      const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return { total, available, occupied, cleaning, maintenance, occupancyPct };
    } catch (err) {
      console.error('Error al calcular KPIs de habitaciones:', err);
      return {
        total: 0,
        available: 0,
        occupied: 0,
        cleaning: 0,
        maintenance: 0,
        occupancyPct: 0,
      };
    }
  }, [rooms]);

  const handleToggle = useCallback(
    (target: string) => {
      try {
        onSelectStatus(target);
      } catch (err) {
        console.error('Error al filtrar por KPI:', err);
      }
    },
    [onSelectStatus]
  );

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="Resumen y filtros rápidos de estado"
    >
      <KpiFilterPill
        label="Todas"
        count={counts.total}
        suffix={`${counts.occupancyPct}%`}
        tone="neutral"
        active={activeStatuses.length === 0}
        onClick={() => handleToggle('all')}
      />
      <KpiFilterPill
        label="Disponibles"
        count={counts.available}
        tone="emerald"
        active={activeStatuses.includes('available')}
        onClick={() => handleToggle('available')}
      />
      <KpiFilterPill
        label="Ocupadas"
        count={counts.occupied}
        tone="rose"
        active={activeStatuses.includes('occupied')}
        onClick={() => handleToggle('occupied')}
      />
      <KpiFilterPill
        label="Por limpiar"
        count={counts.cleaning}
        tone="sky"
        active={activeStatuses.includes('cleaning')}
        onClick={() => handleToggle('cleaning')}
      />
      <KpiFilterPill
        label="Mantenimiento"
        count={counts.maintenance}
        tone="amber"
        active={activeStatuses.includes('maintenance')}
        onClick={() => handleToggle('maintenance')}
      />
    </div>
  );
});

export default HabitacionesKpiFilterBar;
