import { useCallback, useEffect, useRef, useState } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import { RegistrarEdificio } from '../application/registrar-edificio'
import type { EdificioInput } from '../domain/edificio'
import { EdificioApiError } from '../domain/edificio-error'
import { ApiEdificioRepository } from '../infrastructure/api-edificio-repository'
import {
  fetchAllHeadquarters,
  fetchHeadquarterById,
  fetchSubHeadquartersByHeadquarter,
  readAuthUserUbicacionIds,
  type EdificioSedeInfo,
  type EdificioSubSedeInfo,
} from '../infrastructure/api-ubicacion-edificio-repository'
import { edificioErrorCopy } from '../ui/lib/error-copy'
import type { Option } from '../ui/molecules/edificio-form'

const edificioRepository = new ApiEdificioRepository()

interface DetectedUbicacionSnapshot {
  sedeId: string
  subSedeId: string
  sedes: Option[]
  subSedes: Option[]
  headquarter: EdificioSedeInfo | null
  subHeadquarter: EdificioSubSedeInfo | null
}

function mapSedeOptions(items: ReadonlyArray<EdificioSedeInfo>): Option[] {
  return items.map((item) => ({ value: item.id, label: item.name }))
}

function mapSubSedeOptions(
  items: ReadonlyArray<EdificioSubSedeInfo>
): Option[] {
  return items.map((item) => ({ value: item.id, label: item.name }))
}

function firstFailedValidation(
  ...validations: ReadonlyArray<StatusCodeValidationResult | null>
): StatusCodeValidationResult | null {
  return validations.find((item) => Boolean(item && !item.isValid)) ?? null
}

export interface UseEdificioRegistroOptions {
  open: boolean
  onSuccess?: () => void
}

/**
 * Hook de aplicación reutilizable para registrar edificios y pisos (`POST /building`),
 * detectando automáticamente Sede y Sub sede desde `auth_user` con balanceo y validación HTTP.
 */
