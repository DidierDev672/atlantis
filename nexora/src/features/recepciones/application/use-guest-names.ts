import { useEffect, useState } from 'react';
import { detectarRecursosDispositivoRecepciones } from '../infrastructure/recepciones-resource-detector';
import { catalogApi } from '../../../shared/catalog';
import { SAMPLE_PERSONS } from '../infrastructure/stays-api';

function getCachedGuestName(id: string): string | undefined {
  const catalogHit = catalogApi.getCachedPerson(id);
  if (catalogHit?.name) return catalogHit.name;
  const sample = SAMPLE_PERSONS[id];
  if (sample?.name) {
    catalogApi.primePerson({ ...sample, id });
    return sample.name;
  }
  return undefined;
}

async function resolveGuestNameDeduped(id: string): Promise<string | null> {
  const cached = getCachedGuestName(id);
  if (cached !== undefined) return cached;

  try {
    const res = await catalogApi.getPerson(id);
    return res.data?.name || null;
  } catch {
    return null;
  }
}

/**
 * Hook compartido para resolver nombres de huéspedes sobre `catalogApi`
 * (caché única LRU+TTL + deduplicación en vuelo + lotes acotados),
 * evitando duplicar GET /person/{id} con modales y acordeones.
 */
export function useGuestNames(personIds: string[]): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const id of personIds) {
      const hit = getCachedGuestName(id);
      if (hit) initial[id] = hit;
    }
    return initial;
  });

  const idsKey = personIds.join(',');

  useEffect(() => {
    let isMounted = true;
    const uniqueIds = Array.from(
      new Set(personIds.map((id) => id.trim()).filter(Boolean))
    );
    const missingIds = uniqueIds.filter(
      (id) => getCachedGuestName(id) === undefined
    );

    const syncFromCache = () => {
      if (!isMounted) return;
      setNames((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const id of uniqueIds) {
          const val = getCachedGuestName(id);
          if (val && next[id] !== val) {
            next[id] = val;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    if (missingIds.length === 0) {
      void Promise.resolve().then(syncFromCache);
      return () => {
        isMounted = false;
      };
    }

    const loadBatched = async () => {
      try {
        const batchSize =
          detectarRecursosDispositivoRecepciones().policy.batchConcurrency;
        for (let i = 0; i < missingIds.length; i += batchSize) {
          if (!isMounted) return;
          const chunk = missingIds.slice(i, i + batchSize);
          await Promise.allSettled(chunk.map(resolveGuestNameDeduped));
        }
        syncFromCache();
      } catch (err) {
        console.error('Error al resolver nombres de huéspedes:', err);
      }
    };

    void loadBatched();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return names;
}
