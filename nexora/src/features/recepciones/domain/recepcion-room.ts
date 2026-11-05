/**
 * Definiciones de dominio para la supervisión de habitaciones desde el dashboard de recepción.
 * Cumple con Clean Architecture y la Regla de Oro (no mostrar IDs crudos al usuario).
 */

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'cleaning'
  | 'reserved'
  | string

export interface RecepcionRoomRaw {
  id: string
  number: string
  floor: number
  room_types_id: string
  building_id: string
  price_override: number | null
  status: RoomStatus
  has_reception: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface RecepcionRoomItem extends RecepcionRoomRaw {
  /** Nombre humano legible del tipo de habitación (ej. "Suite Deluxe"). NUNCA un UUID */
  roomTypeName: string
  /** Nombre humano legible del edificio (ej. "Torre Principal"). NUNCA un UUID */
  buildingName: string
  /** Precio formateado con moneda o indicación de tarifa estándar */
  formattedPrice: string
  /** Etiqueta en español del estado */
  statusLabel: string
}

export type RecepcionRoomsViewMode = 'cards' | 'table'

export interface RoomStatusConfig {
  label: string
  badgeClass: string
  dotClass: string
  iconName: 'check' | 'user' | 'wrench' | 'sparkles' | 'clock'
}

export const ROOM_STATUS_MAP: Record<string, RoomStatusConfig> = {
  available: {
    label: 'Disponible',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
    iconName: 'check',
  },
  disponible: {
    label: 'Disponible',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
    iconName: 'check',
  },
  occupied: {
    label: 'Ocupada',
    badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    dotClass: 'bg-sky-500',
    iconName: 'user',
  },
  ocupada: {
    label: 'Ocupada',
    badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    dotClass: 'bg-sky-500',
    iconName: 'user',
  },
  maintenance: {
    label: 'Mantenimiento',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    dotClass: 'bg-amber-500',
    iconName: 'wrench',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    dotClass: 'bg-amber-500',
    iconName: 'wrench',
  },
  cleaning: {
    label: 'Limpieza',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    dotClass: 'bg-purple-500',
    iconName: 'sparkles',
  },
  limpieza: {
    label: 'Limpieza',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    dotClass: 'bg-purple-500',
    iconName: 'sparkles',
  },
  reserved: {
    label: 'Reservada',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    dotClass: 'bg-indigo-500',
    iconName: 'clock',
  },
}

export function getRoomStatusConfig(status: string): RoomStatusConfig {
  const normalized = (status || '').toLowerCase().trim()
  return (
    ROOM_STATUS_MAP[normalized] ?? {
      label: status || 'Indefinido',
      badgeClass: 'bg-neutral/15 text-ink-muted border-line',
      dotClass: 'bg-ink-muted',
      iconName: 'clock',
    }
  )
}

