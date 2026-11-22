import { isAxiosError } from 'axios';
import { api } from '../../../lib/api';
import {
  compareRoomNumbersDesc,
  type RawBedTypeData,
  type RawBuildingData,
  type RawRoomData,
} from '../domain/habitacion-lista';
import { BoundedTtlCache } from './bounded-ttl-cache';
import {
  fetchBuildingsCatalogCached,
  fetchRoomTypesCatalogCached,
  fetchTypesBedCatalogCached,
  invalidateHabitacionesCatalogCache,
} from './habitaciones-catalogs-cache';

export interface BuildingCacheEntry {
  name: string;
  floorNumber?: number;
  headquartersId?: string;
  subHeadquartersId?: string;
}

export interface BedCacheEntry {
  name: string;
  capacityPeople?: number;
}

const CACHE_MAX_ENTRIES = 60;
const CACHE_TTL_MS = 5 * 60 * 1000;

const buildingCache = new BoundedTtlCache<string, BuildingCacheEntry>(
  CACHE_MAX_ENTRIES,
  CACHE_TTL_MS
);
const buildingPromises = new Map<string, Promise<BuildingCacheEntry | null>>();

const bedCache = new BoundedTtlCache<string, BedCacheEntry>(
  CACHE_MAX_ENTRIES,
  CACHE_TTL_MS
);
const bedPromises = new Map<string, Promise<BedCacheEntry | null>>();

export class ApiHabitacionListaRepository {
  async getRooms(): Promise<RawRoomData[]> {
    const response = await api.get<unknown>('/room', {
      validateStatus: (status) => status >= 200 && status < 300,
    });

    let list: RawRoomData[] = [];
    if (Array.isArray(response.data)) {
      list = response.data as RawRoomData[];
    } else if (
      response.data &&
      typeof response.data === 'object' &&
      Array.isArray((response.data as { data?: unknown[] }).data)
    ) {
      list = (response.data as { data: RawRoomData[] }).data;
    }

    return [...list].sort((a, b) => compareRoomNumbersDesc(a.number, b.number));
  }

  /**
   * Precarga todos los edificios en una sola petición (`GET /building` cacheada)
   * y calienta `buildingCache`, evitando N llamadas individuales `GET /building/{id}`.
   */
  async getAllBuildings(
    forceRefresh = false
  ): Promise<Array<BuildingCacheEntry & { id: string }>> {
    try {
      const list = await fetchBuildingsCatalogCached(forceRefresh);
      for (const item of list) {
        buildingCache.set(item.id, {
          name: item.name,
          floorNumber: item.floorNumber,
          headquartersId: item.headquartersId,
          subHeadquartersId: item.subHeadquartersId,
        });
      }
      return list;
    } catch {
      return [];
    }
  }

  async getBuilding(id: string): Promise<BuildingCacheEntry | null> {
    const cleanId = String(id).trim();
    if (!cleanId) return null;

    const cached = buildingCache.get(cleanId);
    if (cached !== undefined) return cached;

    try {
      const catalog = await fetchBuildingsCatalogCached();
      const hit = catalog.find((b) => b.id === cleanId);
      if (hit) {
        const entry: BuildingCacheEntry = {
          name: hit.name,
          floorNumber: hit.floorNumber,
          headquartersId: hit.headquartersId,
          subHeadquartersId: hit.subHeadquartersId,
        };
        buildingCache.set(cleanId, entry);
        return entry;
      }
    } catch {
      // Continuar con consulta puntual solo si falló el catálogo general
    }

    const inFlight = buildingPromises.get(cleanId);
    if (inFlight) return inFlight;

    const promise = (async () => {
      const response = await api.get<unknown>(`/building/${cleanId}`, {
        validateStatus: (status) => status === 200,
      });

      const raw = response.data as RawBuildingData | { data?: RawBuildingData };
      const item: RawBuildingData =
        raw && typeof raw === 'object' && 'data' in raw && raw.data
          ? (raw.data as RawBuildingData)
          : (raw as RawBuildingData);

      const result: BuildingCacheEntry = {
        name:
          typeof item?.name === 'string' && item.name.trim()
            ? item.name.trim()
            : 'Edificio',
        floorNumber:
          typeof item?.floor_number === 'number' ? item.floor_number : undefined,
        headquartersId:
          typeof item?.headquarters_id === 'string'
            ? item.headquarters_id
            : undefined,
        subHeadquartersId:
          typeof item?.sub_headquarters_id === 'string'
            ? item.sub_headquarters_id
            : undefined,
      };

      buildingCache.set(cleanId, result);
      return result;
    })().finally(() => {
      buildingPromises.delete(cleanId);
    });

    buildingPromises.set(cleanId, promise);
    return promise;
  }

