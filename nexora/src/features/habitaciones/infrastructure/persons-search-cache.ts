import { api } from '../../../lib/api';
import { validateStatusCode } from '../../../shared/lib/status-code-validator';
import { BoundedTtlCache } from './bounded-ttl-cache';
import { detectarCapacidadesHardwareYRed } from './device-resource-profile';

export interface CachedPersonItem {
  id: string;
  document_type: string;
  document_number: string;
  name: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  roles?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchPersonsResult {
  items: CachedPersonItem[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  statusCode: number;
  errorNotice?: {
    title: string;
    message: string;
    category: 'warning' | 'error' | 'info';
  };
}

const PERSONS_CACHE_TTL_MS = 2 * 60 * 1000;
const PAGE_CACHE = new BoundedTtlCache<string, SearchPersonsResult>(
  25,
  PERSONS_CACHE_TTL_MS
);
const ALL_PERSONS_CACHE = new BoundedTtlCache<string, CachedPersonItem[]>(
  2,
  PERSONS_CACHE_TTL_MS
);
const IN_FLIGHT = new Map<string, Promise<SearchPersonsResult>>();

export const PERSONS_PAGE_SIZE = 20;

function extractPersonsPayload(data: unknown): {
  items: CachedPersonItem[];
  totalCount?: number;
} {
  if (Array.isArray(data)) {
    return { items: data as CachedPersonItem[] };
  }
  if (data && typeof data === 'object') {
    const rec = data as Record<string, unknown>;
    const list = Array.isArray(rec.data)
      ? (rec.data as CachedPersonItem[])
      : Array.isArray(rec.items)
        ? (rec.items as CachedPersonItem[])
        : [];
    const totalRaw = rec.total ?? rec.totalCount ?? rec.count;
    const totalCount = typeof totalRaw === 'number' ? totalRaw : undefined;
    return { items: list, totalCount };
  }
  return { items: [] };
}

function filterLocally(
  list: CachedPersonItem[],
  search: string
): CachedPersonItem[] {
  const term = search.trim().toLowerCase();
  if (!term) return list;
  return list.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.document_number && p.document_number.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term))
  );
}

/**
 * Consulta paginada y cacheada para `GET /persons` (`page`, `limit`, `search`).
 * Si el backend devuelve toda la colección ignorando paginación, la cachea por TTL (2 min)
 * y sirve localmente ventanas paginadas de 20 registros para ahorrar red y renderizado.
 */
export async function searchPersonsCached({
  search = '',
  page = 1,
  limit,
  forceRefresh = false,
}: {
  search?: string;
  page?: number;
  limit?: number;
  forceRefresh?: boolean;
}): Promise<SearchPersonsResult> {
  const cleanSearch = search.trim();
  const safePage = Math.max(1, page);
  const adaptiveLimit =
    limit ?? detectarCapacidadesHardwareYRed().policy.personsPageLimit;
  const safeLimit = Math.max(1, adaptiveLimit);
  const cacheKey = `${cleanSearch.toLowerCase()}::p=${safePage}::l=${safeLimit}`;

  if (!forceRefresh) {
    const pageHit = PAGE_CACHE.get(cacheKey);
    if (pageHit) return pageHit;

    // Si ya tenemos el catálogo completo cacheado, paginamos/filtramos sin tocar la red
    const fullList = ALL_PERSONS_CACHE.get('all');
    if (fullList) {
      const filtered = filterLocally(fullList, cleanSearch);
      const start = (safePage - 1) * safeLimit;
      const slice = filtered.slice(start, start + safeLimit);
      return {
        items: slice,
        totalCount: filtered.length,
        page: safePage,
        limit: safeLimit,
        hasMore: start + slice.length < filtered.length,
        statusCode: 200,
      };
    }

    const inFlight = IN_FLIGHT.get(cacheKey);
    if (inFlight) return inFlight;
  }

  const requestPromise = (async (): Promise<SearchPersonsResult> => {
    try {
      const params: Record<string, string | number> = {
        page: safePage,
        limit: safeLimit,
      };
      if (cleanSearch) params.search = cleanSearch;

      const response = await api.get<unknown>('/persons', {
        params,
        validateStatus: () => true,
      });

      const validation = validateStatusCode(response.status);
      if (response.status === 200 && response.data) {
        const { items, totalCount } = extractPersonsPayload(response.data);

        // Si el servidor devolvió más elementos que el `limit` solicitado, no paginó:
        // guardamos una copia acotada por TTL y devolvemos solo la ventana actual.
        if (items.length > safeLimit && !cleanSearch) {
          ALL_PERSONS_CACHE.set('all', items);
          const start = (safePage - 1) * safeLimit;
          const slice = items.slice(start, start + safeLimit);
          return {
            items: slice,
            totalCount: items.length,
            page: safePage,
            limit: safeLimit,
            hasMore: start + slice.length < items.length,
            statusCode: 200,
          };
        }

        const resolvedTotal = totalCount ?? items.length;
        const result: SearchPersonsResult = {
          items,
          totalCount: resolvedTotal,
          page: safePage,
          limit: safeLimit,
          hasMore:
            totalCount != null
              ? safePage * safeLimit < totalCount
              : items.length === safeLimit,
          statusCode: 200,
        };
        PAGE_CACHE.set(cacheKey, result);
        return result;
      }

      return {
        items: [],
        totalCount: 0,
        page: safePage,
        limit: safeLimit,
        hasMore: false,
        statusCode: response.status,
        errorNotice: {
          title: validation.title || `Aviso (${response.status})`,
          message:
            validation.message ||
            'No fue posible consultar la lista de personas registradas.',
          category: validation.category === 'warning' ? 'warning' : 'error',
        },
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        items: [],
        totalCount: 0,
        page: safePage,
        limit: safeLimit,
        hasMore: false,
        statusCode: 0,
        errorNotice: {
          title: 'Intermitencia de conexión',
          message: `Tus datos están protegidos. Ocurrió una intermitencia al contactar el servidor: ${errMsg}. Reintenta en unos instantes.`,
          category: 'error',
        },
      };
    } finally {
      IN_FLIGHT.delete(cacheKey);
    }
  })();

  IN_FLIGHT.set(cacheKey, requestPromise);
  return requestPromise;
}

export function invalidatePersonsSearchCache(): void {
  PAGE_CACHE.clear();
  ALL_PERSONS_CACHE.clear();
}
