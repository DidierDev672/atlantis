import { useEffect, useState } from 'react';
import { detectarRecursosDispositivoRecepciones } from '../infrastructure/recepciones-resource-detector';
import { catalogApi } from '../../../shared/catalog';
import { SAMPLE_ROOMS } from '../infrastructure/room-api';

function extractFallbackRoomNumber(id: string): string {
  const match = id.match(/^(?:room|hab|habitacion)[-_]?(\d+)$/i);
  return match ? match[1] : '';
}

function getCachedRoomNumber(id: string): string | undefined {
  const cached = catalogApi.getCachedRoom(id);
  if (cached?.number) return String(cached.number);
  const sample = SAMPLE_ROOMS[id];
  if (sample?.number) {
    catalogApi.primeRoom({ ...sample, id });
    return sample.number;
  }
  return undefined;
}

async function resolveRoomNumberDeduped(id: string): Promise<string | null> {
  const cached = getCachedRoomNumber(id);
  if (cached !== undefined) return cached;

  try {
    const res = await catalogApi.getRoom(id);
    if (res.data?.number) {
      return String(res.data.number);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hook compartido para resolver números de habitación sobre `catalogApi`
 * (caché única LRU+TTL + deduplicación en vuelo + lotes acotados),
 * evitando repetir GET /room/{id} entre Cards, Tabla y Drawer.
 */
export function useRoomNumbers(roomIds: string[]): Record<string, string> {
  const [numbers, setNumbers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const id of roomIds) {
      const hit = getCachedRoomNumber(id);
      initial[id] = hit ?? (extractFallbackRoomNumber(id) || id);
    }
    return initial;
  });

  const idsKey = roomIds.join(',');

  useEffect(() => {
    let isMounted = true;
    const uniqueIds = Array.from(
      new Set(roomIds.map((id) => id.trim()).filter(Boolean))
    );
    const missingIds = uniqueIds.filter(
      (id) => getCachedRoomNumber(id) === undefined
    );

    const syncFromCache = () => {
      if (!isMounted) return;
      setNumbers((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const id of uniqueIds) {
          const val = getCachedRoomNumber(id);
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
          await Promise.allSettled(chunk.map(resolveRoomNumberDeduped));
        }
        syncFromCache();
      } catch (err) {
        console.error('Error al resolver números de habitación:', err);
      }
    };

    void loadBatched();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return numbers;
}

/**
 * Hook individual para resolver el número (`number`) de una habitación por su id.
 */
export function useRoomNumber(roomId?: string | null): string {
  const [resolved, setResolved] = useState<{ id: string; value: string } | null>(
    null
  );

  useEffect(() => {
    if (!roomId) return;
    if (getCachedRoomNumber(roomId) !== undefined) return;

    let isMounted = true;

    void resolveRoomNumberDeduped(roomId).then((num) => {
      if (isMounted && num) {
        setResolved({ id: roomId, value: num });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  if (!roomId) return '';
  const cached = getCachedRoomNumber(roomId);
  if (cached !== undefined) return cached;
  if (resolved?.id === roomId) return resolved.value;
  return extractFallbackRoomNumber(roomId);
}
