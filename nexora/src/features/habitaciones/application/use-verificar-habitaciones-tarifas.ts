import { useCallback, useEffect, useRef, useState } from 'react';
import { detectarCapacidadesHardwareYRed } from '../infrastructure/device-resource-profile';
import { fetchRatesCatalogCached } from '../infrastructure/habitaciones-catalogs-cache';
import {
  invalidateRoomTariffCache,
  verificarTarifaHabitacion,
  type RoomTariffCheckStatus,
} from './tarifa-room-parser';

export type { RoomTariffCheckStatus };
export { verificarTarifaHabitacion };

export interface RoomTariffCompactEntry {
  hasTariff: boolean;
  statusCode: number;
  rateId?: string;
  price?: number;
  name?: string;
}

export interface UseVerificarHabitacionesTarifasOptions {
  rooms?: Array<{ id: string }>;
}

/**
 * Hook optimizado para verificar tarifas por lotes con caché compartida de `/rates`
 * y validación condicional HTTP en recargas para reducir tráfico de red.
 */
export function useVerificarHabitacionesTarifas({
  rooms = [],
}: UseVerificarHabitacionesTarifasOptions = {}) {
  const [entriesByRoom, setEntriesByRoom] = useState<
    Record<string, RoomTariffCompactEntry>
  >({});
  const [isVerifying, setIsVerifying] = useState(false);

  const checkedRoomsRef = useRef<Set<string>>(new Set());
  const activeRoomIdsRef = useRef<Set<string>>(new Set());
  const ratesCatalogRef = useRef<
    Record<string, { id: string; name: string; price: number }>
  >({});
  const generationRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const checkedRef = checkedRoomsRef;
    const activeIdsRef = activeRoomIdsRef;
    return () => {
      isMountedRef.current = false;
      checkedRef.current.clear();
      activeIdsRef.current.clear();
      ratesCatalogRef.current = {};
    };
  }, []);

  const loadSharedRatesMap = useCallback(async (forceRefresh = false) => {
    try {
      const items = await fetchRatesCatalogCached(forceRefresh);
      const map: Record<string, { id: string; name: string; price: number }> =
        {};
      for (const item of items) {
        map[item.id] = { id: item.id, name: item.name, price: item.price };
      }
      ratesCatalogRef.current = map;
      return map;
    } catch {
      return ratesCatalogRef.current;
    }
  }, []);

  const triggerVerificar = useCallback(
    async (roomIds: string[], options?: { force?: boolean }) => {
      const validIds = Array.from(
        new Set(roomIds.map((id) => String(id).trim()).filter(Boolean))
      );
      if (validIds.length === 0) return;

      const currentGeneration = ++generationRef.current;
      setIsVerifying(true);
      for (const id of validIds) {
        checkedRoomsRef.current.add(id);
      }

      try {
        const { batchConcurrency, maxRetainedTariffEntries } =
          detectarCapacidadesHardwareYRed().policy;
        const catalogPromise = loadSharedRatesMap(Boolean(options?.force));
        const collected: RoomTariffCheckStatus[] = [];

        for (let i = 0; i < validIds.length; i += batchConcurrency) {
          if (
            !isMountedRef.current ||
            generationRef.current !== currentGeneration
          ) {
            return;
          }
          const chunk = validIds.slice(i, i + batchConcurrency);
          const settled = await Promise.allSettled(
            chunk.map((id) =>
              verificarTarifaHabitacion(id, { force: options?.force })
            )
          );
          for (const res of settled) {
            if (res.status === 'fulfilled') collected.push(res.value);
          }
        }

        const catalog = await catalogPromise;
        if (
          !isMountedRef.current ||
          generationRef.current !== currentGeneration
        ) {
          return;
        }

        setEntriesByRoom((prev) => {
          const next: Record<string, RoomTariffCompactEntry> = { ...prev };
          for (const r of collected) {
            if (r.hasTariff) {
              const catalogEntry = r.rateId ? catalog[r.rateId] : undefined;
              const resolvedPrice =
                r.price != null ? r.price : (catalogEntry?.price ?? undefined);
              const resolvedName =
                r.name != null ? r.name : (catalogEntry?.name ?? undefined);
              next[r.roomId] = {
                hasTariff: true,
                statusCode: r.statusCode,
                ...(r.rateId ? { rateId: r.rateId } : {}),
                ...(resolvedPrice != null ? { price: resolvedPrice } : {}),
                ...(resolvedName != null ? { name: resolvedName } : {}),
              };
            } else {
              next[r.roomId] = { hasTariff: false, statusCode: r.statusCode };
            }
          }

          const keys = Object.keys(next);
          if (keys.length > maxRetainedTariffEntries) {
            const activeIds = activeRoomIdsRef.current;
            for (const key of keys) {
              if (!activeIds.has(key)) {
                delete next[key];
                checkedRoomsRef.current.delete(key);
              }
            }
          }
          return next;
        });
      } catch (err) {
        console.error('Error al verificar tarifas de habitaciones:', err);
      } finally {
        if (
          isMountedRef.current &&
          generationRef.current === currentGeneration
        ) {
          setIsVerifying(false);
        }
      }
    },
    [loadSharedRatesMap]
  );

  useEffect(() => {
    const visibleIds = new Set<string>();
    for (const r of rooms) {
      const cleanId = String(r.id).trim();
      if (cleanId) visibleIds.add(cleanId);
    }
    activeRoomIdsRef.current = visibleIds;

    if (visibleIds.size === 0) return;

    const pendingIds: string[] = [];
    for (const id of visibleIds) {
      if (!checkedRoomsRef.current.has(id)) {
        pendingIds.push(id);
      }
    }
    if (pendingIds.length === 0) return;

    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled && isMountedRef.current) {
        await triggerVerificar(pendingIds);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rooms, triggerVerificar]);

  const hasTariff = useCallback(
    (roomId: string | undefined | null): boolean => {
      if (!roomId) return false;
      return Boolean(entriesByRoom[String(roomId).trim()]?.hasTariff);
    },
    [entriesByRoom]
  );

  const getRateId = useCallback(
    (roomId: string | undefined | null): string | null => {
      if (!roomId) return null;
      return entriesByRoom[String(roomId).trim()]?.rateId ?? null;
    },
    [entriesByRoom]
  );

  const getTariffPrice = useCallback(
    (roomId: string | undefined | null): number | null => {
      if (!roomId) return null;
      return entriesByRoom[String(roomId).trim()]?.price ?? null;
    },
    [entriesByRoom]
  );

  const getTariffName = useCallback(
    (roomId: string | undefined | null): string | null => {
      if (!roomId) return null;
      return entriesByRoom[String(roomId).trim()]?.name ?? null;
    },
    [entriesByRoom]
  );

  const markRoomWithTariff = useCallback(
    (
      roomId: string,
      rateId?: string,
      price?: number | null,
      name?: string | null
    ) => {
      const cleanId = String(roomId).trim();
      if (!cleanId) return;

      invalidateRoomTariffCache(cleanId);
      checkedRoomsRef.current.add(cleanId);
      const catalogEntry = rateId ? ratesCatalogRef.current[rateId] : undefined;
      const finalPrice =
        price != null ? price : (catalogEntry?.price ?? undefined);
      const finalName =
        name != null ? name : (catalogEntry?.name ?? undefined);

      setEntriesByRoom((prev) => ({
        ...prev,
        [cleanId]: {
          hasTariff: true,
          statusCode: 201,
          ...(rateId ? { rateId } : {}),
          ...(finalPrice != null ? { price: finalPrice } : {}),
          ...(finalName != null ? { name: finalName } : {}),
        },
      }));
    },
    []
  );

  const recheckRoom = useCallback(
    async (roomId: string) => {
      const cleanId = String(roomId).trim();
      if (!cleanId) return;
      invalidateRoomTariffCache(cleanId);
      checkedRoomsRef.current.delete(cleanId);
      await triggerVerificar([cleanId], { force: true });
    },
    [triggerVerificar]
  );

  const recheckAll = useCallback(async () => {
    if (!rooms || rooms.length === 0) return;
    checkedRoomsRef.current.clear();
    const allIds = rooms.map((r) => r.id).filter(Boolean);
    await triggerVerificar(allIds, { force: true });
  }, [rooms, triggerVerificar]);

  return {
    entriesByRoom,
    isVerifying,
    hasTariff,
    getRateId,
    getTariffPrice,
    getTariffName,
    triggerVerificar,
    markRoomWithTariff,
    recheckRoom,
    recheckAll,
  };
}
