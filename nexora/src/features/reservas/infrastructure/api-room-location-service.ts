import { api } from '../../../lib/api';
import { validateStatusCode } from '../../../shared/lib/status-code-validator';
import { executeBalancedRequest } from './api-load-balancer';
import type {
  BuildingApiResponse,
  HeadquartersApiResponse,
  SubHeadquartersApiResponse,
  RoomLocationHierarchy,
} from '../domain/room-location-types';

/** Catálogos de respaldo demostrativo para entornos locales u offline */
const FALLBACK_BUILDINGS: Record<string, BuildingApiResponse> = {
  '8c2d1e0f4a5b6c7d': {
    id: '8c2d1e0f4a5b6c7d',
    name: 'Torre Principal',
    floor_number: 5,
    headquarters_id: '4b1a2c3d0e9f8a7b',
    sub_headquarters_id: null,
    status: 'available',
  },
  'building-1': {
    id: 'building-1',
    name: 'Torre A',
    floor_number: 12,
    headquarters_id: '4b1a2c3d0e9f8a7b',
    sub_headquarters_id: '7a8b9c0d1e2f3a4b',
    status: 'active',
  },
};

const FALLBACK_HEADQUARTERS: Record<string, HeadquartersApiResponse> = {
  '4b1a2c3d0e9f8a7b': {
    id: '4b1a2c3d0e9f8a7b',
    name: 'Sede Principal Medellín',
    address: 'Calle 10 # 40-20',
    city: 'Medellín',
    phone: '3001234567',
    status: 'active',
  },
};

const FALLBACK_SUB_HEADQUARTERS: Record<string, SubHeadquartersApiResponse> = {
  '7a8b9c0d1e2f3a4b': {
    id: '7a8b9c0d1e2f3a4b',
    headquarter_id: '4b1a2c3d0e9f8a7b',
    name: 'Subsede Poblado',
    address: 'Carrera 43A # 1-50',
    phone: '3109876543',
    status: 'active',
  },
};

// Cachés en memoria y promesas en vuelo para evitar saturar endpoints
const buildingCache = new Map<string, BuildingApiResponse | null>();
const hqCache = new Map<string, HeadquartersApiResponse | null>();
const subHqCache = new Map<string, SubHeadquartersApiResponse | null>();
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Consulta balanceada del edificio mediante GET /building/{id} con validateStatusCode
 */
