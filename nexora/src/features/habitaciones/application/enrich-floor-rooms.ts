import type { RoomRow } from '../domain/habitacion-lista';
import type {
  ApiHabitacionListaRepository,
  BedCacheEntry,
  BuildingCacheEntry,
} from '../infrastructure/api-habitacion-lista-repository';
import { detectarCapacidadesHardwareYRed } from '../infrastructure/device-resource-profile';

function getEnrichConcurrency(): number {
  return detectarCapacidadesHardwareYRed().policy.batchConcurrency;
}

export interface FloorEnrichmentBatchResult {
  buildingsById: Map<
    string,
    { ok: true; data: BuildingCacheEntry } | { ok: false }
  >;
  bedsById: Map<string, { ok: true; data: BedCacheEntry } | { ok: false }>;
  resolvedBuildingNames: Array<{ id: string; name: string }>;
}

export async function fetchFloorEnrichmentBatch(
  repository: ApiHabitacionListaRepository,
  floorRows: RoomRow[]
): Promise<FloorEnrichmentBatchResult> {
  const buildingIds = Array.from(
    new Set(
      floorRows
        .map((r) => r.buildingId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const bedIds = Array.from(
    new Set(
      floorRows
        .map((r) => r.roomTypesId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const buildingsById: FloorEnrichmentBatchResult['buildingsById'] = new Map();
  const bedsById: FloorEnrichmentBatchResult['bedsById'] = new Map();
  const resolvedBuildingNames: Array<{ id: string; name: string }> = [];

  const concurrency = getEnrichConcurrency();

  for (let i = 0; i < buildingIds.length; i += concurrency) {
    const chunk = buildingIds.slice(i, i + concurrency);
    await Promise.allSettled(
      chunk.map(async (bId) => {
        try {
          const data = await repository.getBuilding(bId);
          if (data) {
            buildingsById.set(bId, { ok: true, data });
            resolvedBuildingNames.push({ id: bId, name: data.name });
          } else {
            buildingsById.set(bId, { ok: false });
          }
        } catch {
          buildingsById.set(bId, { ok: false });
        }
      })
    );
  }

  for (let i = 0; i < bedIds.length; i += concurrency) {
    const chunk = bedIds.slice(i, i + concurrency);
    await Promise.allSettled(
      chunk.map(async (bedId) => {
        try {
          const data = await repository.getBedType(bedId);
          bedsById.set(bedId, data ? { ok: true, data } : { ok: false });
        } catch {
          bedsById.set(bedId, { ok: false });
        }
      })
    );
  }

  return { buildingsById, bedsById, resolvedBuildingNames };
}

export function applyFloorEnrichmentToRows(
  prev: RoomRow[],
  { buildingsById, bedsById }: FloorEnrichmentBatchResult
): RoomRow[] {
  return prev.map((r) => {
    let updated = r;
    if (r.buildingId) {
      const bRes = buildingsById.get(r.buildingId);
      if (bRes) {
        updated = {
          ...updated,
          building: bRes.ok
            ? { id: r.buildingId, ...bRes.data, loading: false, error: false }
            : {
                id: r.buildingId,
                name: 'No disponible',
                loading: false,
                error: true,
              },
        };
      }
    }
    if (r.roomTypesId) {
      const bedRes = bedsById.get(r.roomTypesId);
      if (bedRes) {
        updated = {
          ...updated,
          bed: bedRes.ok
            ? { id: r.roomTypesId, ...bedRes.data, loading: false, error: false }
            : {
                id: r.roomTypesId,
                name: 'No disponible',
                loading: false,
                error: true,
              },
        };
      }
    }
    return updated;
  });
}

export async function preloadBuildingsMap(
  repository: ApiHabitacionListaRepository,
  mappedRows: RoomRow[]
): Promise<Map<string, BuildingCacheEntry & { id: string }>> {
  const byId = new Map<string, BuildingCacheEntry & { id: string }>();
  if (mappedRows.length === 0) return byId;

  try {
    const allBuildings = await repository.getAllBuildings();
    for (const b of allBuildings) {
      byId.set(b.id, b);
    }

    const missingIds = Array.from(
      new Set(
        mappedRows
          .map((r) => r.buildingId)
          .filter((id): id is string => Boolean(id) && !byId.has(id))
      )
    );

    const concurrency = getEnrichConcurrency();
    for (let i = 0; i < missingIds.length; i += concurrency) {
      const chunk = missingIds.slice(i, i + concurrency);
      await Promise.allSettled(
        chunk.map(async (id) => {
          try {
            const data = await repository.getBuilding(id);
            if (data) {
              byId.set(id, { id, ...data });
            }
          } catch {
            // Silencioso por edificio
          }
        })
      );
    }
  } catch {
    // Silencioso si falla catálogo general
  }
  return byId;
}
