import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import {
  type SalidaFilterOption,
  type SalidaHuespedItem,
} from '../domain/salida-huesped'
import { fetchSalidasHuespedes } from '../infrastructure/salidas-api'
import { fetchServiceRequestCountsByPersonIds } from '../infrastructure/service-requests-api'

export interface UseSalidasRecepcionesReturn {
  guests: SalidaHuespedItem[]
  filteredGuests: SalidaHuespedItem[]
  loading: boolean
  loadingServiceRequests: boolean
  validationResult: StatusCodeValidationResult | null
  serviceRequestValidation: StatusCodeValidationResult | null
  searchQuery: string
  setSearchQuery: (value: string) => void
  departureFilter: SalidaFilterOption
  setDepartureFilter: (value: SalidaFilterOption) => void
  counts: {
    total: number
    hoy: number
    manana: number
  }
  reload: () => Promise<void>
}

export function useSalidasRecepciones(): UseSalidasRecepcionesReturn {
  const [guests, setGuests] = useState<SalidaHuespedItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingServiceRequests, setLoadingServiceRequests] =
    useState<boolean>(false)
  const [validationResult, setValidationResult] =
    useState<StatusCodeValidationResult | null>(null)
  const [serviceRequestValidation, setServiceRequestValidation] =
    useState<StatusCodeValidationResult | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [departureFilter, setDepartureFilter] =
    useState<SalidaFilterOption>('todos')
  const requestSeqRef = useRef(0)

  const syncServiceRequestCounts = useCallback(
    async (loadedGuests: SalidaHuespedItem[], requestSeq: number) => {
      const personIds = loadedGuests
        .map((guest) => guest.personId)
        .filter(Boolean)

      if (personIds.length === 0) {
        setLoadingServiceRequests(false)
        return
      }

      setLoadingServiceRequests(true)
      setServiceRequestValidation(null)
      try {
        const srResult = await fetchServiceRequestCountsByPersonIds(personIds)
        if (requestSeqRef.current !== requestSeq) return

        setGuests((prev) =>
          prev.map((guest) => {
            const summary = srResult.summariesByPersonId.get(guest.personId)
            if (!summary) return guest
            return {
              ...guest,
              serviceRequestCount: summary.count,
              serviceRequestsTotal: summary.totalAmount,
              serviceRequestProducts: summary.products,
            }
          })
        )
        setServiceRequestValidation(srResult.validation)
      } finally {
        if (requestSeqRef.current === requestSeq) {
          setLoadingServiceRequests(false)
        }
      }
    },
    []
  )

  const loadAndSyncGuests = useCallback(
    async (seq: number) => {
      let loadedGuests: SalidaHuespedItem[] | undefined
      try {
        const result = await fetchSalidasHuespedes()
        if (requestSeqRef.current !== seq) return
        loadedGuests = result.guests
        setGuests(result.guests)
        setValidationResult(result.validation)
      } finally {
        if (requestSeqRef.current === seq) {
          setLoading(false)
        }
      }

      if (
        requestSeqRef.current === seq &&
        loadedGuests &&
        loadedGuests.length > 0
      ) {
        await syncServiceRequestCounts(loadedGuests, seq)
      }
    },
    [syncServiceRequestCounts]
  )

  const reload = useCallback(async () => {
    const seq = ++requestSeqRef.current
    setLoading(true)
    setLoadingServiceRequests(false)
    setServiceRequestValidation(null)
    await loadAndSyncGuests(seq)
  }, [loadAndSyncGuests])

  useEffect(() => {
    const seq = ++requestSeqRef.current
    void loadAndSyncGuests(seq)

    return () => {
      requestSeqRef.current += 1
    }
  }, [loadAndSyncGuests])

  const filteredGuests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return guests.filter((guest) => {
      if (departureFilter === 'hoy' && guest.departureWindow !== 'hoy') {
        return false
      }
      if (departureFilter === 'manana' && guest.departureWindow !== 'manana') {
        return false
      }

      if (!query) return true

      return (
        guest.name.toLowerCase().includes(query) ||
        guest.documentNumber.toLowerCase().includes(query) ||
        guest.documentTypeLabel.toLowerCase().includes(query) ||
        guest.genderLabel.toLowerCase().includes(query) ||
        guest.dateOfBirthFormatted.toLowerCase().includes(query)
      )
    })
  }, [guests, departureFilter, searchQuery])

  const counts = useMemo(() => {
    let hoy = 0
    let manana = 0
    for (const guest of guests) {
      if (guest.departureWindow === 'hoy') hoy += 1
      if (guest.departureWindow === 'manana') manana += 1
    }
    return {
      total: guests.length,
      hoy,
      manana,
    }
  }, [guests])

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
  }
}
