import { api } from '../../../lib/api';
import { BoundedTtlCache } from '../infrastructure/bounded-ttl-cache';
import type { RegisteredConsumptionItem } from '../ui/molecules/drawer-tab-consumptions';
import type { ActiveStaySummary } from '../ui/molecules/drawer-tab-summary';
import { fetchDrawerStayGuests, type DrawerGuestItem } from './fetch-drawer-stay-guests';

export interface OperativaStaySnapshot {
  summary: ActiveStaySummary | null;
  consumptions: RegisteredConsumptionItem[];
  personId: string;
}

const STAY_CACHE_TTL_MS = 60 * 1000;
const staySnapshotCache = new BoundedTtlCache<string, OperativaStaySnapshot>(
  30,
  STAY_CACHE_TTL_MS
);
const staySnapshotInFlight = new Map<string, Promise<OperativaStaySnapshot>>();

export function invalidateOperativaStayCache(roomId?: string): void {
  if (roomId) {
    staySnapshotCache.delete(String(roomId).trim());
  } else {
    staySnapshotCache.clear();
  }
}

/**
 * Obtiene estadía activa, huéspedes y consumos del drawer con caché TTL corta (60s)
 * y deduplicación en vuelo para evitar ráfagas repetidas al abrir/cerrar la misma habitación.
 */
export async function fetchOperativaStaySnapshotCached(
  roomId: string,
  nightlyRate: number,
  forceRefresh = false
): Promise<OperativaStaySnapshot> {
  const cleanId = String(roomId).trim();
  if (!cleanId) return { summary: null, consumptions: [], personId: '' };

  if (!forceRefresh) {
    const cached = staySnapshotCache.get(cleanId);
    if (cached) return cached;
    const inflight = staySnapshotInFlight.get(cleanId);
    if (inflight) return inflight;
  }

  const promise = (async (): Promise<OperativaStaySnapshot> => {
    try {
      const stayRes = await api.get<Record<string, unknown>>(
        `/stay/reception/${encodeURIComponent(cleanId)}`,
        { validateStatus: (s) => s >= 200 && s < 300 }
      );
      const stayData = (stayRes.data?.data ?? stayRes.data) as Record<
        string,
        unknown
      >;
      const stayId = String(stayData?.id ?? '');
      if (!stayId) {
        const empty: OperativaStaySnapshot = {
          summary: null,
          consumptions: [],
          personId: '',
        };
        staySnapshotCache.set(cleanId, empty);
        return empty;
      }

      const checkIn = stayData?.check_in_date
        ? new Date(String(stayData.check_in_date))
        : new Date();
      const checkOut = stayData?.check_out_date
        ? new Date(String(stayData.check_out_date))
        : new Date();
      const diffDays = Math.max(
        1,
        Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000)
      );

      let guestName = 'Huésped Titular';
      let guests: DrawerGuestItem[] = [];
      let guestsCount = Array.isArray(stayData?.person_ids)
        ? Math.max(1, stayData.person_ids.length)
        : 1;
      let primaryPersonId = '';
      try {
        guests = await fetchDrawerStayGuests(stayId, stayData);
        if (guests.length > 0) {
          guestsCount = Math.max(guests.length, guestsCount);
          guestName = guests[0].name || guestName;
          primaryPersonId = guests[0].id;
        }
      } catch {
        // Fallback silencioso
      }

      let consumptionsTotal = 0;
      const loadedItems: RegisteredConsumptionItem[] = [];
      try {
        const srRes = await api.get<unknown>(
          `/service-request?stay_id=${encodeURIComponent(stayId)}`,
          { validateStatus: (s) => s >= 200 && s < 300 }
        );
        const orders = Array.isArray(srRes.data) ? srRes.data : [];
        for (const ord of orders as Record<string, unknown>[]) {
          consumptionsTotal += Number(ord?.total ?? 0);
          const items = Array.isArray(ord?.items) ? ord.items : [];
          for (const it of items as Record<string, unknown>[]) {
            loadedItems.push({
              id: String(it?.id ?? Math.random()),
              menuItemId: it?.item_menu_id ? String(it.item_menu_id) : undefined,
              name: String(it?.name_snapshot ?? 'Producto'),
              amount: Number(it?.amount ?? 1),
              priceUnit: Number(it?.price_unit ?? 0),
            });
          }
        }
      } catch {
        // Fallback silencioso
      }

      const snapshot: OperativaStaySnapshot = {
        personId: primaryPersonId,
        consumptions: loadedItems,
        summary: {
          stayId,
          guestName,
          guests,
          guestsCount,
          checkInDate: stayData?.check_in_date
            ? String(stayData.check_in_date)
            : '',
          checkOutDate: stayData?.check_out_date
            ? String(stayData.check_out_date)
            : '',
          nights: diffDays,
          lodgingTotal: nightlyRate * diffDays,
          consumptionsTotal,
          securityDeposit: Number(
            stayData?.paid_amount ?? stayData?.security_deposit ?? 0
          ),
        },
      };
      staySnapshotCache.set(cleanId, snapshot);
      return snapshot;
    } finally {
      staySnapshotInFlight.delete(cleanId);
    }
  })();

  staySnapshotInFlight.set(cleanId, promise);
  return promise;
}
