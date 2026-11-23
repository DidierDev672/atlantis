import { useEffect, useMemo, useState } from 'react';
import { detectarRecursosDispositivoRecepciones } from '../infrastructure/recepciones-resource-detector';
import {
  catalogApi,
  formatFriendlyRoomTypeName,
} from '../../../shared/catalog';
import {
  inferFloorFromRoomNumber,
  mapStayToRecepcion,
  normalizeRoomFloorStatus,
  type FloorReceptionEntry,
  type FloorReceptionGroup,
  type RoomFloorMetadata,
} from '../domain/recepcion-floor';
import type { StayItem } from '../domain/stay';
import { useGuestNames } from './use-guest-names';

interface RoomBaseMeta {
  number: string;
  floor: number;
  status: string;
  roomTypeId?: string;
}

/**
 * Hook de aplicación que resuelve de forma perezosa y bajo demanda:
 * 1) Habitación base (`catalogApi.getRoom`) en lotes acotados para agrupar por piso.
 * 2) Tipo de habitación (`catalogApi.getRoomType`) y huéspedes (`useGuestNames`)
 *    exclusivamente para los acordeones de piso abiertos (cero tráfico en acordeones cerrados).
 */
export function useRecepcionesFloorGroups(
  stays: StayItem[],
  toggledFloors: Record<string, boolean> = {}
): {
  floorGroups: FloorReceptionGroup[];
  loadingFloors: boolean;
} {
  const [roomBaseMap, setRoomBaseMap] = useState<Record<string, RoomBaseMeta>>(
    () => {
      const initial: Record<string, RoomBaseMeta> = {};
      for (const stay of stays) {
        const rid = String(stay.room_id ?? '').trim();
        if (!rid || initial[rid]) continue;
        const cached = catalogApi.getCachedRoom(rid);
        if (cached) {
          const numberStr = String(cached.number ?? '').trim() || '—';
          initial[rid] = {
            number: numberStr,
            floor:
              typeof cached.floor === 'number' && cached.floor > 0
                ? cached.floor
                : inferFloorFromRoomNumber(numberStr),
            status: cached.status || 'occupied',
            roomTypeId: cached.room_types_id || undefined,
          };
        }
      }
      return initial;
    }
  );
  const [roomTypeNameMap, setRoomTypeNameMap] = useState<
    Record<string, string>
  >({});
  const [loadingFloors, setLoadingFloors] = useState(false);

  const uniqueRoomIds = useMemo(
    () =>
      Array.from(
        new Set(stays.map((s) => String(s.room_id ?? '').trim()).filter(Boolean))
      ),
    [stays]
  );

  // 1. Resolver metadata base de habitación para agrupar por piso (sin llamar room-types aún)
  useEffect(() => {
    const missingRoomIds = uniqueRoomIds.filter((id) => !roomBaseMap[id]);
    if (missingRoomIds.length === 0) return;

    let active = true;

    const loadRoomsBase = async () => {
      setLoadingFloors(true);
      try {
        const batchSize =
          detectarRecursosDispositivoRecepciones().policy.batchConcurrency;
        const allResolved: PromiseSettledResult<{
          roomId: string;
          meta: RoomBaseMeta;
        } | null>[] = [];

        for (let i = 0; i < missingRoomIds.length; i += batchSize) {
          if (!active) return;
          const chunk = missingRoomIds.slice(i, i + batchSize);
          const chunkResults = await Promise.allSettled(
            chunk.map(async (roomId) => {
              const roomRes = await catalogApi.getRoom(roomId);
              const room = roomRes.data;
              if (!room) return null;

              const numberStr = String(room.number ?? '').trim() || '—';
              const floorNum =
                typeof room.floor === 'number' && room.floor > 0
                  ? room.floor
                  : inferFloorFromRoomNumber(numberStr);

              return {
                roomId,
                meta: {
                  number: numberStr,
                  floor: floorNum,
                  status: room.status || 'occupied',
                  roomTypeId: room.room_types_id || undefined,
                } satisfies RoomBaseMeta,
              };
            })
          );
          allResolved.push(...chunkResults);
        }

        if (!active) return;

        setRoomBaseMap((prev) => {
          const next = { ...prev };
          for (const item of allResolved) {
            if (item.status === 'fulfilled' && item.value) {
              next[item.value.roomId] = item.value.meta;
            }
          }
          return next;
        });
      } catch (err) {
        console.error('Error al agrupar habitaciones por piso:', err);
      } finally {
        if (active) setLoadingFloors(false);
      }
    };

    void loadRoomsBase();

    return () => {
      active = false;
    };
  }, [roomBaseMap, uniqueRoomIds]);

  // Calcular pisos ordenados y determinar cuáles acordeones están abiertos
  const openFloorAssignment = useMemo(() => {
    const floorNumbers = new Set<number>();
    const stayFloorKeyMap = new Map<string, string>();

    for (const stay of stays) {
      const base = roomBaseMap[stay.room_id];
      const fallbackMatch = stay.room_id.match(
        /^(?:room|hab|habitacion)[-_]?(\d+)$/i
      );
      const fallbackNum = fallbackMatch ? fallbackMatch[1] : '—';
      const floorNum =
        base?.floor || inferFloorFromRoomNumber(fallbackNum) || 1;
      floorNumbers.add(floorNum);
      stayFloorKeyMap.set(stay.id, `piso-${floorNum}`);
    }

    const sortedFloors = Array.from(floorNumbers).sort((a, b) => a - b);
    const firstFloorKey =
      sortedFloors.length > 0 ? `piso-${sortedFloors[0]}` : '';

    const openSet = new Set<string>();
    for (const floorNum of sortedFloors) {
      const key = `piso-${floorNum}`;
      const isOpen =
        key in toggledFloors ? Boolean(toggledFloors[key]) : key === firstFloorKey;
      if (isOpen) openSet.add(key);
    }

    return { openSet, stayFloorKeyMap };
  }, [roomBaseMap, stays, toggledFloors]);

  // 2. Resolver person_ids y room_types_id SOLO para los pisos abiertos
  const openPersonIds = useMemo(() => {
    const ids = new Set<string>();
    for (const stay of stays) {
      const floorKey = openFloorAssignment.stayFloorKeyMap.get(stay.id);
      if (!floorKey || !openFloorAssignment.openSet.has(floorKey)) continue;
      for (const pid of stay.person_ids ?? []) {
        const clean = String(pid ?? '').trim();
        if (clean) ids.add(clean);
      }
    }
    return Array.from(ids);
  }, [openFloorAssignment, stays]);

  const openRoomTypeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const stay of stays) {
      const floorKey = openFloorAssignment.stayFloorKeyMap.get(stay.id);
      if (!floorKey || !openFloorAssignment.openSet.has(floorKey)) continue;
      const typeId = roomBaseMap[stay.room_id]?.roomTypeId;
      if (typeId) ids.add(typeId);
    }
    return Array.from(ids);
  }, [openFloorAssignment, roomBaseMap, stays]);

  const guestNames = useGuestNames(openPersonIds);

  useEffect(() => {
    const missingTypeIds = openRoomTypeIds.filter(
      (id) => !(id in roomTypeNameMap)
    );
    if (missingTypeIds.length === 0) return;

    let active = true;

    const loadOpenRoomTypes = async () => {
      try {
        const batchSize =
          detectarRecursosDispositivoRecepciones().policy.batchConcurrency;
        const resolvedPairs: Array<[string, string]> = [];

        for (let i = 0; i < missingTypeIds.length; i += batchSize) {
          if (!active) return;
          const chunk = missingTypeIds.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            chunk.map(async (typeId) => {
              try {
                const res = await catalogApi.getRoomType(typeId);
                return [
                  typeId,
                  res.data?.name
                    ? formatFriendlyRoomTypeName(res.data.name)
                    : formatFriendlyRoomTypeName(typeId),
                ] as [string, string];
              } catch {
                return [typeId, formatFriendlyRoomTypeName(typeId)] as [
                  string,
                  string,
                ];
              }
            })
          );
          for (const r of results) {
            if (r.status === 'fulfilled') {
              resolvedPairs.push(r.value);
            }
          }
        }

        if (!active || resolvedPairs.length === 0) return;

        setRoomTypeNameMap((prev) => {
          const next = { ...prev };
          for (const [id, name] of resolvedPairs) {
            next[id] = name;
          }
          return next;
        });
      } catch (err) {
        console.error('Error al cargar tipos de habitación:', err);
      }
    };

    void loadOpenRoomTypes();

    return () => {
      active = false;
    };
  }, [openRoomTypeIds, roomTypeNameMap]);

  const floorGroups = useMemo<FloorReceptionGroup[]>(() => {
    try {
      const grouped = new Map<number, FloorReceptionEntry[]>();

      for (const stay of stays) {
        const base = roomBaseMap[stay.room_id];
        const fallbackMatch = stay.room_id.match(
          /^(?:room|hab|habitacion)[-_]?(\d+)$/i
        );
        const fallbackNum = fallbackMatch ? fallbackMatch[1] : '—';
        const resolvedTypeName =
          base?.roomTypeId && roomTypeNameMap[base.roomTypeId]
            ? roomTypeNameMap[base.roomTypeId]
            : 'Estándar';

        const effectiveMeta: RoomFloorMetadata = base
          ? {
              number: base.number,
              floor: base.floor,
              status: base.status,
              roomTypeName: resolvedTypeName,
            }
          : {
              number: fallbackNum,
              floor: inferFloorFromRoomNumber(fallbackNum),
              status: stay.status === 'progress' ? 'occupied' : 'available',
              roomTypeName: 'Estándar',
            };

        const guestNamesText = (stay.person_ids ?? [])
          .map((pid) => guestNames[pid] || '')
          .filter(Boolean)
          .join(' ');

        const entry: FloorReceptionEntry = {
          stay,
          recepcion: mapStayToRecepcion(stay, effectiveMeta),
          roomNumber: effectiveMeta.number,
          roomTypeName: effectiveMeta.roomTypeName,
          roomStatusKey: normalizeRoomFloorStatus(effectiveMeta.status),
          guestNamesText,
        };

        const floorNum = effectiveMeta.floor || 1;
        const list = grouped.get(floorNum) ?? [];
        list.push(entry);
        grouped.set(floorNum, list);
      }

      return Array.from(grouped.entries())
        .sort(([a], [b]) => a - b)
        .map(([floorNumber, entries]) => ({
          floorKey: `piso-${floorNumber}`,
          floorNumber,
          floorLabel: `Piso ${floorNumber}`,
          entries: entries.sort((a, b) =>
            a.roomNumber.localeCompare(b.roomNumber, 'es', { numeric: true })
          ),
        }));
    } catch (err) {
      console.error('Error al construir grupos de pisos:', err);
      return [];
    }
  }, [guestNames, roomBaseMap, roomTypeNameMap, stays]);

  return { floorGroups, loadingFloors };
}