export async function fetchBuildingById(id: string): Promise<BuildingApiResponse | null> {
  const cleanId = id.trim();
  if (!cleanId) return null;
  if (buildingCache.has(cleanId)) return buildingCache.get(cleanId) ?? null;

  const cacheKey = `bld:${cleanId}`;
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<BuildingApiResponse | null>;
  }

  const queryPromise = (async () => {
    try {
      const response = await executeBalancedRequest(() =>
        api.get<BuildingApiResponse | BuildingApiResponse[]>(`/building/${encodeURIComponent(cleanId)}`, {
          validateStatus: () => true,
        })
      );
      const validation = validateStatusCode(response.status);
      if (validation.isValid && response.data) {
        const raw = response.data;
        const b = Array.isArray(raw) ? raw[0] : raw;
        if (b && typeof b === 'object' && 'name' in b) {
          buildingCache.set(cleanId, b);
          return b;
        }
      }
      const fallback = FALLBACK_BUILDINGS[cleanId] ?? null;
      buildingCache.set(cleanId, fallback);
      return fallback;
    } catch {
      const fallback = FALLBACK_BUILDINGS[cleanId] ?? null;
      buildingCache.set(cleanId, fallback);
      return fallback;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, queryPromise);
  return queryPromise;
}

/**
 * Consulta balanceada de la sede mediante GET /headquarters/{id} con validateStatusCode
 */
export async function fetchHeadquartersById(id: string): Promise<HeadquartersApiResponse | null> {
  const cleanId = id.trim();
  if (!cleanId) return null;
  if (hqCache.has(cleanId)) return hqCache.get(cleanId) ?? null;

  const cacheKey = `hq:${cleanId}`;
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<HeadquartersApiResponse | null>;
  }

  const queryPromise = (async () => {
    try {
      const response = await executeBalancedRequest(() =>
        api.get<HeadquartersApiResponse | HeadquartersApiResponse[]>(`/headquarters/${encodeURIComponent(cleanId)}`, {
          validateStatus: () => true,
        })
      );
      const validation = validateStatusCode(response.status);
      if (validation.isValid && response.data) {
        const raw = response.data;
        const h = Array.isArray(raw) ? raw[0] : raw;
        if (h && typeof h === 'object' && 'name' in h) {
          hqCache.set(cleanId, h);
          return h;
        }
      }
      const fallback = FALLBACK_HEADQUARTERS[cleanId] ?? null;
      hqCache.set(cleanId, fallback);
      return fallback;
    } catch {
      const fallback = FALLBACK_HEADQUARTERS[cleanId] ?? null;
      hqCache.set(cleanId, fallback);
      return fallback;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, queryPromise);
  return queryPromise;
}

/**
 * Consulta balanceada de la subsede mediante GET /sub-headquarters/{id} con validateStatusCode
 */
export async function fetchSubHeadquartersById(id: string): Promise<SubHeadquartersApiResponse | null> {
  const cleanId = id.trim();
  if (!cleanId) return null;
  if (subHqCache.has(cleanId)) return subHqCache.get(cleanId) ?? null;

  const cacheKey = `subhq:${cleanId}`;
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<SubHeadquartersApiResponse | null>;
  }

  const queryPromise = (async () => {
    try {
      const response = await executeBalancedRequest(() =>
        api.get<SubHeadquartersApiResponse | SubHeadquartersApiResponse[]>(
          `/sub-headquarters/${encodeURIComponent(cleanId)}`,
          { validateStatus: () => true }
        )
      );
      const validation = validateStatusCode(response.status);
      if (validation.isValid && response.data) {
        const raw = response.data;
        const sh = Array.isArray(raw) ? raw[0] : raw;
        if (sh && typeof sh === 'object' && 'name' in sh) {
          subHqCache.set(cleanId, sh);
          return sh;
        }
      }
      const fallback = FALLBACK_SUB_HEADQUARTERS[cleanId] ?? null;
      subHqCache.set(cleanId, fallback);
      return fallback;
    } catch {
      const fallback = FALLBACK_SUB_HEADQUARTERS[cleanId] ?? null;
      subHqCache.set(cleanId, fallback);
      return fallback;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, queryPromise);
  return queryPromise;
}

/**
 * Orquestador y balanceador de carga que resuelve concurrentemente la jerarquía completa
 * de ubicación para un conjunto de habitaciones.
 */
export async function resolveRoomsLocationBatch(
  rooms: Array<{ id: string; number: string; floor: number | string; building_id?: string }>
): Promise<Map<string, RoomLocationHierarchy>> {
  const result = new Map<string, RoomLocationHierarchy>();

  try {
    // 1. Obtener IDs únicos de edificios
    const uniqueBuildingIds = Array.from(
      new Set(rooms.map((r) => r.building_id).filter((b): b is string => Boolean(b && b.trim())))
    );

    // Cargar edificios balanceando cargas
    const buildingsList = await Promise.all(uniqueBuildingIds.map((bId) => fetchBuildingById(bId)));
    const buildingsMap = new Map<string, BuildingApiResponse>();
    buildingsList.forEach((b) => {
      if (b && b.id) buildingsMap.set(b.id, b);
    });

    // 2. Extraer IDs únicos de Sedes y Sub-Sedes
    const uniqueHqIds = new Set<string>();
    const uniqueSubHqIds = new Set<string>();

    buildingsMap.forEach((b) => {
      if (b.headquarters_id && b.headquarters_id.trim()) uniqueHqIds.add(b.headquarters_id.trim());
      if (b.sub_headquarters_id && b.sub_headquarters_id.trim()) uniqueSubHqIds.add(b.sub_headquarters_id.trim());
    });

    // Cargar sedes y subsedes balanceando cargas
    const [hqList, subHqList] = await Promise.all([
      Promise.all(Array.from(uniqueHqIds).map((hqId) => fetchHeadquartersById(hqId))),
      Promise.all(Array.from(uniqueSubHqIds).map((subId) => fetchSubHeadquartersById(subId))),
    ]);

    const hqsMap = new Map<string, HeadquartersApiResponse>();
    hqList.forEach((h) => {
      if (h && h.id) hqsMap.set(h.id, h);
    });

    const subHqsMap = new Map<string, SubHeadquartersApiResponse>();
    subHqList.forEach((sh) => {
      if (sh && sh.id) subHqsMap.set(sh.id, sh);
    });

    // 3. Ensamblar jerarquía por cada habitación
    rooms.forEach((room) => {
      const bld = room.building_id ? buildingsMap.get(room.building_id) : null;
      const hq = bld?.headquarters_id ? hqsMap.get(bld.headquarters_id) : null;
      const subHq = bld?.sub_headquarters_id ? subHqsMap.get(bld.sub_headquarters_id) : null;

      const hasBuilding = Boolean(bld && bld.name);
      const buildingName = hasBuilding ? bld!.name : null;
      const hasHeadquarters = Boolean(hq && hq.name);
      const headquartersName = hasHeadquarters ? hq!.name : null;
      const hasSubHeadquarters = Boolean(subHq && subHq.name);
      const subHeadquartersName = hasSubHeadquarters ? subHq!.name : null;

      const bText = hasBuilding ? buildingName! : 'Sin edificio registrado';
      const hText = hasHeadquarters ? headquartersName! : 'Sin sede registrada';
      const sText = hasSubHeadquarters ? subHeadquartersName! : 'Sin sub sede registrada';

      const formattedOptionLabel = `(Habitación ${room.number} - Piso ${room.floor} - ${bText} - ${hText} - ${sText})`;

      result.set(room.id, {
        roomId: room.id,
        roomNumber: room.number,
        floor: room.floor,
        buildingId: room.building_id ?? null,
        buildingName,
        hasBuilding,
        headquartersId: bld?.headquarters_id ?? null,
        headquartersName,
        hasHeadquarters,
        subHeadquartersId: bld?.sub_headquarters_id ?? null,
        subHeadquartersName,
        hasSubHeadquarters,
        formattedOptionLabel,
      });
    });
  } catch {
    // Si ocurre una falla imprevista, ensambla el fallback básico
    rooms.forEach((room) => {
      result.set(room.id, {
        roomId: room.id,
        roomNumber: room.number,
        floor: room.floor,
        buildingId: room.building_id ?? null,
        buildingName: null,
        hasBuilding: false,
        headquartersId: null,
        headquartersName: null,
        hasHeadquarters: false,
        subHeadquartersId: null,
        subHeadquartersName: null,
        hasSubHeadquarters: false,
        formattedOptionLabel: `(Habitación ${room.number} - Piso ${room.floor} - Sin edificio registrado - Sin sede registrada - Sin sub sede registrada)`,
      });
    });
  }

  return result;
}
