import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../lib/api';
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator';
import {
  type RecepcionRoomRaw,
  type RecepcionRoomItem,
  type RecepcionRoomsViewMode,
  getRoomStatusConfig,
} from '../domain/recepcion-room';
import {
  SAMPLE_ROOM_TYPES,
  SAMPLE_BUILDINGS,
} from '../infrastructure/room-api';

/**
 * Datos estructurados de respaldo para desarrollo local o resiliencia cuando el backend no esté activo.
 * Siguen con fidelidad el JSON especificado por el usuario.
 */
const FALLBACK_ROOMS_DATA: RecepcionRoomRaw[] = [
  {
    id: 'room-101-uuid',
    number: '101',
    floor: 1,
    room_types_id: 'type-1',
    building_id: 'building-1',
    price_override: null,
    status: 'available',
    has_reception: false,
    created_by: 'admin@hotel.com',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-20T09:30:00Z',
  },
  {
    id: 'room-102-uuid',
    number: '102',
    floor: 1,
    room_types_id: 'type-2',
    building_id: 'building-1',
    price_override: 145000,
    status: 'occupied',
    has_reception: true,
    created_by: 'admin@hotel.com',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-20T09:30:00Z',
  },
  {
    id: 'room-201-uuid',
    number: '201',
    floor: 2,
    room_types_id: 'type-1',
    building_id: 'building-2',
    price_override: null,
    status: 'available',
    has_reception: false,
    created_by: 'admin@hotel.com',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-20T09:30:00Z',
  },
  {
    id: 'room-202-uuid',
    number: '202',
    floor: 2,
    room_types_id: 'type-family',
    building_id: 'building-2',
    price_override: 280000,
    status: 'cleaning',
    has_reception: false,
    created_by: 'admin@hotel.com',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-20T09:30:00Z',
  },
  {
    id: 'room-301-uuid',
    number: '301',
    floor: 3,
    room_types_id: 'type-presidential',
    building_id: 'building-1',
    price_override: 420000,
    status: 'occupied',
    has_reception: true,
    created_by: 'admin@hotel.com',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-20T09:30:00Z',
  },
  {
    id: 'room-302-uuid',
    number: '302',
    floor: 3,
    room_types_id: 'type-2',
    building_id: 'building-1',
    price_override: null,
    status: 'maintenance',
    has_reception: false,
    created_by: 'admin@hotel.com',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-20T09:30:00Z',
  },
  {
    id: 'room-401-uuid',
    number: '401',
    floor: 4,
    room_types_id: 'type-presidential',
    building_id: 'building-2',
    price_override: 480000,
    status: 'available',
    has_reception: true,
    created_by: 'admin@hotel.com',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-20T09:30:00Z',
  },
];

/**
 * Diccionario de resolución amigable para evitar la exposición de IDs crudos (Regla de Oro nº 1).
 */
const KNOWN_ROOM_TYPES: Record<string, string> = {
  'type-1': 'Suite Deluxe',
  'type-2': 'Doble Superior',
  'type-presidential': 'Suite Presidencial Imperial',
  'type-family': 'Familiar Premium',
  'rt-uuid': 'Habitación Confort Ejecutiva',
};

const KNOWN_BUILDINGS: Record<string, string> = {
  'building-1': 'Torre A - Principal',
  'building-2': 'Torre B - Norte',
  'bld-uuid': 'Edificio Central',
};

function resolveRoomTypeName(id: string, floor: number): string {
  if (SAMPLE_ROOM_TYPES[id]?.name) return SAMPLE_ROOM_TYPES[id].name;
  if (KNOWN_ROOM_TYPES[id]) return KNOWN_ROOM_TYPES[id];
  // Fallback elegante sin mostrar jamás el UUID crudo
  if (floor >= 3) return 'Suite Panorámica';
  if (floor === 2) return 'Habitación Deluxe';
  return 'Habitación Estándar';
}

function resolveBuildingName(id: string): string {
  if (SAMPLE_BUILDINGS[id]?.name) return SAMPLE_BUILDINGS[id].name;
  if (KNOWN_BUILDINGS[id]) return KNOWN_BUILDINGS[id];
  // Fallback elegante sin mostrar jamás el UUID crudo
  return 'Edificio Principal';
}

function formatRoomPrice(price: number | null): string {
  if (price === null || price === undefined || price <= 0) {
    return 'Tarifa estándar';
  }
  return `$ ${Number(price).toLocaleString('es-CO')}`;
}

export interface UseRecepcionRoomsReturn {
  rooms: RecepcionRoomItem[];
  filteredRooms: RecepcionRoomItem[];
  loading: boolean;
  validationResult: StatusCodeValidationResult | null;
  isFallback: boolean;
  viewMode: RecepcionRoomsViewMode;
  setViewMode: (mode: RecepcionRoomsViewMode) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  floorFilter: string;
  setFloorFilter: (f: string) => void;
  receptionFilter: 'all' | 'with' | 'without';
  setReceptionFilter: (r: 'all' | 'with' | 'without') => void;
  metrics: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    withReception: number;
  };
  reload: () => Promise<void>;
}

