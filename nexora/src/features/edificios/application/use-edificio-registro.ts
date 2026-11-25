import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../../lib/api'
import { RegistrarEdificio } from '../application/registrar-edificio'
import type { EdificioInput } from '../domain/edificio'
import { EdificioApiError } from '../domain/edificio-error'
import { ApiEdificioRepository } from '../infrastructure/api-edificio-repository'
import { edificioErrorCopy } from '../ui/lib/error-copy'
import type { Option } from '../ui/molecules/edificio-form'

const edificioRepository = new ApiEdificioRepository()

function mapIdNameOptions(items: unknown[]): Option[] {
  return items
    .map((raw) => raw as { id?: unknown; name?: unknown })
    .filter((item) => item.id != null && typeof item.name === 'string')
    .map((item) => ({ value: String(item.id), label: String(item.name) }))
}

function mapSubSedeOptions(items: unknown[]): Option[] {
  return items
    .map((raw) => raw as { id?: unknown; name?: unknown })
    .filter((item) => typeof item.name === 'string')
    .map((item) => ({
      value: String(item.id ?? item.name),
      label: String(item.name),
    }))
}

export interface UseEdificioRegistroOptions {
  open: boolean
  onSuccess?: () => void
}

/**
 * Hook de aplicación reutilizable para registrar edificios y sus pisos (`POST /building`),
 * incluyendo carga de sedes, sub-sedes y manejo de errores con `try / catch`.
 */
export function useEdificioRegistro({
  open,
  onSuccess,
}: UseEdificioRegistroOptions) {
  const [sedes, setSedes] = useState<Option[]>([])
  const [sedesLoading, setSedesLoading] = useState(false)
  const [sedesError, setSedesError] = useState<string | null>(null)
  const [subSedes, setSubSedes] = useState<Option[]>([])
  const [subSedesLoading, setSubSedesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    nombre: string
    numPisos: string
  } | null>(null)
  const submittingRef = useRef(false)

  const fetchSedes = useCallback(async () => {
    setSedesLoading(true)
    setSedesError(null)
    try {
      const response = await api.get<unknown>('/headquarters')
      setSedes(
        Array.isArray(response.data) ? mapIdNameOptions(response.data) : []
      )
    } catch {
      setSedesError(
        'No pudimos cargar las sedes, pero el formulario sigue listo. Revisa tu conexión e inténtalo de nuevo.'
      )
    } finally {
      setSedesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void Promise.resolve()
      .then(() => fetchSedes())
      .catch((error) => {
        console.error('Error al cargar sedes:', error)
      })
  }, [open, fetchSedes])

  const handleSedeChange = useCallback(async (sedeId: string) => {
    setSubSedes([])
    if (!sedeId) {
      setSubSedesLoading(false)
      return
    }
    setSubSedesLoading(true)
    try {
      const response = await api.get<unknown>(
        `/sub-headquarters/by-headquarter/${sedeId}`
      )
      setSubSedes(
        Array.isArray(response.data) ? mapSubSedeOptions(response.data) : []
      )
    } catch {
      setSubSedes([])
    } finally {
      setSubSedesLoading(false)
    }
  }, [])

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

  const resetForm = useCallback(() => {
    setSuccess(null)
    setSubmitError(null)
    void fetchSedes().catch((error) => {
      console.error('Error al recargar sedes tras reiniciar:', error)
    })
  }, [fetchSedes])

  return {
    sedes,
    sedesLoading,
    sedesError,
    subSedes,
    subSedesLoading,
    submitting,
    submitError,
    success,
    fetchSedes,
    handleSedeChange,
    handleSubmit,
    resetForm,
  }
}
