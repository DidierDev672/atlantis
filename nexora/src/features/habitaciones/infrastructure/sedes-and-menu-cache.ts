import { api } from '../../../lib/api';
import { BoundedTtlCache } from './bounded-ttl-cache';
import { fetchBuildingsCatalogCached } from './habitaciones-catalogs-cache';

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface CachedHeadquarterData {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CachedSubHeadquarterData {
  id: string;
  headquarter_id?: string;
  name: string;
  address: string;
  phone: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CachedBuildingFullData {
  id: string;
  name: string;
  floor_number?: number;
  headquarters_id?: string;
  sub_headquarters_id?: string | null;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

const hqCache = new BoundedTtlCache<string, CachedHeadquarterData>(
  40,
  CACHE_TTL_MS
);
const hqInFlight = new Map<string, Promise<CachedHeadquarterData | null>>();

const subHqCache = new BoundedTtlCache<string, CachedSubHeadquarterData[]>(
  40,
  CACHE_TTL_MS
);
const subHqInFlight = new Map<string, Promise<CachedSubHeadquarterData[]>>();

const buildingDetailCache = new BoundedTtlCache<
  string,
  CachedBuildingFullData
>(60, CACHE_TTL_MS);
const buildingDetailInFlight = new Map<
  string,
  Promise<CachedBuildingFullData | null>
>();

export async function fetchHeadquarterByIdCached(
  id: string,
  forceRefresh = false
): Promise<CachedHeadquarterData | null> {
  const cleanId = String(id).trim();
  if (!cleanId) return null;

  if (!forceRefresh) {
    const cached = hqCache.get(cleanId);
    if (cached !== undefined) return cached;
    const inflight = hqInFlight.get(cleanId);
    if (inflight) return inflight;
  }

  const promise = (async () => {
    try {
      const response = await api.get<unknown>(
        `/headquarters/${encodeURIComponent(cleanId)}`,
        { validateStatus: (s) => s >= 200 && s < 300 }
      );
      const raw = response.data;
      const item: CachedHeadquarterData | null = Array.isArray(raw)
        ? ((raw[0] as CachedHeadquarterData) ?? null)
        : raw && typeof raw === 'object' && 'data' in raw && raw.data
          ? (raw.data as CachedHeadquarterData)
          : (raw as CachedHeadquarterData | null);

      if (item && (item.id || item.name)) {
        const normalized: CachedHeadquarterData = {
          id: item.id || cleanId,
          name: item.name || 'Sede Central',
          address: item.address || 'Dirección no registrada',
          city: item.city || 'Ciudad no registrada',
          phone: item.phone || 'Teléfono no registrado',
          status: item.status || 'active',
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
        hqCache.set(cleanId, normalized);
        return normalized;
      }
      return null;
    } finally {
      hqInFlight.delete(cleanId);
    }
  })();

  hqInFlight.set(cleanId, promise);
  return promise;
}

export async function fetchSubHeadquartersByHqCached(
  hqId: string,
  forceRefresh = false
): Promise<CachedSubHeadquarterData[]> {
  const cleanId = String(hqId).trim();
  if (!cleanId) return [];

  if (!forceRefresh) {
    const cached = subHqCache.get(cleanId);
    if (cached !== undefined) return cached;
    const inflight = subHqInFlight.get(cleanId);
    if (inflight) return inflight;
  }

  const promise = (async () => {
    try {
      const response = await api.get<unknown>(
        `/sub-headquarters/by-headquarter/${encodeURIComponent(cleanId)}`,
        { validateStatus: (s) => s >= 200 && s < 300 }
      );
      const raw = response.data;
      let list: CachedSubHeadquarterData[] = [];
      if (Array.isArray(raw)) {
        list = raw as CachedSubHeadquarterData[];
      } else if (
        raw &&
        typeof raw === 'object' &&
        'data' in raw &&
        Array.isArray((raw as { data: unknown }).data)
      ) {
        list = (raw as { data: CachedSubHeadquarterData[] }).data;
      } else if (raw && typeof raw === 'object' && 'data' in raw && raw.data) {
        list = [raw.data as CachedSubHeadquarterData];
      } else if (raw && typeof raw === 'object' && ('id' in raw || 'name' in raw)) {
        list = [raw as CachedSubHeadquarterData];
      }
      subHqCache.set(cleanId, list);
      return list;
    } finally {
      subHqInFlight.delete(cleanId);
    }
  })();

  subHqInFlight.set(cleanId, promise);
  return promise;
}

export async function fetchBuildingDetailByIdCached(
  id: string,
  forceRefresh = false
): Promise<CachedBuildingFullData | null> {
  const cleanId = String(id).trim();
  if (!cleanId) return null;

  if (!forceRefresh) {
    const cached = buildingDetailCache.get(cleanId);
    if (cached !== undefined) return cached;
    const inflight = buildingDetailInFlight.get(cleanId);
    if (inflight) return inflight;
  }

  const promise = (async () => {
    try {
      const response = await api.get<unknown>(
        `/building/${encodeURIComponent(cleanId)}`,
        { validateStatus: (s) => s === 200 }
      );
      const raw = response.data as
        | CachedBuildingFullData
        | { data?: CachedBuildingFullData };
      const item: CachedBuildingFullData =
        raw && typeof raw === 'object' && 'data' in raw && raw.data
          ? (raw.data as CachedBuildingFullData)
          : (raw as CachedBuildingFullData);

      if (item && item.id) {
        buildingDetailCache.set(cleanId, item);
        return item;
      }

      // Fallback al catálogo general ya cacheado si el detalle puntual vino vacío
      const catalog = await fetchBuildingsCatalogCached();
      const hit = catalog.find((b) => b.id === cleanId);
      if (hit) {
        const mapped: CachedBuildingFullData = {
          id: hit.id,
          name: hit.name,
          floor_number: hit.floorNumber,
          headquarters_id: hit.headquartersId,
          sub_headquarters_id: hit.subHeadquartersId,
        };
        buildingDetailCache.set(cleanId, mapped);
        return mapped;
      }
      return null;
    } finally {
      buildingDetailInFlight.delete(cleanId);
    }
  })();

  buildingDetailInFlight.set(cleanId, promise);
  return promise;
}

export interface CachedRoomExtraDetails {
  description?: string;
  createdBy?: string;
  headquarterId?: string;
  subHeadquarterId?: string;
}

const roomDetailCache = new BoundedTtlCache<string, CachedRoomExtraDetails>(
  60,
  2 * 60 * 1000
);
const roomDetailInFlight = new Map<string, Promise<CachedRoomExtraDetails>>();

export async function fetchRoomExtraDetailsCached(
  roomId: string,
  forceRefresh = false
): Promise<CachedRoomExtraDetails> {
  const cleanId = String(roomId).trim();
  if (!cleanId) return {};

  if (!forceRefresh) {
    const cached = roomDetailCache.get(cleanId);
    if (cached !== undefined) return cached;
    const inflight = roomDetailInFlight.get(cleanId);
    if (inflight) return inflight;
  }

  const promise = (async () => {
    try {
      const res = await api.get<Record<string, unknown>>(
        `/room/${encodeURIComponent(cleanId)}`,
        { validateStatus: (s: number) => s === 200 }
      );
      const payload = (
        res.data?.data && typeof res.data.data === 'object'
          ? res.data.data
          : res.data
      ) as Record<string, unknown>;
      const result: CachedRoomExtraDetails = {
        description:
          typeof payload?.description === 'string'
            ? payload.description
            : undefined,
        createdBy:
          typeof payload?.created_by === 'string'
            ? payload.created_by
            : undefined,
        headquarterId:
          typeof payload?.headquarter_id === 'string'
            ? payload.headquarter_id
            : undefined,
        subHeadquarterId:
          typeof payload?.sub_headquarter_id === 'string'
            ? payload.sub_headquarter_id
            : undefined,
      };
      roomDetailCache.set(cleanId, result);
      return result;
    } finally {
      roomDetailInFlight.delete(cleanId);
    }
  })();

  roomDetailInFlight.set(cleanId, promise);
  return promise;
}
