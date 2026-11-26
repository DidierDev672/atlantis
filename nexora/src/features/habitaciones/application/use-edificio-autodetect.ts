import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import { fetchDetectedBuildingFromAuthUser } from '../infrastructure/auth-edificio-detector'
import type { EdificioOption } from './use-edificio-floors'

/**
 * Hook de aplicación para autodetectar el edificio desde `localStorage` (`auth_user`),
 * bloquear el campo por defecto (`!isManualEdificio`) y alternar edición manual.
 */
export function useEdificioAutodetect(edificios: ReadonlyArray<EdificioOption>) {
  const [autoEdificio, setAutoEdificio] = useState<EdificioOption | null>(null)
  const [buildingNameHint, setBuildingNameHint] = useState<string | null>(null)
  const [loadingAutoEdificio, setLoadingAutoEdificio] = useState(true)
  const [autoEdificioValidation, setAutoEdificioValidation] =
    useState<StatusCodeValidationResult | null>(null)
  const [isManualEdificio, setIsManualEdificio] = useState(false)
  const [manualEdificioId, setManualEdificioId] = useState<string | null>(null)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(async () => {
        try {
          const res = await fetchDetectedBuildingFromAuthUser()
          if (!active || !isMountedRef.current) return
          setAutoEdificio(res.building)
          setBuildingNameHint(res.buildingNameHint)
          setAutoEdificioValidation(res.validation)
        } catch (err) {
          console.error('Error al detectar edificio desde auth_user:', err)
        } finally {
          if (active && isMountedRef.current) {
            setLoadingAutoEdificio(false)
          }
        }
      })
      .catch((err) => {
        console.error('Error iniciando detección de edificio:', err)
      })

    return () => {
      active = false
    }
  }, [])

  const mergedEdificios = useMemo<ReadonlyArray<EdificioOption>>(() => {
    if (!autoEdificio) return edificios
    if (edificios.some((item) => item.value === autoEdificio.value)) {
      return edificios
    }
    return [autoEdificio, ...edificios]
  }, [autoEdificio, edificios])

  const detectedEdificioId = useMemo(() => {
    if (autoEdificio?.value) return autoEdificio.value
    if (buildingNameHint) {
      const normalized = buildingNameHint.trim().toLowerCase()
      const matched = mergedEdificios.find(
        (item) => item.label.trim().toLowerCase() === normalized
      )
      if (matched) return matched.value
    }
    return ''
  }, [autoEdificio, buildingNameHint, mergedEdificios])

  const effectiveEdificioId = isManualEdificio
    ? (manualEdificioId ?? detectedEdificioId)
    : detectedEdificioId

  const toggleManualEdificio = useCallback(() => {
    try {
      setIsManualEdificio((prev) => {
        const nextManual = !prev
        if (nextManual) {
          setManualEdificioId((current) => current ?? detectedEdificioId)
        } else {
          setManualEdificioId(null)
        }
        return nextManual
      })
    } catch (err) {
      console.error('Error al alternar edición manual de edificio:', err)
    }
  }, [detectedEdificioId])

  const resetEdificioToDetected = useCallback(() => {
    setIsManualEdificio(false)
    setManualEdificioId(null)
  }, [])

  return {
    mergedEdificios,
    detectedEdificioId,
    effectiveEdificioId,
    isManualEdificio,
    loadingAutoEdificio,
    autoEdificioValidation,
    setManualEdificioId,
    toggleManualEdificio,
    resetEdificioToDetected,
  }
}
