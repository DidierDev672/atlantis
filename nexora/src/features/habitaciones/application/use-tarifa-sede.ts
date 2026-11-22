import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import type {
  RawHeadquarterTarifa,
  RawSubHeadquarterTarifa,
} from '../domain/habitacion-tarifa';
import {
  fetchHeadquarterByIdCached,
  fetchSubHeadquartersByHqCached,
} from '../infrastructure/sedes-and-menu-cache';

export interface UseTarifaSedeOptions {
  headquarterId?: string | null;
  isOpen: boolean;
}

/**
 * Consulta la sede y subsede de una tarifa usando caché compartida (TTL 5 min)
 * para evitar re-descargas al alternar entre tarifas de la misma sede.
 */
export function useTarifaSede({ headquarterId, isOpen }: UseTarifaSedeOptions) {
  const [sedeLoading, setSedeLoading] = useState(false);
  const [sedeData, setSedeData] = useState<RawHeadquarterTarifa | null>(null);
  const [sedeError, setSedeError] = useState<string | null>(null);
  const [sedeStatusCode, setSedeStatusCode] = useState<number | null>(null);

  const [subSedeLoading, setSubSedeLoading] = useState(false);
  const [subSedeData, setSubSedeData] =
    useState<RawSubHeadquarterTarifa | null>(null);
  const [subSedeError, setSubSedeError] = useState<string | null>(null);
  const [subSedeStatusCode, setSubSedeStatusCode] = useState<number | null>(
    null
  );

  const cleanHqId = headquarterId ? String(headquarterId).trim() : '';

  const fetchSede = useCallback(async (id: string, forceRefresh = false) => {
    setSedeLoading(true);
    setSedeError(null);
    setSedeStatusCode(null);

    try {
      const item = await fetchHeadquarterByIdCached(id, forceRefresh);
      setSedeStatusCode(200);
      if (item) {
        setSedeData(item);
        setSedeError(null);
      } else {
        setSedeData(null);
        setSedeError(
          'Se presentó un detalle al obtener la sede: no se encontraron registros activos en el sistema (código 200). Tu tarifa sigue completamente disponible.'
        );
      }
    } catch (err: unknown) {
      setSedeData(null);
      if (isAxiosError(err)) {
        const status = err.response?.status ?? 0;
        setSedeStatusCode(status);
        if (status === 404) {
          setSedeError(
            'Se presentó un inconveniente: la sede vinculada no fue encontrada en el sistema (código 404). Despreocúpate, las condiciones de tu tarifa siguen intactas.'
          );
        } else if (status === 500) {
          setSedeError(
            'Se presentó un problema en el servidor al consultar la sede (código 500). No es tu culpa; tus datos continúan a salvo.'
          );
        } else {
          setSedeError(
            `Se presentó una eventualidad al consultar la sede (código ${
              status || 'desconocido'
            }). La tarifa sigue disponible.`
          );
        }
      } else {
        setSedeError(
          'Se presentó una dificultad de conexión al consultar la sede. La información de tu tarifa se mantiene activa.'
        );
      }
    } finally {
      setSedeLoading(false);
    }
  }, []);

  const fetchSubSede = useCallback(async (id: string, forceRefresh = false) => {
    setSubSedeLoading(true);
    setSubSedeError(null);
    setSubSedeStatusCode(null);

    try {
      const list = await fetchSubHeadquartersByHqCached(id, forceRefresh);
      setSubSedeStatusCode(200);
      const item = list[0] ?? null;

      if (item && (item.id || item.name)) {
        setSubSedeData({
          id: item.id,
          headquarter_id: item.headquarter_id || id,
          name: item.name || 'Sub Sede Vinculada',
          address: item.address || 'Dirección no especificada',
          phone: item.phone || 'Teléfono no registrado',
          status: item.status || 'active',
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at,
        });
        setSubSedeError(null);
      } else {
        setSubSedeData(null);
        setSubSedeError(
          'Se verificó la información (código 200): esta sede opera de manera directa sin subsedes secundarias asignadas.'
        );
      }
    } catch (err: unknown) {
      setSubSedeData(null);
      if (isAxiosError(err)) {
        const status = err.response?.status ?? 0;
        setSubSedeStatusCode(status);
        if (status === 404) {
          setSubSedeError(
            'Se presentó un inconveniente: no se localizó la subsede en el sistema (código 404). Tu tarifa continúa vigente.'
          );
        } else if (status === 500) {
          setSubSedeError(
            'Se presentó un problema en el servidor al consultar la subsede (código 500). Esto no interfiere con tu tarifa.'
          );
        } else {
          setSubSedeError(
            `Se presentó una eventualidad al consultar la subsede (código ${
              status || 'desconocido'
            }). La tarifa sigue disponible.`
          );
        }
      } else {
        setSubSedeError(
          'Se presentó una dificultad de conexión al consultar la subsede. La información principal continúa disponible.'
        );
      }
    } finally {
      setSubSedeLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (isOpen && cleanHqId) {
        await Promise.allSettled([
          fetchSede(cleanHqId, false),
          fetchSubSede(cleanHqId, false),
        ]);
      } else {
        setSedeData(null);
        setSedeError(null);
        setSedeStatusCode(null);
        setSedeLoading(false);
        setSubSedeData(null);
        setSubSedeError(null);
        setSubSedeStatusCode(null);
        setSubSedeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, cleanHqId, fetchSede, fetchSubSede]);

  const retrySede = useCallback(() => {
    if (cleanHqId) void fetchSede(cleanHqId, true);
  }, [cleanHqId, fetchSede]);

  const retrySubSede = useCallback(() => {
    if (cleanHqId) void fetchSubSede(cleanHqId, true);
  }, [cleanHqId, fetchSubSede]);

  return {
    sedeLoading,
    sedeData,
    sedeError,
    sedeStatusCode,
    subSedeLoading,
    subSedeData,
    subSedeError,
    subSedeStatusCode,
    retrySede,
    retrySubSede,
  };
}
