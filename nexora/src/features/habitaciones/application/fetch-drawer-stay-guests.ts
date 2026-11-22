import { api } from '../../../lib/api';
import { translateDocumentTypeToSpanish } from '../domain/habitacion-stay';
import { BoundedTtlCache } from '../infrastructure/bounded-ttl-cache';

export interface DrawerGuestItem {
  id: string;
  name: string;
  documentLabel?: string;
  phoneNumber?: string;
  isPrimary: boolean;
}

const PERSON_CACHE_TTL_MS = 2 * 60 * 1000;
const PERSON_FETCH_BATCH = 6;
const personCache = new BoundedTtlCache<string, Record<string, unknown>>(
  120,
  PERSON_CACHE_TTL_MS
);
const personInFlight = new Map<string, Promise<Record<string, unknown> | null>>();

function extractPersonArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item && typeof item === 'object')
    );
  }
  if (payload && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.data)) {
      return rec.data.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item && typeof item === 'object')
      );
    }
    if ('id' in rec || 'name' in rec) {
      return [rec];
    }
  }
  return [];
}

function mapRecordToGuest(
  raw: Record<string, unknown>,
  index: number
): DrawerGuestItem {
  const id = String(raw.id ?? raw.person_id ?? `guest-${index}`);
  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim()
      : 'Huésped sin nombre';
  const docType =
    typeof raw.document_type === 'string' && raw.document_type.trim()
      ? translateDocumentTypeToSpanish(raw.document_type)
      : '';
  const docNum =
    typeof raw.document_number === 'string' && raw.document_number.trim()
      ? raw.document_number.trim()
      : '';
  const documentLabel =
    docType && docNum ? `${docType}: ${docNum}` : docNum || undefined;
  const phoneNumber =
    typeof raw.phone_number === 'string' && raw.phone_number.trim()
      ? raw.phone_number.trim()
      : undefined;

  return {
    id,
    name,
    documentLabel,
    phoneNumber,
    isPrimary: index === 0,
  };
}

async function fetchPersonCached(
  personId: string
): Promise<Record<string, unknown> | null> {
  const cached = personCache.get(personId);
  if (cached) return cached;

  const inflight = personInFlight.get(personId);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const res = await api.get<unknown>(
        `/person/${encodeURIComponent(personId)}`,
        { validateStatus: (s) => s >= 200 && s < 300 }
      );
      const list = extractPersonArray(res.data);
      const record = list[0] ?? null;
      if (record) personCache.set(personId, record);
      return record;
    } finally {
      personInFlight.delete(personId);
    }
  })();

  personInFlight.set(personId, promise);
  return promise;
}

/**
 * Obtiene huéspedes de la estancia (`/stays_person/{stayId}` y `/person/{id}`
 * en lotes acotados con caché TTL de 2 min y deduplicación).
 */
export async function fetchDrawerStayGuests(
  stayId: string,
  stayData: Record<string, unknown>
): Promise<DrawerGuestItem[]> {
  const guestsById = new Map<string, DrawerGuestItem>();

  try {
    const pRes = await api.get<unknown>(
      `/stays_person/${encodeURIComponent(stayId)}`,
      { validateStatus: (s) => s >= 200 && s < 300 }
    );
    const records = extractPersonArray(pRes.data);
    records.forEach((rec, idx) => {
      const mapped = mapRecordToGuest(rec, idx);
      if (!guestsById.has(mapped.id)) {
        guestsById.set(mapped.id, mapped);
      }
      if (mapped.id) {
        personCache.set(mapped.id, rec);
      }
    });
  } catch {
    // Continuar con respaldo por person_ids si /stays_person falla
  }

  try {
    const rawPersonIds = Array.isArray(stayData.person_ids)
      ? stayData.person_ids
      : [];
    const missingIds = rawPersonIds
      .map((id) => String(id ?? '').trim())
      .filter((id) => id.length > 0 && !guestsById.has(id));

    for (let i = 0; i < missingIds.length; i += PERSON_FETCH_BATCH) {
      const chunk = missingIds.slice(i, i + PERSON_FETCH_BATCH);
      const settled = await Promise.allSettled(
        chunk.map((pid) => fetchPersonCached(pid))
      );
      for (const entry of settled) {
        if (entry.status === 'fulfilled' && entry.value) {
          const idx = guestsById.size;
          const mapped = mapRecordToGuest(entry.value, idx);
          if (!guestsById.has(mapped.id)) {
            guestsById.set(mapped.id, mapped);
          }
        }
      }
    }
  } catch {
    // Fallback silencioso
  }

  return Array.from(guestsById.values()).map((guest, idx) => ({
    ...guest,
    isPrimary: idx === 0,
  }));
}
