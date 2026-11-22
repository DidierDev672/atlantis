import {
  isHabitacionOcupada,
  matchesHabitacionStatus,
  type RoomRow,
} from './habitacion-lista';

export type FloorStatusBadgeFilter =
  | 'all'
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'cleaning'
  | 'inactive';

export type FloorBadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'info'
  | 'danger';

export interface FloorBadgeItem {
  key: Exclude<FloorStatusBadgeFilter, 'all'>;
  label: string;
  shortLabel: string;
  count: number;
  tone: FloorBadgeTone;
}

const BADGE_LABELS: Record<Exclude<FloorStatusBadgeFilter, 'all'>, string> = {
  available: 'Disponibles',
  occupied: 'Ocupadas',
  maintenance: 'Mantenimiento',
  cleaning: 'Limpieza',
  inactive: 'Inactivas',
};

export function getFloorBadgeLabel(filter: FloorStatusBadgeFilter): string {
  if (filter === 'all') return 'Todas';
  return BADGE_LABELS[filter];
}

export function buildFloorBadgeItems(rooms: RoomRow[]): FloorBadgeItem[] {
  let available = 0;
  let occupied = 0;
  let maintenance = 0;
  let cleaning = 0;
  let inactive = 0;

  for (const room of rooms) {
    if (isHabitacionOcupada(room.status)) {
      occupied += 1;
    } else if (matchesHabitacionStatus(room.status, 'available')) {
      available += 1;
    } else if (matchesHabitacionStatus(room.status, 'maintenance')) {
      maintenance += 1;
    } else if (matchesHabitacionStatus(room.status, 'cleaning')) {
      cleaning += 1;
    } else if (matchesHabitacionStatus(room.status, 'inactive')) {
      inactive += 1;
    }
  }

  const items: FloorBadgeItem[] = [
    {
      key: 'available',
      label: `${available} disponible${available === 1 ? '' : 's'}`,
      shortLabel: 'Disponibles',
      count: available,
      tone: 'success',
    },
  ];

  if (occupied > 0) {
    items.push({
      key: 'occupied',
      label: `${occupied} ocupada${occupied === 1 ? '' : 's'}`,
      shortLabel: 'Ocupadas',
      count: occupied,
      tone: 'warning',
    });
  }

  if (maintenance > 0) {
    items.push({
      key: 'maintenance',
      label: `${maintenance} mantenimiento`,
      shortLabel: 'Mantenimiento',
      count: maintenance,
      tone: 'danger',
    });
  }

  if (cleaning > 0) {
    items.push({
      key: 'cleaning',
      label: `${cleaning} limpieza`,
      shortLabel: 'Limpieza',
      count: cleaning,
      tone: 'info',
    });
  }

  if (inactive > 0) {
    items.push({
      key: 'inactive',
      label: `${inactive} inactiva${inactive === 1 ? '' : 's'}`,
      shortLabel: 'Inactivas',
      count: inactive,
      tone: 'neutral',
    });
  }

  return items;
}

export function filterFloorRoomsByBadge(
  rooms: RoomRow[],
  badgeFilter: FloorStatusBadgeFilter
): RoomRow[] {
  if (badgeFilter === 'all') return rooms;
  if (badgeFilter === 'occupied') {
    return rooms.filter((r) => isHabitacionOcupada(r.status));
  }
  return rooms.filter((r) => matchesHabitacionStatus(r.status, badgeFilter));
}

export function filterFloorRoomsBySearch(
  rooms: RoomRow[],
  searchQuery: string
): RoomRow[] {
  try {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rooms;

    return rooms.filter((room) => {
      const numberMatch = room.number.toLowerCase().includes(query);
      const bedMatch = room.bed.name.toLowerCase().includes(query);
      const buildingMatch = room.building.name.toLowerCase().includes(query);
      const statusMatch = room.status.toLowerCase().includes(query);
      return numberMatch || bedMatch || buildingMatch || statusMatch;
    });
  } catch {
    return rooms;
  }
}
