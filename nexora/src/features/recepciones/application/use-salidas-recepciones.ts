import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator';
import { useRecepcionesResourceBudget } from './use-recepciones-resource-budget';
import {
  type SalidaFilterOption,
  type SalidaHuespedItem,
} from '../domain/salida-huesped';
import type { StayItem } from '../domain/stay';
import { fetchSalidasHuespedes } from '../infrastructure/salidas-api';
import {
  clearServiceRequestsCache,
  fetchServiceRequestCountsByPersonIds,
} from '../infrastructure/service-requests-api';

export interface UseSalidasRecepcionesOptions {
  initialStays?: StayItem[];
}

export interface UseSalidasRecepcionesReturn {
  guests: SalidaHuespedItem[];
  filteredGuests: SalidaHuespedItem[];
  loading: boolean;
  loadingServiceRequests: boolean;
  validationResult: StatusCodeValidationResult | null;
  serviceRequestValidation: StatusCodeValidationResult | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  departureFilter: SalidaFilterOption;
  setDepartureFilter: (value: SalidaFilterOption) => void;
  counts: {
    total: number;
    hoy: number;
    manana: number;
  };
  reload: () => Promise<void>;
  ensureServiceRequestsForPersonIds: (
    personIds: ReadonlyArray<string>
  ) => Promise<void>;
}

export function useSalidasRecepciones(
  options: UseSalidasRecepcionesOptions = {}
): UseSalidasRecepcionesReturn {
  const {
    policy: { initialServicePrefetchLimit },
  } = useRecepcionesResourceBudget()
  const [guests, setGuests] = useState<SalidaHuespedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingServiceRequests, setLoadingServiceRequests] =
    useState<boolean>(false);
  const [validationResult, setValidationResult] =
    useState<StatusCodeValidationResult | null>(null);
  const [serviceRequestValidation, setServiceRequestValidation] =
    useState<StatusCodeValidationResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departureFilter, setDepartureFilter] =
    useState<SalidaFilterOption>('todos');
  const requestSeqRef = useRef(0);
  const syncedPersonIdsRef = useRef<Set<string>>(new Set());
  const prefetchedStaysRef = useRef<StayItem[] | undefined>(
    options.initialStays
  );

  useEffect(() => {
    prefetchedStaysRef.current = options.initialStays;
  }, [options.initialStays]);

  const syncServiceRequestCounts = useCallback(
    async (
      targetPersonIds: ReadonlyArray<string>,
      requestSeq: number,
      forceRefresh = false
    ) => {
      const pendingIds = Array.from(
        new Set(targetPersonIds.map((id) => id.trim()).filter(Boolean))
      ).filter((id) => forceRefresh || !syncedPersonIdsRef.current.has(id));

      if (pendingIds.length === 0) return;

      for (const id of pendingIds) {
        syncedPersonIdsRef.current.add(id);
      }

      setLoadingServiceRequests(true);
      setServiceRequestValidation(null);
      try {
        const srResult = await fetchServiceRequestCountsByPersonIds(
          pendingIds,
          { forceRefresh }
        );
        if (requestSeqRef.current !== requestSeq) return;

        setGuests((prev) =>
          prev.map((guest) => {
            const summary = srResult.summariesByPersonId.get(guest.personId);
            if (!summary) return guest;
            return {
              ...guest,
              serviceRequestCount: summary.count,
              serviceRequestsTotal: summary.totalAmount,
              serviceRequestProducts: summary.products,
            };
          })
        );
        if (srResult.validation) {
          setServiceRequestValidation(srResult.validation);
        }
      } catch {
        for (const id of pendingIds) {
          syncedPersonIdsRef.current.delete(id);
        }
      } finally {
        if (requestSeqRef.current === requestSeq) {
          setLoadingServiceRequests(false);
        }
      }
    },
    []
  );

  const ensureServiceRequestsForPersonIds = useCallback(
    async (personIds: ReadonlyArray<string>) => {
      const seq = requestSeqRef.current;
      await syncServiceRequestCounts(personIds, seq, false);
    },
    [syncServiceRequestCounts]
  );

  const loadAndSyncGuests = useCallback(
    async (seq: number, forceRefresh = false) => {
      let loadedGuests: SalidaHuespedItem[] | undefined;
      try {
        const result = await fetchSalidasHuespedes({
          prefetchedStays: prefetchedStaysRef.current,
          forceRefresh,
        });
        if (requestSeqRef.current !== seq) return;
        loadedGuests = result.guests;
        setGuests(result.guests);
        setValidationResult(result.validation);
      } finally {
        if (requestSeqRef.current === seq) {
          setLoading(false);
        }
      }

      if (
        requestSeqRef.current === seq &&
        loadedGuests &&
        loadedGuests.length > 0 &&
        initialServicePrefetchLimit > 0
      ) {
        const initialBatchIds = loadedGuests
          .slice(0, initialServicePrefetchLimit)
          .map((g) => g.personId)
          .filter(Boolean);
        await syncServiceRequestCounts(initialBatchIds, seq, forceRefresh);
      }
    },
    [initialServicePrefetchLimit, syncServiceRequestCounts]
  );

  const reload = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    syncedPersonIdsRef.current.clear();
    clearServiceRequestsCache();
    setLoading(true);
    setLoadingServiceRequests(false);
    setServiceRequestValidation(null);
    await loadAndSyncGuests(seq, true);
  }, [loadAndSyncGuests]);

  useEffect(() => {
    const seq = ++requestSeqRef.current;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        void loadAndSyncGuests(seq, false);
      }
    });

    return () => {
      cancelled = true;
      requestSeqRef.current += 1;
    };
  }, [loadAndSyncGuests]);

  const filteredGuests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return guests.filter((guest) => {
      if (departureFilter === 'hoy' && guest.departureWindow !== 'hoy') {
        return false;
      }
      if (departureFilter === 'manana' && guest.departureWindow !== 'manana') {
        return false;
      }

      if (!query) return true;

      return (
        guest.name.toLowerCase().includes(query) ||
        guest.documentNumber.toLowerCase().includes(query) ||
        guest.documentTypeLabel.toLowerCase().includes(query) ||
        guest.genderLabel.toLowerCase().includes(query) ||
        guest.dateOfBirthFormatted.toLowerCase().includes(query)
      );
    });
  }, [guests, departureFilter, searchQuery]);

  // Cargar bajo demanda los primeros huéspedes filtrados si la política de hardware/red permite prefetch
  useEffect(() => {
    if (filteredGuests.length === 0 || initialServicePrefetchLimit <= 0) return;
    const visibleSliceIds = filteredGuests
      .slice(0, initialServicePrefetchLimit)
      .map((g) => g.personId)
      .filter(Boolean);
    if (visibleSliceIds.length === 0) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        void ensureServiceRequestsForPersonIds(visibleSliceIds);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ensureServiceRequestsForPersonIds, filteredGuests, initialServicePrefetchLimit]);

  const counts = useMemo(() => {
    let hoy = 0;
    let manana = 0;
    for (const guest of guests) {
      if (guest.departureWindow === 'hoy') hoy += 1;
      else if (guest.departureWindow === 'manana') manana += 1;
    }
    return {
      total: guests.length,
      hoy,
      manana,
    };
  }, [guests]);

  return {
    guests,
    filteredGuests,
    loading,
    loadingServiceRequests,
    validationResult,
    serviceRequestValidation,
    searchQuery,
    setSearchQuery,
    departureFilter,
    setDepartureFilter,
    counts,
    reload,
    ensureServiceRequestsForPersonIds,
  };
}
