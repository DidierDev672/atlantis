import { isAxiosError } from 'axios';
import { api } from '../../../lib/api';
import { BoundedTtlCache } from '../infrastructure/bounded-ttl-cache';
import { detectarCapacidadesHardwareYRed } from '../infrastructure/device-resource-profile';

export interface RoomTariffCheckStatus {
  roomId: string;
  hasTariff: boolean;
  statusCode: number;
  rateId?: string | null;
  price?: number | null;
  name?: string | null;
}

interface ExtractedTariff {
  activeTariff: Record<string, unknown> | null;
  rateId: string | null;
  price: number | null;
  name: string | null;
}

interface CachedTariffHttpEntry {
  status: RoomTariffCheckStatus;
  etag?: string;
  lastModified?: string;
}

const TARIFF_CACHE_TTL_MS = 3 * 60 * 1000;
const STALE_VALIDATORS_TTL_MS = 15 * 60 * 1000;
const tariffHttpCache = new BoundedTtlCache<string, CachedTariffHttpEntry>(
  120,
  TARIFF_CACHE_TTL_MS
);
const staleConditionalCache = new BoundedTtlCache<
  string,
  CachedTariffHttpEntry
>(120, STALE_VALIDATORS_TTL_MS);
const tariffInFlight = new Map<string, Promise<RoomTariffCheckStatus>>();

const INACTIVE_STATUSES = new Set([
  'inactive',
  'inactivo',
  'cancelled',
  'cancelado',
  'disabled',
  'desactivado',
  'deleted',
  'eliminado',
]);

function isValidTariffCandidate(
  item: unknown
): item is Record<string, unknown> {
  if (!item || typeof item !== 'object') return false;
  const rec = item as Record<string, unknown>;

  if (
    typeof rec.status === 'string' &&
    INACTIVE_STATUSES.has(rec.status.toLowerCase().trim())
  ) {
    return false;
  }

  const nested = rec.data as Record<string, unknown> | undefined;
  const rateObj = (rec.rate || rec.tarifa || nested?.rate || nested?.tarifa) as
    | Record<string, unknown>
    | undefined;

  if (
    rec.rate_id ||
    rec.rateId ||
    rec.tarifa_id ||
    rec.tarifaId ||
    nested?.rate_id ||
    nested?.rateId ||
    rateObj?.id
  ) {
    return true;
  }

  if (
    rec.room_id != null &&
    (rec.id != null || rec.rate != null || rec.tarifa != null)
  ) {
    return true;
  }

  return Boolean(
    rec.id != null &&
      (rec.price != null ||
        rec.precio != null ||
        rec.modality != null ||
        rec.duration_units != null ||
        (typeof rec.name === 'string' &&
          rec.name.trim().length > 0 &&
          rec.created_at != null))
  );
}

function parseTariffValues(target: Record<string, unknown>): {
  rateId: string | null;
  price: number | null;
  name: string | null;
} {
  const nested = target.data as Record<string, unknown> | undefined;
  const rateObj = (
    target.rate ||
    target.tarifa ||
    nested?.rate ||
    nested?.tarifa
  ) as Record<string, unknown> | undefined;

  const rawRateId =
    target.rate_id ||
    target.rateId ||
    target.tarifa_id ||
    target.tarifaId ||
    nested?.rate_id ||
    nested?.rateId ||
    rateObj?.id ||
    target.id;

  const rateId = rawRateId ? String(rawRateId) : null;

  let price: number | null = null;
  const rawPrice =
    target.price ?? target.precio ?? nested?.price ?? rateObj?.price;
  if (typeof rawPrice === 'number') {
    price = rawPrice;
  } else if (typeof rawPrice === 'string') {
    const parsed = parseFloat(rawPrice.replace(',', '.'));
    if (!Number.isNaN(parsed)) price = parsed;
  }

  let name: string | null = null;
  const rawName = target.name ?? target.nombre ?? nested?.name ?? rateObj?.name;
  if (typeof rawName === 'string' && rawName.trim().length > 0) {
    name = rawName.trim();
  }

  return { rateId, price, name };
}

function pickFromArray(arr: unknown[]): ExtractedTariff {
  if (arr.length === 0) {
    return { activeTariff: null, rateId: null, price: null, name: null };
  }
  const candidates = arr.filter(isValidTariffCandidate);
  if (candidates.length === 0) {
    return { activeTariff: null, rateId: null, price: null, name: null };
  }
  const chosen =
    candidates.find(
      (c) =>
        c.is_default === true ||
        c.is_default === 1 ||
        c.default === true ||
        c.isDefault === true
    ) || candidates[0];

  return { activeTariff: chosen, ...parseTariffValues(chosen) };
}