  /**
   * Resuelve el tipo de habitación/cama priorizando los catálogos compartidos
   * (`/room-types` y `/types-bed`) para eliminar fallbacks 404 y llamadas N+1.
   */
  async getBedType(id: string): Promise<BedCacheEntry | null> {
    const cleanId = String(id).trim();
    if (!cleanId) return null;

    const cached = bedCache.get(cleanId);
    if (cached !== undefined) return cached;

    try {
      const roomTypes = await fetchRoomTypesCatalogCached();
      const rtHit = roomTypes.find((rt) => rt.id === cleanId);
      if (rtHit) {
        const entry: BedCacheEntry = {
          name: rtHit.name,
          capacityPeople: rtHit.capacityPeople,
        };
        bedCache.set(cleanId, entry);
        return entry;
      }
    } catch {
      // Continuar con catálogo de camas
    }

    try {
      const beds = await fetchTypesBedCatalogCached();
      const bedHit = beds.find((b) => b.id === cleanId);
      if (bedHit) {
        const entry: BedCacheEntry = {
          name: bedHit.name,
          capacityPeople: bedHit.capacityPeople,
        };
        bedCache.set(cleanId, entry);
        return entry;
      }
    } catch {
      // Continuar con respaldo individual si fue necesario
    }

    const inFlight = bedPromises.get(cleanId);
    if (inFlight) return inFlight;

    const promise = (async () => {
      try {
        const response = await api.get<unknown>(`/types-bed/${cleanId}`, {
          validateStatus: (status) => status === 200,
        });
        const raw = response.data as RawBedTypeData | { data?: RawBedTypeData };
        const item: RawBedTypeData =
          raw && typeof raw === 'object' && 'data' in raw && raw.data
            ? (raw.data as RawBedTypeData)
            : (raw as RawBedTypeData);

        const cap =
          typeof item?.capacity_people === 'number'
            ? item.capacity_people
            : typeof item?.capacity === 'number'
              ? item.capacity
              : undefined;

        const result: BedCacheEntry = {
          name:
            typeof item?.name === 'string' && item.name.trim()
              ? item.name.trim()
              : 'Cama estándar',
          capacityPeople: cap,
        };

        bedCache.set(cleanId, result);
        return result;
      } catch (err) {
        const is404 = isAxiosError(err) && err.response?.status === 404;
        if (is404) {
          const fallbackResp = await api.get<unknown>(
            `/room-types/${cleanId}`,
            { validateStatus: (status) => status === 200 }
          );
          const fRaw = fallbackResp.data as
            | RawBedTypeData
            | { data?: RawBedTypeData };
          const fItem =
            fRaw && typeof fRaw === 'object' && 'data' in fRaw && fRaw.data
              ? (fRaw.data as RawBedTypeData)
              : (fRaw as RawBedTypeData);

          const fCap =
            typeof fItem?.capacity_people === 'number'
              ? fItem.capacity_people
              : typeof fItem?.capacity === 'number'
                ? fItem.capacity
                : undefined;

          const result: BedCacheEntry = {
            name:
              typeof fItem?.name === 'string' && fItem.name.trim()
                ? fItem.name.trim()
                : 'Habitación estándar',
            capacityPeople: fCap,
          };
          bedCache.set(cleanId, result);
          return result;
        }
        throw err;
      }
    })().finally(() => {
      bedPromises.delete(cleanId);
    });

    bedPromises.set(cleanId, promise);
    return promise;
  }

  invalidateBuilding(id: string) {
    buildingCache.delete(id);
    buildingPromises.delete(id);
    invalidateHabitacionesCatalogCache('buildings');
  }

  invalidateBed(id: string) {
    bedCache.delete(id);
    bedPromises.delete(id);
    invalidateHabitacionesCatalogCache('roomTypes');
    invalidateHabitacionesCatalogCache('typesBed');
  }

  clearCaches() {
    buildingCache.clear();
    buildingPromises.clear();
    bedCache.clear();
    bedPromises.clear();
  }

  async updateRoomStatus(
    room: {
      id: string;
      number: string;
      floor: number | string;
      roomTypesId?: string;
      buildingId?: string;
      priceOverride?: number | null;
    },
    newStatus: string
  ): Promise<void> {
    const cleanId = String(room.id).trim();
    if (!cleanId) return;

    const floorNum = Number(room.floor);
    const payload = {
      number: String(room.number).trim(),
      floor: Number.isNaN(floorNum) ? 1 : floorNum,
      room_types_id: room.roomTypesId ?? '',
      building_id: room.buildingId ?? '',
      price_override: room.priceOverride ?? null,
      status: newStatus,
      has_reception: false,
    };

    await api.put(`/room/${cleanId}`, payload, {
      validateStatus: (s) => s >= 200 && s < 300,
    });
  }
}