/**
 * Hook de aplicación para consultar habitaciones (GET /room) con Axios y validar el status code.
 */
export function useRecepcionRooms(): UseRecepcionRoomsReturn {
  const [rooms, setRooms] = useState<RecepcionRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationResult, setValidationResult] =
    useState<StatusCodeValidationResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [viewMode, setViewMode] = useState<RecepcionRoomsViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [floorFilter, setFloorFilter] = useState('todos');
  const [receptionFilter, setReceptionFilter] = useState<
    'all' | 'with' | 'without'
  >('all');

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .get('/room', {
        validateStatus: () => true, // Permite procesar todos los códigos con status-code-validator
      })
      .then((response) => {
        if (!active) return;
        const validation = validateStatusCode(response.status);
        setValidationResult(validation);

        if (
          validation.isValid &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          const mapped: RecepcionRoomItem[] = response.data.map(
            (raw: RecepcionRoomRaw) => ({
              ...raw,
              roomTypeName: resolveRoomTypeName(raw.room_types_id, raw.floor),
              buildingName: resolveBuildingName(raw.building_id),
              formattedPrice: formatRoomPrice(raw.price_override),
              statusLabel: getRoomStatusConfig(raw.status).label,
            })
          );
          setRooms(mapped);
          setIsFallback(false);
        } else {
          // Fallback resiliente si la API responde vacío o con código no estándar
          const mappedFallback: RecepcionRoomItem[] = FALLBACK_ROOMS_DATA.map(
            (raw) => ({
              ...raw,
              roomTypeName: resolveRoomTypeName(raw.room_types_id, raw.floor),
              buildingName: resolveBuildingName(raw.building_id),
              formattedPrice: formatRoomPrice(raw.price_override),
              statusLabel: getRoomStatusConfig(raw.status).label,
            })
          );
          setRooms(mappedFallback);
          setIsFallback(true);
        }
      })
      .catch(() => {
        if (!active) return;
        // Manejo de error de red con fallback de status code 500
        const errValidation = validateStatusCode(500);
        setValidationResult(errValidation);
        const mappedFallback: RecepcionRoomItem[] = FALLBACK_ROOMS_DATA.map(
          (raw) => ({
            ...raw,
            roomTypeName: resolveRoomTypeName(raw.room_types_id, raw.floor),
            buildingName: resolveBuildingName(raw.building_id),
            formattedPrice: formatRoomPrice(raw.price_override),
            statusLabel: getRoomStatusConfig(raw.status).label,
          })
        );
        setRooms(mappedFallback);
        setIsFallback(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Filtrado reactivo en memoria
  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rooms.filter((room) => {
      // Filtro de búsqueda textual
      if (q) {
        const matchesQuery =
          room.number.toLowerCase().includes(q) ||
          String(room.floor).includes(q) ||
          room.roomTypeName.toLowerCase().includes(q) ||
          room.buildingName.toLowerCase().includes(q) ||
          room.statusLabel.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Filtro por Estado
      if (statusFilter !== 'todos') {
        const normalized = (room.status || '').toLowerCase();
        if (normalized !== statusFilter.toLowerCase()) return false;
      }

      // Filtro por Piso
      if (floorFilter !== 'todos') {
        if (String(room.floor) !== floorFilter) return false;
      }

      // Filtro por Recepción / Reserva activa
      if (receptionFilter === 'with' && !room.has_reception) return false;
      if (receptionFilter === 'without' && room.has_reception) return false;

      return true;
    });
  }, [rooms, searchQuery, statusFilter, floorFilter, receptionFilter]);

  // Métricas calculadas para la barra superior del recepcionista
  const metrics = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter(
      (r) =>
        r.status.toLowerCase() === 'available' ||
        r.status.toLowerCase() === 'disponible'
    ).length;
    const occupied = rooms.filter(
      (r) =>
        r.status.toLowerCase() === 'occupied' ||
        r.status.toLowerCase() === 'ocupada'
    ).length;
    const maintenance = rooms.filter(
      (r) =>
        r.status.toLowerCase() === 'maintenance' ||
        r.status.toLowerCase() === 'mantenimiento' ||
        r.status.toLowerCase() === 'cleaning' ||
        r.status.toLowerCase() === 'limpieza'
    ).length;
    const withReception = rooms.filter((r) => r.has_reception).length;
    return { total, available, occupied, maintenance, withReception };
  }, [rooms]);

  const reload = useCallback(async () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return {
    rooms,
    filteredRooms,
    loading,
    validationResult,
    isFallback,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    floorFilter,
    setFloorFilter,
    receptionFilter,
    setReceptionFilter,
    metrics,
    reload,
  };
}
