import { api } from '../../../lib/api';

interface SharedCatalogState<T> {
  data: T | null;
  expiresAt: number;
  inFlight: Promise<T> | null;
}

const CATALOG_TTL_MS = 5 * 60 * 1000;

function createState<T>(): SharedCatalogState<T> {
  return { data: null, expiresAt: 0, inFlight: null };
}

function unwrapArrayPayload<T = Record<string, unknown>>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    if (Array.isArray(rec.data)) return rec.data as T[];
  }
  return [];
}

async function resolveCached<T>(
  state: SharedCatalogState<T>,
  fetcher: () => Promise<T>,
  forceRefresh = false
): Promise<T> {
  const now = Date.now();
  if (!forceRefresh && state.data !== null && now < state.expiresAt) {
    return state.data;
  }
  if (!forceRefresh && state.inFlight) {
    return state.inFlight;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      state.data = result;
      state.expiresAt = Date.now() + CATALOG_TTL_MS;
      return result;
    } finally {
      state.inFlight = null;
    }
  })();

  state.inFlight = promise;
  return promise;
}

export interface CachedBuildingItem {
  id: string;
  name: string;
  floorNumber?: number;
  headquartersId?: string;
  subHeadquartersId?: string;
}

export interface CachedRoomTypeItem {
  id: string;
  name: string;
  capacityPeople?: number;
}

export interface CachedRateItem {
  id: string;
  name: string;
  price: number;
  modality?: string;
  raw: Record<string, unknown>;
}

export interface CachedRoleItem {
  id: string;
  name: string;
}

const buildingsState = createState<CachedBuildingItem[]>();
const roomTypesState = createState<CachedRoomTypeItem[]>();
const typesBedState = createState<CachedRoomTypeItem[]>();
const ratesState = createState<CachedRateItem[]>();
const rolesState = createState<CachedRoleItem[]>();

export async function fetchBuildingsCatalogCached(
  forceRefresh = false
): Promise<CachedBuildingItem[]> {
  return resolveCached(
    buildingsState,
    async () => {
      const response = await api.get<unknown>('/building', {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return unwrapArrayPayload(response.data)
        .filter((item) => item && item.id != null)
        .map((item) => {
          const floorRaw = item.floor_number ?? item.floorNumber;
          const parsedFloor =
            typeof floorRaw === 'number'
              ? floorRaw
              : typeof floorRaw === 'string'
                ? parseInt(floorRaw, 10)
                : undefined;
          return {
            id: String(item.id).trim(),
            name:
              typeof item.name === 'string' && item.name.trim()
                ? item.name.trim()
                : 'Edificio',
            floorNumber:
              parsedFloor && !Number.isNaN(parsedFloor) && parsedFloor > 0
                ? parsedFloor
                : undefined,
            headquartersId:
              typeof item.headquarters_id === 'string'
                ? item.headquarters_id
                : undefined,
            subHeadquartersId:
              typeof item.sub_headquarters_id === 'string'
                ? item.sub_headquarters_id
                : undefined,
          };
        });
    },
    forceRefresh
  );
}

export async function fetchRoomTypesCatalogCached(
  forceRefresh = false
): Promise<CachedRoomTypeItem[]> {
  return resolveCached(
    roomTypesState,
    async () => {
      const response = await api.get<unknown>('/room-types', {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return unwrapArrayPayload(response.data)
        .filter((item) => item && item.id != null)
        .map((item) => {
          const capRaw = item.capacity_people ?? item.capacity;
          const cap =
            typeof capRaw === 'number'
              ? capRaw
              : typeof capRaw === 'string'
                ? Number(capRaw)
                : undefined;
          return {
            id: String(item.id).trim(),
            name:
              typeof item.name === 'string' && item.name.trim()
                ? item.name.trim()
                : 'Tipo de habitación',
            capacityPeople:
              cap != null && !Number.isNaN(cap) && cap > 0 ? cap : undefined,
          };
        });
    },
    forceRefresh
  );
}

export async function fetchTypesBedCatalogCached(
  forceRefresh = false
): Promise<CachedRoomTypeItem[]> {
  return resolveCached(
    typesBedState,
    async () => {
      try {
        const response = await api.get<unknown>('/types-bed', {
          validateStatus: (s) => s >= 200 && s < 300,
        });
        return unwrapArrayPayload(response.data)
          .filter((item) => item && item.id != null)
          .map((item) => {
            const capRaw = item.capacity_people ?? item.capacity;
            const cap = typeof capRaw === 'number' ? capRaw : undefined;
            return {
              id: String(item.id).trim(),
              name:
                typeof item.name === 'string' && item.name.trim()
                  ? item.name.trim()
                  : 'Cama estándar',
              capacityPeople: cap,
            };
          });
      } catch {
        return [];
      }
    },
    forceRefresh
  );
}

export async function fetchRatesCatalogCached(
  forceRefresh = false
): Promise<CachedRateItem[]> {
  return resolveCached(
    ratesState,
    async () => {
      const response = await api.get<unknown>('/rates', {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return unwrapArrayPayload(response.data)
        .filter((item) => item && item.id != null)
        .map((item) => {
          const rawPrice = item.price;
          let price = 0;
          if (typeof rawPrice === 'number') price = rawPrice;
          else if (typeof rawPrice === 'string') {
            const p = parseFloat(rawPrice.replace(',', '.'));
            if (!Number.isNaN(p)) price = p;
          }
          return {
            id: String(item.id).trim(),
            name:
              typeof item.name === 'string' && item.name.trim()
                ? item.name.trim()
                : 'Tarifa',
            price,
            modality:
              typeof item.modality === 'string' ? item.modality : undefined,
            raw: item,
          };
        });
    },
    forceRefresh
  );
}

export async function fetchRolesCatalogCached(
  forceRefresh = false
): Promise<CachedRoleItem[]> {
  return resolveCached(
    rolesState,
    async () => {
      const response = await api.get<unknown>('/roles', {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return unwrapArrayPayload(response.data)
        .filter((item) => item && item.id != null && typeof item.name === 'string')
        .map((item) => ({
          id: String(item.id).trim(),
          name: String(item.name),
        }));
    },
    forceRefresh
  );
}

export function invalidateHabitacionesCatalogCache(
  target?: 'buildings' | 'roomTypes' | 'typesBed' | 'rates' | 'roles'
): void {
  const clear = <T,>(s: SharedCatalogState<T>) => {
    s.data = null;
    s.expiresAt = 0;
  };
  if (!target || target === 'buildings') clear(buildingsState);
  if (!target || target === 'roomTypes') clear(roomTypesState);
  if (!target || target === 'typesBed') clear(typesBedState);
  if (!target || target === 'rates') clear(ratesState);
  if (!target || target === 'roles') clear(rolesState);
}
