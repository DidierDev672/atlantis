import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'
import {
  fetchEdificiosApi,
  fetchSedePorIdApi,
  fetchSedesApi,
  fetchSubSedesApi,
  readAuthUserLocationIds,
  type EdificioOption,
  type SedeOption,
  type SubSedeOption,
} from '../infrastructure/api-formulario-servicio-repository'

interface DetectedLocationSnapshot {
  sedeId: string
  subSedeId: string
  edificioId: string
  sedes: SedeOption[]
  subSedes: SubSedeOption[]
  edificios: EdificioOption[]
}

export interface UseUbicacionRecepcionistaParams {
  onValidationFeedback?: (validation: StatusCodeValidationResult) => void
}

/**
 * Hook de aplicación: Detecta automáticamente la sede, sub-sede y edificio del recepcionista
 * leyendo `headquarters_id` de `localStorage.getItem('auth_user')` y permite alternar a selección
 * manual con recarga balanceada de catálogos por sede.
 */
export function useUbicacionRecepcionista(
  params?: UseUbicacionRecepcionistaParams,
) {
  const onValidationFeedback = params?.onValidationFeedback

  const [sedeId, setSedeId] = useState('')
  const [sedes, setSedes] = useState<SedeOption[]>([])
  const [loadingSedes, setLoadingSedes] = useState(true)

  const [subSedeId, setSubSedeId] = useState('')
  const [subSedes, setSubSedes] = useState<SubSedeOption[]>([])
  const [loadingSubSedes, setLoadingSubSedes] = useState(true)

  const [edificioId, setEdificioId] = useState('')
  const [edificios, setEdificios] = useState<EdificioOption[]>([])
  const [loadingEdificios, setLoadingEdificios] = useState(true)

  const [locationFieldsDisabled, setLocationFieldsDisabled] = useState(true)
  const detectedLocationRef = useRef<DetectedLocationSnapshot>({
    sedeId: '',
    subSedeId: '',
    edificioId: '',
    sedes: [],
    subSedes: [],
    edificios: [],
  })
  const isMountedRef = useRef(true)

  const loadUbicacionesPorSede = useCallback(
    async (headquarterId: string) => {
      if (!headquarterId) {
        setSubSedes([])
        setSubSedeId('')
        setEdificios([])
        setEdificioId('')
        return
      }
      setLoadingSubSedes(true)
      setLoadingEdificios(true)
      try {
        const [subSedesRes, edificiosRes] = await Promise.allSettled([
          fetchSubSedesApi(headquarterId),
          fetchEdificiosApi(headquarterId),
        ])
        if (!isMountedRef.current) return

        if (subSedesRes.status === 'fulfilled') {
          setSubSedes(subSedesRes.value.subSedes)
          if (!subSedesRes.value.validation.isValid) {
            onValidationFeedback?.(subSedesRes.value.validation)
          }
        } else {
          setSubSedes([])
        }

        if (edificiosRes.status === 'fulfilled') {
          setEdificios(edificiosRes.value.edificios)
          if (!edificiosRes.value.validation.isValid) {
            onValidationFeedback?.(edificiosRes.value.validation)
          }
        } else {
          setEdificios([])
        }
      } catch (error) {
        console.error('Error al cargar sub-sedes y edificios de sede:', error)
        if (isMountedRef.current) {
          setSubSedes([])
          setEdificios([])
          onValidationFeedback?.(validateStatusCode(500))
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingSubSedes(false)
          setLoadingEdificios(false)
        }
      }
    },
    [onValidationFeedback],
  )

  useEffect(() => {
    isMountedRef.current = true

    const detectarUbicacionRecepcionista = async () => {
      try {
        const { headquartersId, subHeadquartersId, buildingId } =
          readAuthUserLocationIds()

        if (!headquartersId) {
          const [sedesRes, edificiosRes] = await Promise.allSettled([
            fetchSedesApi(),
            fetchEdificiosApi(),
          ])
          if (!isMountedRef.current) return

          const sedesList =
            sedesRes.status === 'fulfilled' ? sedesRes.value.sedes : []
          const edificiosList =
            edificiosRes.status === 'fulfilled' ? edificiosRes.value.edificios : []

          const defaultHqId = sedesList[0]?.id ?? ''
          const defaultBldId = edificiosList[0]?.id ?? ''
          setSedes(sedesList)
          setEdificios(edificiosList)
          setSubSedes([])
          setSedeId(defaultHqId)
          setEdificioId(defaultBldId)
          detectedLocationRef.current = {
            sedeId: defaultHqId,
            subSedeId: '',
            edificioId: defaultBldId,
            sedes: sedesList,
            subSedes: [],
            edificios: edificiosList,
          }
          return
        }

        const sedeRes = await fetchSedePorIdApi(headquartersId)
        if (!isMountedRef.current) return

        if (!sedeRes.validation.isValid) {
          onValidationFeedback?.(sedeRes.validation)
        }

        const resolvedHqId = sedeRes.sede?.id || headquartersId
        const sedesDetected = sedeRes.sede ? [sedeRes.sede] : []
        const resolvedSedeId = sedeRes.sede ? resolvedHqId : ''
        setSedes(sedesDetected)
        setSedeId(resolvedSedeId)

        const [subSedesRes, edificiosRes] = await Promise.allSettled([
          fetchSubSedesApi(resolvedHqId),
          fetchEdificiosApi(resolvedHqId),
        ])
        if (!isMountedRef.current) return

        const subSedesList =
          subSedesRes.status === 'fulfilled' ? subSedesRes.value.subSedes : []
        const edificiosList =
          edificiosRes.status === 'fulfilled' ? edificiosRes.value.edificios : []

        if (
          subSedesRes.status === 'fulfilled' &&
          !subSedesRes.value.validation.isValid
        ) {
          onValidationFeedback?.(subSedesRes.value.validation)
        } else if (
          edificiosRes.status === 'fulfilled' &&
          !edificiosRes.value.validation.isValid
        ) {
          onValidationFeedback?.(edificiosRes.value.validation)
        }

        const matchedSubSede =
          (subHeadquartersId
            ? subSedesList.find((item) => item.id === subHeadquartersId)
            : undefined) ?? subSedesList[0]
        const resolvedSubSedeId = matchedSubSede?.id ?? ''

        const matchedEdificio =
          (buildingId
            ? edificiosList.find((item) => item.id === buildingId)
            : undefined) ??
          (resolvedSubSedeId
            ? edificiosList.find(
                (item) => item.sub_headquarters_id === resolvedSubSedeId,
              )
            : undefined) ??
          edificiosList[0]
        const resolvedEdificioId = matchedEdificio?.id ?? ''

        setSubSedes(subSedesList)
        setSubSedeId(resolvedSubSedeId)
        setEdificios(edificiosList)
        setEdificioId(resolvedEdificioId)

        detectedLocationRef.current = {
          sedeId: resolvedSedeId,
          subSedeId: resolvedSubSedeId,
          edificioId: resolvedEdificioId,
          sedes: sedesDetected,
          subSedes: subSedesList,
          edificios: edificiosList,
        }
      } catch (error) {
        console.error('Error al detectar sede, sub-sede y edificio:', error)
        if (isMountedRef.current) {
          onValidationFeedback?.(validateStatusCode(500))
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingSedes(false)
          setLoadingSubSedes(false)
          setLoadingEdificios(false)
        }
      }
    }

    void Promise.resolve().then(() => detectarUbicacionRecepcionista())

    return () => {
      isMountedRef.current = false
    }
  }, [onValidationFeedback])

  const restoreDetectedLocation = useCallback(() => {
    try {
      const snapshot = detectedLocationRef.current
      if (snapshot.sedes.length > 0) setSedes(snapshot.sedes)
      setSubSedes(snapshot.subSedes)
      setEdificios(snapshot.edificios)
      setSedeId(snapshot.sedeId)
      setSubSedeId(snapshot.subSedeId)
      setEdificioId(snapshot.edificioId)
    } catch (error) {
      console.error('Error al restaurar ubicación detectada:', error)
    }
  }, [])

  const toggleManualLocation = useCallback(async () => {
    try {
      if (!locationFieldsDisabled) {
        restoreDetectedLocation()
        setLocationFieldsDisabled(true)
        return
      }

      setLocationFieldsDisabled(false)
      setLoadingSedes(true)
      try {
        const res = await fetchSedesApi()
        if (!isMountedRef.current) return

        const detectedSede = detectedLocationRef.current.sedes[0]
        const merged =
          detectedSede && !res.sedes.some((s) => s.id === detectedSede.id)
            ? [detectedSede, ...res.sedes]
            : res.sedes
        setSedes(merged)
        if (!res.validation.isValid) {
          onValidationFeedback?.(res.validation)
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingSedes(false)
        }
      }
    } catch (error) {
      console.error('Error al cambiar modo de ubicación:', error)
      if (isMountedRef.current) {
        onValidationFeedback?.(validateStatusCode(500))
      }
    }
  }, [locationFieldsDisabled, onValidationFeedback, restoreDetectedLocation])

  const sedeOptions: DropdownOption[] = useMemo(
    () => sedes.map((s) => ({ value: s.id, label: s.name })),
    [sedes],
  )

  const subSedeOptions: DropdownOption[] = useMemo(
    () => subSedes.map((sub) => ({ value: sub.id, label: sub.name })),
    [subSedes],
  )

  const edificioOptions: DropdownOption[] = useMemo(
    () => edificios.map((ed) => ({ value: ed.id, label: ed.name })),
    [edificios],
  )

  return {
    sedeId,
    setSedeId,
    sedeOptions,
    loadingSedes,
    subSedeId,
    setSubSedeId,
    subSedeOptions,
    loadingSubSedes,
    loadUbicacionesPorSede,
    edificioId,
    setEdificioId,
    edificioOptions,
    loadingEdificios,
    locationFieldsDisabled,
    toggleManualLocation,
    restoreDetectedLocation,
  }
}
