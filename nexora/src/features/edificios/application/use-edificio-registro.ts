import { useCallback, useRef, useState } from 'react'
import { RegistrarEdificio } from '../application/registrar-edificio'
import type { EdificioInput } from '../domain/edificio'
import { EdificioApiError } from '../domain/edificio-error'
import { ApiEdificioRepository } from '../infrastructure/api-edificio-repository'
import { edificioErrorCopy } from '../ui/lib/error-copy'
import { useEdificioUbicacion } from './use-edificio-ubicacion'

const edificioRepository = new ApiEdificioRepository()

export interface UseEdificioRegistroOptions {
  open: boolean
  onSuccess?: () => void
}

/**
 * Hook de aplicación reutilizable para registrar edificios y pisos (`POST /building`),
 * delegando la autodetección de ubicación y edificio desde `auth_user` a `useEdificioUbicacion`.
 */
export function useEdificioRegistro({
  open,
  onSuccess,
}: UseEdificioRegistroOptions) {
  const ubicacion = useEdificioUbicacion(open)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    nombre: string
    numPisos: string
  } | null>(null)
  const submittingRef = useRef(false)

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
    void ubicacion.fetchSedes().catch((error) => {
      console.error('Error al recargar sedes tras reiniciar:', error)
    })
  }, [clearFormFeedback, ubicacion])

  const sedesError =
    ubicacion.locationValidation && !ubicacion.locationValidation.isValid
      ? ubicacion.locationValidation.message
      : null

  return {
    ...ubicacion,
    sedesError,
    submitting,
    submitError,
    success,
    handleSubmit,
    clearFormFeedback,
    resetForm,
  }
}
