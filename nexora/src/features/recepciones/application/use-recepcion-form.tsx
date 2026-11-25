import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'
import {
  ESTADO_OPTIONS,
  METODO_PAGO_OPTIONS,
  validateRecepcionInput,
  type CamaInfo,
  type EdificioInfo,
  type HabitacionInfo,
  type HuespedInfo,
  type Recepcion,
  type RecepcionInput,
  type RecepcionValidationErrors,
  type ReservaInfo,
  type SedeInfo,
} from '../domain/recepcion'
import {
  applyRecepcionFieldUpdate,
  buildRecepcionPayload,
  createInitialRecepcionFormValues,
  getCreatedByFromLocalStorage,
  mapCamaOptions,
  mapEdificioOptions,
  mapHabitacionOptions,
  mapHuespedOptions,
  mapReservaDropdownOptions,
  mapSedeOptions,
  mergeCatalogItemsById,
  mergeRoomsPreservingLocation,
  type RecepcionFormCatalogs,
} from '../domain/recepcion-form-helpers'
import { RecepcionApiError } from '../domain/recepcion-error'
import { ApiRecepcionRepository } from '../infrastructure/api-recepcion-repository'
import { readReceptionistHeadquarterIdFromStorage } from '../infrastructure/receptionist-location-api'
import { useReceptionistLocation } from './use-receptionist-location'

export { getCreatedByFromLocalStorage }

const defaultRepository = new ApiRecepcionRepository()

