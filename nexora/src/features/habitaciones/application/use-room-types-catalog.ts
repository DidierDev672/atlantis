import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { validateStatusCode } from '../../../shared/lib/status-code-validator';
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown';
import {
  fetchRoomTypesCatalogCached,
  type CachedRoomTypeItem,
} from '../infrastructure/habitaciones-catalogs-cache';

function mapCatalogToDropdownOptions(
  items: CachedRoomTypeItem[]
): DropdownOption[] {
  return items.map((item) => {
    const hasCapacity = item.capacityPeople != null && item.capacityPeople > 0;
    const label = hasCapacity
      ? `${item.name} · ${item.capacityPeople} ${
          item.capacityPeople === 1 ? 'persona' : 'personas'
        }`
      : item.name;

    return {
      id: item.id,
      value: item.id,
      label,
      rawName: item.name,
    };
  });
}

/**
 * Hook que reutiliza la caché compartida de `/room-types` (TTL 5 min + deduplicación)
 * evitando descargas duplicadas al alternar entre Lista y Crear habitación.
 */
export function useRoomTypesCatalog() {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadRoomTypes = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const catalog = await fetchRoomTypesCatalogCached(forceRefresh);
      if (!isMountedRef.current) return;
      setOptions(mapCatalogToDropdownOptions(catalog));
    } catch (err) {
      if (!isMountedRef.current) return;
      const status = isAxiosError(err) ? (err.response?.status ?? 0) : 0;
      const validation = validateStatusCode(status);
      setError(
        validation.message ??
          'No pudimos obtener los tipos de habitación en este momento.'
      );
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const reload = useCallback(async () => {
    await loadRoomTypes(true);
  }, [loadRoomTypes]);

  useEffect(() => {
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active || !isMountedRef.current) return;
      await loadRoomTypes(false);
    })();
    return () => {
      active = false;
    };
  }, [loadRoomTypes]);

  return {
    options,
    loading,
    error,
    reload,
  };
}
