import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import {
  fetchBuildingsCatalogCached,
  fetchRatesCatalogCached,
  fetchRoomTypesCatalogCached,
} from '../infrastructure/habitaciones-catalogs-cache'
import type {
  EdificioOption,
  Option,
  TarifaOption,
} from './use-habitacion-detalle-form'

export function useHabitacionRegistroCatalogs() {
  const [roomTypes, setRoomTypes] = useState<Option[]>([])
  const [roomTypesLoading, setRoomTypesLoading] = useState(true)
  const [roomTypesError, setRoomTypesError] = useState<string | null>(null)
  const [edificios, setEdificios] = useState<EdificioOption[]>([])
  const [edificiosLoading, setEdificiosLoading] = useState(true)
  const [edificiosError, setEdificiosError] = useState<string | null>(null)
  const [rates, setRates] = useState<TarifaOption[]>([])
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState<string | null>(null)

  const fetchRoomTypes = useCallback(async (forceRefresh = false) => {
    setRoomTypesLoading(true)
    setRoomTypesError(null)
    try {
      const catalog = await fetchRoomTypesCatalogCached(forceRefresh)
      setRoomTypes(
        catalog.map((item) => ({ value: item.id, label: item.name }))
      )
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined
      setRoomTypesError(
        status === 400
          ? 'No pudimos obtener los tipos de habitación en este momento. Vuelve a intentarlo en unos segundos.'
          : 'No pudimos cargar los tipos de habitación, pero el formulario sigue listo. Revisa tu conexión e inténtalo de nuevo.'
      )
    } finally {
      setRoomTypesLoading(false)
    }
  }, [])

  const fetchEdificios = useCallback(async (forceRefresh = false) => {
    setEdificiosLoading(true)
    setEdificiosError(null)
    try {
      const catalog = await fetchBuildingsCatalogCached(forceRefresh)
      setEdificios(
        catalog.map((item) => ({
          value: item.id,
          label: item.name,
          floorNumber: item.floorNumber,
        }))
      )
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined
      setEdificiosError(
        status === 400
          ? 'No pudimos obtener los edificios en este momento. Vuelve a intentarlo en unos segundos.'
          : 'No pudimos cargar los edificios, pero el formulario sigue listo. Revisa tu conexión e inténtalo de nuevo.'
      )
    } finally {
      setEdificiosLoading(false)
    }
  }, [])

  const fetchRates = useCallback(async (forceRefresh = false) => {
    setRatesLoading(true)
    setRatesError(null)
    try {
      const catalog = await fetchRatesCatalogCached(forceRefresh)
      setRates(
        catalog.map((item) => ({
          value: item.id,
          label: item.name,
          price: item.price,
          modality: item.modality,
        }))
      )
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined
      setRatesError(
        status === 400
          ? 'No pudimos obtener las tarifas ahora mismo. Pulsa en «Reintentar» para sincronizarlas.'
          : 'No pudimos cargar las tarifas en este momento, pero puedes seguir registrando la habitación.'
      )
    } finally {
      setRatesLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadInitialCatalogs() {
      try {
        await Promise.resolve()
        if (cancelled) return
        await Promise.allSettled([
          fetchRoomTypes(false),
          fetchEdificios(false),
          fetchRates(false),
        ])
      } catch (error) {
        console.error('Error cargando catálogos de registro:', error)
      }
    }
    void loadInitialCatalogs()
    return () => {
      cancelled = true
    }
  }, [fetchRoomTypes, fetchEdificios, fetchRates])

  const errorItems = useMemo(
    () =>
      [
        {
          error: roomTypesError,
          loading: roomTypesLoading,
          retry: () => void fetchRoomTypes(true),
        },
        {
          error: edificiosError,
          loading: edificiosLoading,
          retry: () => void fetchEdificios(true),
        },
        {
          error: ratesError,
          loading: ratesLoading,
          retry: () => void fetchRates(true),
        },
      ].filter((item) => Boolean(item.error)),
    [
      edificiosError,
      edificiosLoading,
      fetchEdificios,
      fetchRates,
      fetchRoomTypes,
      ratesError,
      ratesLoading,
      roomTypesError,
      roomTypesLoading,
    ]
  )

  return {
    roomTypes,
    roomTypesLoading,
    edificios,
    edificiosLoading,
    rates,
    ratesLoading,
    ratesError,
    errorItems,
    fetchRoomTypes,
    fetchEdificios,
  }
}
