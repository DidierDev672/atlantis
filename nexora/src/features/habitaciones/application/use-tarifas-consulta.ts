import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import type {
  RawTarifaBackend,
  TarifasErrorState,
} from '../domain/habitacion-tarifa';
import { fetchRatesCatalogCached } from '../infrastructure/habitaciones-catalogs-cache';

export interface UseTarifasConsultaOptions {
  isOpen: boolean;
  initialRateId?: string | null;
}

/**
 * Hook de consulta de tarifas para `TarifasModal` conectado a la caché global de `/rates`
 * para no repetir la descarga completa cada vez que se abre el modal.
 */
export function useTarifasConsulta({
  isOpen,
  initialRateId,
}: UseTarifasConsultaOptions) {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<RawTarifaBackend[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [errorType, setErrorType] = useState<TarifasErrorState | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const fetchRates = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setErrorType(null);
      setStatusCode(null);

      try {
        const cachedItems = await fetchRatesCatalogCached(forceRefresh);
        const list = cachedItems.map(
          (item) => item.raw as unknown as RawTarifaBackend
        );
        setStatusCode(200);

        if (list.length > 0) {
          setRates(list);
          const match = initialRateId
            ? list.find((r) => r.id === initialRateId)
            : null;
          setSelectedRateId(match ? match.id : list[0].id);
          setErrorType(null);
        } else {
          setRates([]);
          setSelectedRateId('');
          setErrorType('empty');
        }
      } catch (err: unknown) {
        setRates([]);
        setSelectedRateId('');

        if (isAxiosError(err)) {
          const status = err.response?.status ?? 0;
          setStatusCode(status);

          if (status === 404 || status === 204) {
            setErrorType('empty');
          } else {
            setErrorType('server_error');
          }
        } else {
          setErrorType('network_error');
        }
      } finally {
        setLoading(false);
      }
    },
    [initialRateId]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!isOpen) {
        setRates([]);
        setSelectedRateId('');
        setErrorType(null);
        setStatusCode(null);
        setLoading(false);
        return;
      }
      await fetchRates(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, fetchRates]);

  const selectedRate = useMemo(() => {
    if (!selectedRateId) return null;
    return rates.find((r) => r.id === selectedRateId) ?? null;
  }, [rates, selectedRateId]);

  const retry = useCallback(() => {
    void fetchRates(true);
  }, [fetchRates]);

  return {
    loading,
    rates,
    selectedRateId,
    setSelectedRateId,
    selectedRate,
    errorType,
    statusCode,
    retry,
  };
}
