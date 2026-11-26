import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  validateEdificioInput,
  type EdificioEstado,
  type EdificioInput,
  type EdificioValidationErrors,
} from '../domain/edificio'

export interface UseEdificioFormParams {
  autoSedeId: string
  autoSubSedeId: string
  locationVersion: number
  isUbicacionBloqueada: boolean
  onSedeChange: (sedeId: string) => void
  onToggleEdicionManual?: () => void
  onSubmit: (values: EdificioInput) => void
}

/**
 * Hook de aplicación para el estado, sincronización de overrides manuales y
 * validación del formulario de edificios y pisos.
 */
export function useEdificioForm({
  autoSedeId,
  autoSubSedeId,
  locationVersion,
  isUbicacionBloqueada,
  onSedeChange,
  onToggleEdicionManual,
  onSubmit,
}: UseEdificioFormParams) {
  const [nombre, setNombre] = useState('')
  const [numPisos, setNumPisos] = useState('')
  const [manualOverride, setManualOverride] = useState<{
    version: number
    sedeId?: string
    subSedeId?: string
  }>({ version: locationVersion })
  const [estado, setEstado] = useState<EdificioEstado>('disponible')
  const [errors, setErrors] = useState<EdificioValidationErrors>({})

  const sedeId = useMemo(() => {
    if (
      isUbicacionBloqueada ||
      manualOverride.version !== locationVersion ||
      manualOverride.sedeId === undefined
    ) {
      return autoSedeId
    }
    return manualOverride.sedeId
  }, [autoSedeId, isUbicacionBloqueada, locationVersion, manualOverride])

  const subSedeId = useMemo(() => {
    if (
      isUbicacionBloqueada ||
      manualOverride.version !== locationVersion ||
      manualOverride.subSedeId === undefined
    ) {
      return autoSubSedeId
    }
    return manualOverride.subSedeId
  }, [autoSubSedeId, isUbicacionBloqueada, locationVersion, manualOverride])

  const clearError = useCallback((field: keyof EdificioValidationErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  const handleNombreChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setNombre(event.target.value)
      clearError('nombre')
    },
    [clearError]
  )

  const handleNumPisosChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setNumPisos(event.target.value)
      clearError('numPisos')
    },
    [clearError]
  )

  const handleSedeChange = useCallback(
    (value: string) => {
      try {
        setManualOverride({
          version: locationVersion,
          sedeId: value,
          subSedeId: '',
        })
        clearError('sedeId')
        clearError('subSedeId')
        onSedeChange(value)
      } catch (error) {
        console.error('Error al seleccionar sede:', error)
      }
    },
    [clearError, locationVersion, onSedeChange]
  )

  const handleSubSedeChange = useCallback(
    (value: string) => {
      try {
        setManualOverride((prev) => ({
          version: locationVersion,
          sedeId:
            prev.version === locationVersion && prev.sedeId !== undefined
              ? prev.sedeId
              : autoSedeId,
          subSedeId: value,
        }))
        clearError('subSedeId')
      } catch (error) {
        console.error('Error al seleccionar sub sede:', error)
      }
    },
    [autoSedeId, clearError, locationVersion]
  )

  const handleToggleManual = useCallback(() => {
    try {
      clearError('sedeId')
      clearError('subSedeId')
      onToggleEdicionManual?.()
    } catch (error) {
      console.error('Error al cambiar modo de edición de ubicación:', error)
    }
  }, [clearError, onToggleEdicionManual])

  const handleEstadoChange = useCallback(
    (value: string) => {
      try {
        setEstado((value || 'disponible') as EdificioEstado)
        clearError('estado')
      } catch (error) {
        console.error('Error al cambiar estado del edificio:', error)
      }
    },
    [clearError]
  )

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        const values: EdificioInput = {
          nombre,
          numPisos,
          sedeId,
          subSedeId,
          estado,
        }
        const nextErrors = validateEdificioInput(values)
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length === 0) {
          onSubmit(values)
        }
      } catch (error) {
        console.error('Error al validar formulario de edificio:', error)
      }
    },
    [estado, nombre, numPisos, onSubmit, sedeId, subSedeId]
  )

  return {
    nombre,
    numPisos,
    sedeId,
    subSedeId,
    estado,
    errors,
    handleNombreChange,
    handleNumPisosChange,
    handleSedeChange,
    handleSubSedeChange,
    handleToggleManual,
    handleEstadoChange,
    submit,
  }
}