export function useEdificioRegistro({
  open,
  onSuccess,
}: UseEdificioRegistroOptions) {
  const [sedes, setSedes] = useState<Option[]>([])
  const [sedesLoading, setSedesLoading] = useState(false)
  const [subSedes, setSubSedes] = useState<Option[]>([])
  const [subSedesLoading, setSubSedesLoading] = useState(false)

  const [autoSedeId, setAutoSedeId] = useState('')
  const [autoSubSedeId, setAutoSubSedeId] = useState('')
  const [locationVersion, setLocationVersion] = useState(0)
  const [isUbicacionBloqueada, setIsUbicacionBloqueada] = useState(true)
  const [detectedHeadquarter, setDetectedHeadquarter] =
    useState<EdificioSedeInfo | null>(null)
  const [detectedSubHeadquarter, setDetectedSubHeadquarter] =
    useState<EdificioSubSedeInfo | null>(null)
  const [locationValidation, setLocationValidation] =
    useState<StatusCodeValidationResult | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    nombre: string
    numPisos: string
  } | null>(null)

  const submittingRef = useRef(false)
  const isMountedRef = useRef(true)
  const detectedSnapshotRef = useRef<DetectedUbicacionSnapshot>({
    sedeId: '',
    subSedeId: '',
    sedes: [],
    subSedes: [],
    headquarter: null,
    subHeadquarter: null,
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchSedes = useCallback(async () => {
    setSedesLoading(true)
    setSubSedesLoading(true)
    setLocationValidation(null)

    try {
      const { headquartersId, subHeadquartersId } = readAuthUserUbicacionIds()

      if (!headquartersId) {
        const allRes = await fetchAllHeadquarters()
        if (!isMountedRef.current) return
        const options = mapSedeOptions(allRes.headquarters)
        detectedSnapshotRef.current = {
          sedeId: '',
          subSedeId: '',
          sedes: options,
          subSedes: [],
          headquarter: null,
          subHeadquarter: null,
        }
        setSedes(options)
        setSubSedes([])
        setAutoSedeId('')
        setAutoSubSedeId('')
        setDetectedHeadquarter(null)
        setDetectedSubHeadquarter(null)
        setIsUbicacionBloqueada(false)
        setLocationValidation(firstFailedValidation(allRes.validation))
        setLocationVersion((prev) => prev + 1)
        return
      }

      const [hqResult, subHqResult] = await Promise.all([
        fetchHeadquarterById(headquartersId),
        fetchSubHeadquartersByHeadquarter(headquartersId),
      ])
      if (!isMountedRef.current) return

      const hq = hqResult.headquarter
      const nextSedes = hq ? mapSedeOptions([hq]) : []
      const nextSubSedes = mapSubSedeOptions(subHqResult.subHeadquarters)

      const matchedSubHq =
        (subHeadquartersId
          ? subHqResult.subHeadquarters.find(
              (item) => item.id === subHeadquartersId
            )
          : undefined) ??
        subHqResult.subHeadquarters[0] ??
        null

      const nextSedeId = hq?.id ?? ''
      const nextSubSedeId = matchedSubHq?.id ?? ''

      detectedSnapshotRef.current = {
        sedeId: nextSedeId,
        subSedeId: nextSubSedeId,
        sedes: nextSedes,
        subSedes: nextSubSedes,
        headquarter: hq,
        subHeadquarter: matchedSubHq,
      }

      setSedes(nextSedes)
      setSubSedes(nextSubSedes)
      setAutoSedeId(nextSedeId)
      setAutoSubSedeId(nextSubSedeId)
      setDetectedHeadquarter(hq)
      setDetectedSubHeadquarter(matchedSubHq)
      setIsUbicacionBloqueada(true)
      setLocationValidation(
        firstFailedValidation(hqResult.validation, subHqResult.validation)
      )
      setLocationVersion((prev) => prev + 1)
    } catch (error) {
      console.error('Error al detectar ubicación del recepcionista:', error)
      if (!isMountedRef.current) return
      setIsUbicacionBloqueada(false)
    } finally {
      if (isMountedRef.current) {
        setSedesLoading(false)
        setSubSedesLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return
    let active = true
    void Promise.resolve()
      .then(() => {
        if (!active) return
        return fetchSedes()
      })
      .catch((error) => {
        console.error('Error al inicializar detección de ubicación:', error)
      })
    return () => {
      active = false
    }
  }, [open, fetchSedes])

  const handleSedeChange = useCallback(async (sedeId: string) => {
    setSubSedes([])
    if (!sedeId) return

    setSubSedesLoading(true)
    try {
      const res = await fetchSubHeadquartersByHeadquarter(sedeId)
      if (!isMountedRef.current) return
      setSubSedes(mapSubSedeOptions(res.subHeadquarters))
      if (!res.validation.isValid) {
        setLocationValidation(res.validation)
      }
    } catch (error) {
      console.error('Error al consultar sub-sedes por sede:', error)
      if (isMountedRef.current) setSubSedes([])
    } finally {
      if (isMountedRef.current) setSubSedesLoading(false)
    }
  }, [])

  const handleToggleEdicionManual = useCallback(async () => {
    try {
      if (isUbicacionBloqueada) {
        setIsUbicacionBloqueada(false)
        setSedesLoading(true)
        const allRes = await fetchAllHeadquarters()
        if (!isMountedRef.current) return
        if (allRes.headquarters.length > 0) {
          setSedes(mapSedeOptions(allRes.headquarters))
        }
        setLocationValidation(firstFailedValidation(allRes.validation))
        return
      }

      const snapshot = detectedSnapshotRef.current
      if (!snapshot.sedeId) return

      setIsUbicacionBloqueada(true)
      setSedes(snapshot.sedes)
      setSubSedes(snapshot.subSedes)
      setAutoSedeId(snapshot.sedeId)
      setAutoSubSedeId(snapshot.subSedeId)
      setDetectedHeadquarter(snapshot.headquarter)
      setDetectedSubHeadquarter(snapshot.subHeadquarter)
      setLocationValidation(null)
      setLocationVersion((prev) => prev + 1)
    } catch (error) {
      console.error('Error al alternar edición manual de ubicación:', error)
    } finally {
      if (isMountedRef.current) {
        setSedesLoading(false)
      }
    }
  }, [isUbicacionBloqueada])

  const handleSubmit = useCallback(
    async (values: EdificioInput) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)
      setSubmitError(null)
      try {
        await RegistrarEdificio(edificioRepository)(values)
        setSuccess({
          nombre: values.nombre.trim(),
          numPisos: values.numPisos.trim(),
        })
        onSuccess?.()
      } catch (error) {
        const status = error instanceof EdificioApiError ? error.status : 0
        setSubmitError(edificioErrorCopy(status))
      } finally {
        setSubmitting(false)
        submittingRef.current = false
      }
    },
    [onSuccess]
  )

  const clearFormFeedback = useCallback(() => {
    setSuccess(null)
    setSubmitError(null)
  }, [])

  const resetForm = useCallback(() => {
    clearFormFeedback()
    void fetchSedes().catch((error) => {
      console.error('Error al recargar sedes tras reiniciar:', error)
    })
  }, [clearFormFeedback, fetchSedes])

  const sedesError =
    locationValidation && !locationValidation.isValid
      ? locationValidation.message
      : null

  return {
    sedes,
    sedesLoading,
    sedesError,
    subSedes,
    subSedesLoading,
    autoSedeId,
    autoSubSedeId,
    locationVersion,
    isUbicacionBloqueada,
    detectedHeadquarter,
    detectedSubHeadquarter,
    locationValidation,
    submitting,
    submitError,
    success,
    fetchSedes,
    handleSedeChange,
    handleToggleEdicionManual,
    handleSubmit,
    clearFormFeedback,
    resetForm,
  }
}
