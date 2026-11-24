import { useCallback, useState } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import type {
  EdificioInfo,
  HabitacionInfo,
  SedeInfo,
  SubSedeInfo,
} from '../domain/recepcion'
import {
  readReceptionistHeadquarterIdFromStorage,
  resolveReceptionistLocation,
} from '../infrastructure/receptionist-location-api'

interface ResolvedCatalogPatch {
  headquarter: SedeInfo
  edificios?: EdificioInfo[]
  rooms?: HabitacionInfo[]
}

interface UseReceptionistLocationParams {
  findCatalogBuildingId: (hqId: string) => string | undefined
  onMergeResolvedCatalogs: (patch: ResolvedCatalogPatch) => void
  onSyncLocationSelection: (
    sedeId: string,
    buildingId: string,
    overwrite?: boolean
  ) => void
  onUnlockManualLocation?: () => void
}

/**
 * Hook dedicado a la detección automática, bloqueo seguro y edición manual
 * de la sede hotelera y edificio del recepcionista a partir de `auth_user`.
 */
export function useReceptionistLocation({
  findCatalogBuildingId,
  onMergeResolvedCatalogs,
  onSyncLocationSelection,
  onUnlockManualLocation,
}: UseReceptionistLocationParams) {
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [isLocationLocked, setIsLocationLocked] = useState<boolean>(() =>
    Boolean(readReceptionistHeadquarterIdFromStorage())
  )
  const [detectedHeadquarter, setDetectedHeadquarter] =
    useState<SedeInfo | null>(null)
  const [detectedSubHeadquarter, setDetectedSubHeadquarter] =
    useState<SubSedeInfo | null>(null)
  const [detectedBuildingId, setDetectedBuildingId] = useState<string>('')
  const [locationValidationError, setLocationValidationError] =
    useState<StatusCodeValidationResult | null>(null)

  const detectReceptionistLocation = useCallback(
    async (forceRefresh = false) => {
      const hqId = readReceptionistHeadquarterIdFromStorage()
      if (!hqId) {
        setIsLocationLocked(false)
        return
      }

      setLoadingLocation(true)
      setLocationValidationError(null)
      try {
        const resolved = await resolveReceptionistLocation({ forceRefresh })
        setLocationValidationError(resolved.validationError)

        if (resolved.headquarter) {
          const hq = resolved.headquarter
          const sub = resolved.subHeadquarters[0] ?? null
          setDetectedHeadquarter(hq)
          setDetectedSubHeadquarter(sub)

          const suggestedBld = resolved.suggestedBuildingId || ''
          onMergeResolvedCatalogs({
            headquarter: hq,
            rooms: resolved.rooms,
            edificios: suggestedBld
              ? [
                  {
                    id: suggestedBld,
                    name: sub?.name
                      ? `Torre · ${sub.name}`
                      : 'Edificio asignado',
                    headquarters_id: hq.id,
                    sub_headquarters_id: sub?.id ?? null,
                    status: 'active',
                  },
                ]
              : undefined,
          })

          const matchingBld = findCatalogBuildingId(hq.id) || suggestedBld
          if (matchingBld) setDetectedBuildingId(matchingBld)
          onSyncLocationSelection(hq.id, matchingBld || '')
        }
      } catch (err) {
        console.error('Error al detectar ubicación del recepcionista:', err)
      } finally {
        setLoadingLocation(false)
      }
    },
    [
      findCatalogBuildingId,
      onMergeResolvedCatalogs,
      onSyncLocationSelection,
    ]
  )

  const syncMatchedBuildingFromCatalog = useCallback(
    (edificiosData: EdificioInfo[]) => {
      const activeHqId = readReceptionistHeadquarterIdFromStorage()
      const matchedBld = activeHqId
        ? edificiosData.find((e) => e.headquarters_id === activeHqId)?.id
        : undefined
      if (activeHqId && matchedBld) {
        setDetectedBuildingId((prev) => prev || matchedBld)
        onSyncLocationSelection(activeHqId, matchedBld)
      }
    },
    [onSyncLocationSelection]
  )

  const toggleManualLocation = useCallback(() => {
    try {
      const nextLocked = !isLocationLocked
      setIsLocationLocked(nextLocked)
      if (nextLocked && detectedHeadquarter) {
        onSyncLocationSelection(
          detectedHeadquarter.id,
          detectedBuildingId,
          true
        )
      } else if (!nextLocked) {
        onUnlockManualLocation?.()
      }
    } catch (err) {
      console.error('Error al alternar edición manual de ubicación:', err)
    }
  }, [
    detectedBuildingId,
    detectedHeadquarter,
    isLocationLocked,
    onSyncLocationSelection,
    onUnlockManualLocation,
  ])

  return {
    loadingLocation,
    isLocationLocked,
    detectedHeadquarter,
    detectedSubHeadquarter,
    detectedBuildingId,
    locationValidationError,
    detectReceptionistLocation,
    syncMatchedBuildingFromCatalog,
    toggleManualLocation,
  }
}