export function extractActiveTariff(data: unknown): ExtractedTariff {
  if (!data || typeof data !== 'object') {
    return { activeTariff: null, rateId: null, price: null, name: null };
  }

  if (Array.isArray(data)) return pickFromArray(data);

  const obj = data as Record<string, unknown>;
  const arrayProps = ['data', 'room_tariffs', 'tariffs', 'results', 'items'];
  for (const prop of arrayProps) {
    if (Array.isArray(obj[prop])) return pickFromArray(obj[prop] as unknown[]);
  }

  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    const nestedObj = obj.data as Record<string, unknown>;
    if (isValidTariffCandidate(nestedObj)) {
      return { activeTariff: nestedObj, ...parseTariffValues(nestedObj) };
    }
    return { activeTariff: null, rateId: null, price: null, name: null };
  }

  if (isValidTariffCandidate(obj)) {
    return { activeTariff: obj, ...parseTariffValues(obj) };
  }

  return { activeTariff: null, rateId: null, price: null, name: null };
}

export function invalidateRoomTariffCache(roomId?: string): void {
  if (roomId) {
    const cleanId = String(roomId).trim();
    tariffHttpCache.delete(cleanId);
    staleConditionalCache.delete(cleanId);
  } else {
    tariffHttpCache.clear();
    staleConditionalCache.clear();
  }
}

/**
 * Consulta `/room_tariffs/by-room/{roomId}` con caché TTL (3 min), deduplicación
 * en vuelo y validación condicional HTTP (`If-None-Match` / `If-Modified-Since` → `304`)
 * tanto en recargas manuales como al expirar el TTL.
 */
export async function verificarTarifaHabitacion(
  roomId: string,
  options?: { force?: boolean }
): Promise<RoomTariffCheckStatus> {
  const cleanId = String(roomId).trim();
  if (!cleanId) {
    return { roomId, hasTariff: false, statusCode: 400 };
  }

  const cached = tariffHttpCache.get(cleanId);
  if (!options?.force && cached) {
    return cached.status;
  }

  const validatorEntry = cached ?? staleConditionalCache.get(cleanId);
  const inFlight = tariffInFlight.get(cleanId);
  if (inFlight) return inFlight;

  const requestPromise = (async (): Promise<RoomTariffCheckStatus> => {
    try {
      const headers: Record<string, string> = {};
      if (validatorEntry) {
        if (validatorEntry.etag) headers['If-None-Match'] = validatorEntry.etag;
        if (validatorEntry.lastModified) {
          headers['If-Modified-Since'] = validatorEntry.lastModified;
        }
      }

      const response = await api.get(
        `/room_tariffs/by-room/${encodeURIComponent(cleanId)}`,
        {
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          validateStatus: () => true,
        }
      );

      const adaptiveTtlMs =
        detectarCapacidadesHardwareYRed().policy.tariffCacheTtlMs;

      if (response.status === 304 && validatorEntry) {
        tariffHttpCache.set(cleanId, validatorEntry, adaptiveTtlMs);
        staleConditionalCache.set(cleanId, validatorEntry);
        return validatorEntry.status;
      }

      const respHeaders = response.headers as Record<string, unknown> | undefined;
      const etag =
        typeof respHeaders?.etag === 'string' ? respHeaders.etag : undefined;
      const lastModified =
        typeof respHeaders?.['last-modified'] === 'string'
          ? respHeaders['last-modified']
          : undefined;

      const statusCode = response.status;
      let result: RoomTariffCheckStatus;

      if (statusCode === 200) {
        const { activeTariff, rateId, price, name } = extractActiveTariff(
          response.data
        );
        result = activeTariff
          ? { roomId: cleanId, hasTariff: true, statusCode: 200, rateId, price, name }
          : {
              roomId: cleanId,
              hasTariff: false,
              statusCode: 200,
              rateId: null,
              price: null,
              name: null,
            };
      } else {
        result = {
          roomId: cleanId,
          hasTariff: false,
          statusCode,
          rateId: null,
          price: null,
          name: null,
        };
      }

      const nextEntry: CachedTariffHttpEntry = {
        status: result,
        etag,
        lastModified,
      };
      tariffHttpCache.set(cleanId, nextEntry, adaptiveTtlMs);
      if (etag || lastModified) {
        staleConditionalCache.set(cleanId, nextEntry);
      }
      return result;
    } catch (error: unknown) {
      const statusCode = isAxiosError(error) ? (error.response?.status ?? 0) : 0;
      return {
        roomId: cleanId,
        hasTariff: false,
        statusCode,
        rateId: null,
        price: null,
        name: null,
      };
    } finally {
      tariffInFlight.delete(cleanId);
    }
  })();

  tariffInFlight.set(cleanId, requestPromise);
  return requestPromise;
}
