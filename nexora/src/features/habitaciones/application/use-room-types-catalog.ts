import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { validateStatusCode } from '../../../shared/lib/status-code-validator';
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer';
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown';
import type { RawRoomTypeCatalogItem } from '../domain/habitacion-lista';

function parseRoomTypesPayload(data: unknown): DropdownOption[] {
  const list: RawRoomTypeCatalogItem[] = Array.isArray(data)
    ? (data as RawRoomTypeCatalogItem[])
    : data &&
        typeof data === 'object' &&
        Array.isArray((data as { data?: unknown[] }).data)
      ? (data as { data: RawRoomTypeCatalogItem[] }).data
      : [];

  return list
    .filter((item) => item && item.id != null)
    .map((item) => {
      const id = String(item.id).trim();
      const name =
        typeof item.name === 'string' && item.name.trim()
          ? item.name.trim()
          : 'Tipo de habitación';
      const capacityNum = Number(item.capacity);
      const hasCapacity = !Number.isNaN(capacityNum) && capacityNum > 0;
      const label = hasCapacity
        ? `${name} · ${capacityNum} ${capacityNum === 1 ? 'persona' : 'personas'}`
        : name;

      return {
        id,
        value: id,
        label,
        rawName: name,
      };
    });
}

/**
 * Hook para consultar `/room-types` usando load balancer y validador de status code.
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

  const fetchRoomTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await executeBalancedRequest(
        () =>
          api.get<unknown>('/room-types', {
            validateStatus: () => true,
          }),
        { maxRetries: 2 }
      );

      if (!isMountedRef.current) return;

      const validation = validateStatusCode(response.status);
      if (!validation.isValid) {
        setError(
          validation.message ??
            'No pudimos obtener los tipos de habitación en este momento.'
        );
        return;
      }

      setOptions(parseRoomTypesPayload(response.data));
    } catch {
      if (!isMountedRef.current) return;
      setError(
        'No pudimos conectar para cargar los tipos de habitación. Inténtalo de nuevo.'
      );
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOnMount() {
      try {
        const response = await executeBalancedRequest(
          () =>
            api.get<unknown>('/room-types', {
              validateStatus: () => true,
            }),
          { maxRetries: 2 }
        );

        if (!active || !isMountedRef.current) return;

        const validation = validateStatusCode(response.status);
        if (!validation.isValid) {
          setError(
            validation.message ??
              'No pudimos obtener los tipos de habitación en este momento.'
          );
          return;
        }

        setOptions(parseRoomTypesPayload(response.data));
      } catch {
        if (!active || !isMountedRef.current) return;
        setError(
          'No pudimos conectar para cargar los tipos de habitación. Inténtalo de nuevo.'
        );
      } finally {
        if (active && isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    void loadOnMount();
    return () => {
      active = false;
    };
  }, []);

  return {
    options,
    loading,
    error,
    reload: fetchRoomTypes,
  };
}
