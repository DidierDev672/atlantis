import { api } from '../../../lib/api';
import { translateDocumentTypeToSpanish } from '../domain/habitacion-stay';

export interface DrawerGuestItem {
  id: string;
  name: string;
  documentLabel?: string;
  phoneNumber?: string;
  isPrimary: boolean;
}

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

/**
 * Obtiene todos los huéspedes vinculados a una estancia (`/stays_person/{stayId}`
 * y respaldo con `/person/{id}` para cualquier `person_ids` faltante).
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

    if (missingIds.length > 0) {
      const settled = await Promise.allSettled(
        missingIds.map(async (pid) => {
          const res = await api.get<unknown>(
            `/person/${encodeURIComponent(pid)}`,
            { validateStatus: (s) => s >= 200 && s < 300 }
          );
          const list = extractPersonArray(res.data);
          return list[0] ?? null;
        })
      );

      settled.forEach((entry) => {
        if (entry.status === 'fulfilled' && entry.value) {
          const idx = guestsById.size;
          const mapped = mapRecordToGuest(entry.value, idx);
          if (!guestsById.has(mapped.id)) {
            guestsById.set(mapped.id, mapped);
          }
        }
      });
    }
  } catch {
    // Fallback silencioso
  }

  return Array.from(guestsById.values()).map((guest, idx) => ({
    ...guest,
    isPrimary: idx === 0,
  }));
}
