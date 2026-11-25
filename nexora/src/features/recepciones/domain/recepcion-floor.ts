import { formatFriendlyRoomTypeName } from '../../../shared/catalog';
import { normalizeMetodoPago, type Recepcion } from './recepcion';
import { formatPaymentMethod, type StayItem } from './stay';

export type RoomFloorStatusKey =
  | 'available'
  | 'occupied'
  | 'cleaning'
  | 'maintenance';

export type RoomFloorStatusFilter = 'all' | RoomFloorStatusKey;

export type FloorBadgeTone = 'success' | 'warning' | 'info' | 'danger';

export interface FloorStatusBadgeSummary {
  key: RoomFloorStatusKey;
  label: string;
  shortLabel: string;
  count: number;
  tone: FloorBadgeTone;
}

export interface RoomFloorMetadata {
  number: string;
  floor: number;
  status: string;
  roomTypeName: string;
}

export interface FloorReceptionEntry {
  stay: StayItem;
  recepcion: Recepcion;
  roomNumber: string;
  roomTypeName: string;
  roomStatusKey: RoomFloorStatusKey | 'other';
  guestNamesText: string;
}

export interface FloorReceptionGroup {
  floorKey: string;
  floorNumber: number;
  floorLabel: string;
  entries: FloorReceptionEntry[];
}

export function mapStayToRecepcion(
  stay: StayItem,
  roomMeta?: RoomFloorMetadata
): Recepcion {
  try {
    const paymentInfo = formatPaymentMethod(stay.payment_method);
    const roomNum = roomMeta?.number || '';
    return {
      id: stay.id,
      roomId: stay.room_id,
      roomLabel: roomNum || '—',
      reservaId: stay.reservation_id,
      guestId: stay.person_ids[0] ?? '',
      guestLabel: 'Huésped',
      person_ids: stay.person_ids,
      checkIn: stay.check_in_date,
      checkOut: stay.check_out_date,
      metodoPago: normalizeMetodoPago(stay.payment_method),
      metodoPagoLabel: paymentInfo.label,
      depositoGarantia: Number(stay.security_deposit ?? 0),
      estado: stay.status,
      estadoLabel: stay.status,
      observaciones: stay.remarks,
      createdAt: stay.created_at ?? '',
      createdBy: stay.created_by ?? '',
      habitacion: roomMeta
        ? {
            id: stay.room_id,
            number: roomMeta.number,
            name: roomMeta.number,
            floor: roomMeta.floor,
            status: roomMeta.status,
          }
        : undefined,
      cama: roomMeta
        ? {
            id: '',
            etiquette: '',
            tipoNombre: roomMeta.roomTypeName,
          }
        : undefined,
    };
  } catch (err) {
    console.error('Error al mapear estancia a recepción:', err);
    return {
      id: stay.id,
      roomId: stay.room_id,
      roomLabel: '—',
      guestId: '',
      guestLabel: 'Huésped',
      person_ids: stay.person_ids ?? [],
      checkIn: stay.check_in_date,
      checkOut: stay.check_out_date,
      metodoPago: 'efectivo',
      metodoPagoLabel: 'Efectivo',
      depositoGarantia: 0,
      estado: stay.status,
      estadoLabel: stay.status,
      createdAt: '',
      createdBy: '',
    };
  }
}

export function normalizeRoomFloorStatus(
  status?: string | null
): RoomFloorStatusKey | 'other' {
  try {
    const norm = (status || '').trim().toLowerCase();
    if (
      norm === 'available' ||
      norm === 'disponible' ||
      norm === 'active' ||
      norm === 'activo'
    ) {
      return 'available';
    }
    if (
      norm === 'occupied' ||
      norm === 'ocupada' ||
      norm === 'ocupado' ||
      norm === 'busy' ||
      norm === 'progress' ||
      norm === 'progreso'
    ) {
      return 'occupied';
    }
    if (norm === 'cleaning' || norm === 'limpieza') {
      return 'cleaning';
    }
    if (norm === 'maintenance' || norm === 'mantenimiento') {
      return 'maintenance';
    }
    return 'other';
  } catch {
    return 'other';
  }
}

export function inferFloorFromRoomNumber(numberStr?: string): number {
  try {
    if (!numberStr) return 1;
    const digitsMatch = numberStr.match(/\d+/);
    if (!digitsMatch) return 1;
    const num = Number(digitsMatch[0]);
    if (Number.isNaN(num) || num < 100) return 1;
    return Math.floor(num / 100);
  } catch {
    return 1;
  }
}

export function buildFloorStatusBadges(
  entries: FloorReceptionEntry[]
): FloorStatusBadgeSummary[] {
  let available = 0;
  let occupied = 0;
  let cleaning = 0;
  let maintenance = 0;

  for (const entry of entries) {
    if (entry.roomStatusKey === 'available') available += 1;
    else if (entry.roomStatusKey === 'occupied') occupied += 1;
    else if (entry.roomStatusKey === 'cleaning') cleaning += 1;
    else if (entry.roomStatusKey === 'maintenance') maintenance += 1;
  }

  return [
    {
      key: 'available',
      label: `${available} Disponible${available === 1 ? '' : 's'}`,
      shortLabel: 'Disponible',
      count: available,
      tone: 'success',
    },
    {
      key: 'occupied',
      label: `${occupied} Ocupada${occupied === 1 ? '' : 's'}`,
      shortLabel: 'Ocupada',
      count: occupied,
      tone: 'warning',
    },
    {
      key: 'cleaning',
      label: `${cleaning} Limpieza`,
      shortLabel: 'Limpieza',
      count: cleaning,
      tone: 'info',
    },
    {
      key: 'maintenance',
      label: `${maintenance} Mantenimiento`,
      shortLabel: 'Mantenimiento',
      count: maintenance,
      tone: 'danger',
    },
  ];
}

export function filterFloorEntries(
  entries: FloorReceptionEntry[],
  statusFilter: RoomFloorStatusFilter,
  searchQuery: string
): FloorReceptionEntry[] {
  try {
    const afterBadge =
      statusFilter === 'all'
        ? entries
        : entries.filter((entry) => entry.roomStatusKey === statusFilter);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return afterBadge;

    return afterBadge.filter((entry) => {
      const numMatch = entry.roomNumber.toLowerCase().includes(q);
      const typeMatch = entry.roomTypeName.toLowerCase().includes(q);
      const friendlyTypeMatch = formatFriendlyRoomTypeName(entry.roomTypeName)
        .toLowerCase()
        .includes(q);
      const guestMatch = entry.guestNamesText.toLowerCase().includes(q);
      const remarksMatch = (entry.stay.remarks || '')
        .toLowerCase()
        .includes(q);
      const paymentMatch = (entry.recepcion.metodoPagoLabel || '')
        .toLowerCase()
        .includes(q);
      const statusMatch = (entry.recepcion.habitacion?.status || '')
        .toLowerCase()
        .includes(q);

      return (
        numMatch ||
        typeMatch ||
        friendlyTypeMatch ||
        guestMatch ||
        remarksMatch ||
        paymentMatch ||
        statusMatch
      );
    });
  } catch (err) {
    console.error('Error al filtrar habitaciones del piso:', err);
    return entries;
  }
}