export function useRecepcionForm(
  repository = defaultRepository,
  onSuccessCallback?: (recepcion: Recepcion) => void,
) {
  const [formValues, setFormValues] = useState<RecepcionInput>(
    createInitialRecepcionFormValues
  )
  const [errors, setErrors] = useState<RecepcionValidationErrors>({})
  const [loadingDependencies, setLoadingDependencies] = useState(true)
  const [dependencyError, setDependencyError] = useState<string | null>(null)

  const [sedes, setSedes] = useState<SedeInfo[]>([])
  const [edificios, setEdificios] = useState<EdificioInfo[]>([])
  const [habitaciones, setHabitaciones] = useState<HabitacionInfo[]>([])
  const [camas, setCamas] = useState<CamaInfo[]>([])
  const [reservas, setReservas] = useState<ReservaInfo[]>([])
  const [huespedes, setHuespedes] = useState<HuespedInfo[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successRecepcion, setSuccessRecepcion] = useState<Recepcion | null>(null)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)

  const submittingRef = useRef(false)
  const formValuesRef = useRef(formValues)
  const hasLoadedGlobalCatalogsRef = useRef(false)
  const pendingRefreshAfterResetRef = useRef(false)
  const catalogsRef = useRef<RecepcionFormCatalogs>({
    camas: [],
    habitaciones: [],
    edificios: [],
    reservas: [],
  })

  useEffect(() => {
    formValuesRef.current = formValues
  }, [formValues])

  useEffect(() => {
    catalogsRef.current = { camas, habitaciones, edificios, reservas }
  }, [camas, habitaciones, edificios, reservas])

  const findCatalogBuildingId = useCallback(
    (hqId: string) =>
      catalogsRef.current.edificios.find((e) => e.headquarters_id === hqId)?.id,
    []
  )

  const onMergeResolvedCatalogs = useCallback(
    (patch: {
      headquarter: SedeInfo
      edificios?: EdificioInfo[]
      rooms?: HabitacionInfo[]
    }) => {
      setSedes((prev) =>
        prev.some((s) => s.id === patch.headquarter.id)
          ? prev
          : [patch.headquarter, ...prev]
      )
      if (patch.edificios?.length) {
        setEdificios((prev) => mergeCatalogItemsById(prev, patch.edificios!))
      }
      if (patch.rooms?.length) {
        setHabitaciones((prev) =>
          mergeRoomsPreservingLocation(prev, [], patch.rooms)
        )
      }
    },
    []
  )

  const onSyncLocationSelection = useCallback(
    (sedeId: string, buildingId: string, overwrite = false) => {
      setFormValues((prev) => ({
        ...prev,
        sedeId: overwrite ? sedeId : prev.sedeId || sedeId,
        edificioId: overwrite
          ? buildingId || prev.edificioId
          : prev.edificioId || buildingId,
      }))
    },
    []
  )

  const loadGlobalLocationCatalogs = useCallback(async () => {
    if (hasLoadedGlobalCatalogsRef.current) return
    hasLoadedGlobalCatalogsRef.current = true
    try {
      const [sedesData, roomsData] = await Promise.all([
        repository.getSedes(),
        repository.getHabitaciones(),
      ])
      setSedes((prev) => mergeCatalogItemsById(sedesData, prev))
      setHabitaciones((prev) => mergeRoomsPreservingLocation(roomsData, prev))
    } catch (err) {
      hasLoadedGlobalCatalogsRef.current = false
      console.warn('Error al cargar catálogos globales bajo demanda:', err)
    }
  }, [repository])

  const {
    loadingLocation,
    isLocationLocked,
    detectedHeadquarter,
    detectedSubHeadquarter,
    detectedBuildingId,
    locationValidationError,
    detectReceptionistLocation,
    syncMatchedBuildingFromCatalog,
    toggleManualLocation,
  } = useReceptionistLocation({
    findCatalogBuildingId,
    onMergeResolvedCatalogs,
    onSyncLocationSelection,
    onUnlockManualLocation: loadGlobalLocationCatalogs,
  })

  const loadDependencies = useCallback(
    async (options?: { includeGlobalCatalogs?: boolean }) => {
      setLoadingDependencies(true)
      setDependencyError(null)
      try {
        const activeHqId = readReceptionistHeadquarterIdFromStorage()
        const shouldLoadGlobal = options?.includeGlobalCatalogs ?? !activeHqId
        const [edificiosData, camasData, reservasData, huespedesData] =
          await Promise.all([
            repository.getEdificios(
              shouldLoadGlobal ? undefined : (activeHqId ?? undefined)
            ),
            repository.getCamas(),
            repository.getReservas(),
            repository.getHuespedes(),
            ...(shouldLoadGlobal ? [loadGlobalLocationCatalogs()] : []),
          ])
        setEdificios((prev) => mergeCatalogItemsById(edificiosData, prev))
        setCamas(camasData)
        setReservas(reservasData)
        setHuespedes(huespedesData)
        syncMatchedBuildingFromCatalog(edificiosData)
      } catch {
        setDependencyError(
          'Tuvimos un inconveniente al cargar las opciones de ubicación y huéspedes. Tus datos no se han perdido; puedes reintentar cuando gustes.'
        )
      } finally {
        setLoadingDependencies(false)
      }
    },
    [loadGlobalLocationCatalogs, repository, syncMatchedBuildingFromCatalog]
  )

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) {
        void Promise.all([loadDependencies(), detectReceptionistLocation()])
      }
    })
    return () => {
      cancelled = true
    }
  }, [detectReceptionistLocation, loadDependencies])

  const sedeOptions = useMemo(() => mapSedeOptions(sedes), [sedes])
  const edificioOptions = useMemo(() => mapEdificioOptions(edificios, formValues.sedeId), [edificios, formValues.sedeId])
  const habitacionOptions = useMemo(() => mapHabitacionOptions(habitaciones, formValues.edificioId), [habitaciones, formValues.edificioId])
  const camaOptions = useMemo(() => mapCamaOptions(camas, formValues.habitacionId), [camas, formValues.habitacionId])
  const reservaDropdownOptions = useMemo<DropdownOption[]>(() => mapReservaDropdownOptions(reservas), [reservas])
  const huespedDropdownOptions = useMemo(() => mapHuespedOptions(huespedes), [huespedes])

  const handleFieldChange = useCallback(
    (field: keyof RecepcionInput, value: string | number | string[]) => {
      try {
        const catalogs = catalogsRef.current
        if (field === 'reservaId') {
          const found = catalogs.reservas.find((r) => r.id === value)
          setSyncNotice(
            found
              ? `Reserva vinculada: ${found.guestName}. Ubicación y datos sincronizados automáticamente.`
              : null
          )
        }

        setFormValues((prev) =>
          applyRecepcionFieldUpdate(prev, field, value, catalogs)
        )

        setErrors((prev) => {
          const key = field as keyof RecepcionValidationErrors
          const needsClearField = Boolean(prev[key])
          const needsClearGuest = field === 'huespedIds' && Boolean(prev.huespedId)
          if (!needsClearField && !needsClearGuest) return prev
          return {
            ...prev,
            ...(needsClearField ? { [key]: undefined } : {}),
            ...(needsClearGuest ? { huespedId: undefined } : {}),
          }
        })
      } catch (err) {
        console.error('Error al actualizar campo de recepción:', err)
      }
    },
    []
  )

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (submittingRef.current) return

      const currentValues = formValuesRef.current
      setSubmitError(null)
      const validation = validateRecepcionInput(currentValues)
      if (Object.keys(validation).length > 0) {
        setErrors(validation)
        return
      }

      submittingRef.current = true
      setSubmitting(true)

      try {
        const payload = buildRecepcionPayload(currentValues)
        const created = await repository.createRecepcion(payload)
        setSuccessRecepcion(created)
        pendingRefreshAfterResetRef.current = true
        if (onSuccessCallback) {
          onSuccessCallback(created)
        }
      } catch (err: unknown) {
        if (err instanceof RecepcionApiError) {
          setSubmitError(err.serverMessage || err.message)
        } else {
          setSubmitError(
            'No logramos completar el registro en este instante. La información ingresada sigue intacta; por favor verifica los datos e inténtalo nuevamente.'
          )
        }
      } finally {
        submittingRef.current = false
        setSubmitting(false)
      }
    },
    [onSuccessCallback, repository]
  )

  const handleReset = useCallback(() => {
    try {
      const fresh = createInitialRecepcionFormValues()
      const nextValues = {
        ...fresh,
        sedeId: detectedHeadquarter?.id || '',
        edificioId: detectedBuildingId || '',
      }
      formValuesRef.current = nextValues
      setFormValues(nextValues)
      setErrors({})
      setSubmitError(null)
      setSuccessRecepcion(null)
      setSyncNotice(null)
      if (pendingRefreshAfterResetRef.current) {
        pendingRefreshAfterResetRef.current = false
        void loadDependencies({
          includeGlobalCatalogs: hasLoadedGlobalCatalogsRef.current,
        })
      }
    } catch (err) {
      console.error('Error al reiniciar formulario de recepción:', err)
    }
  }, [detectedBuildingId, detectedHeadquarter, loadDependencies])

  return {
    formValues,
    errors,
    loadingDependencies,
    loadingLocation,
    dependencyError,
    locationValidationError,
    detectedHeadquarter,
    detectedSubHeadquarter,
    isLocationLocked,
    sedeOptions,
    edificioOptions,
    habitacionOptions,
    habitacionDropdownOptions: habitacionOptions,
    camaOptions,
    reservaDropdownOptions,
    huespedDropdownOptions,
    metodoPagoOptions: METODO_PAGO_OPTIONS,
    estadoOptions: ESTADO_OPTIONS,
    submitting,
    submitError,
    successRecepcion,
    syncNotice,
    handleFieldChange,
    handleSubmit,
    handleReset,
    loadDependencies,
    toggleManualLocation,
  }
}
