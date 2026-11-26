import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  HABITACION_ESTADOS,
  HABITACION_ESTADO_LABELS,
  type HabitacionEstado,
} from '../domain/habitacion-detalle'
import {
  validateHabitacionInput,
  type HabitacionInput,
  type HabitacionValidationErrors,
} from '../domain/habitacion'
import { useEdificioAutodetect } from './use-edificio-autodetect'
import type { EdificioOption } from './use-edificio-floors'

/**
 * Hook de aplicación para estado, autodetección de edificio desde `auth_user`,
 * validación y manejo seguro (`try / catch`) del formulario de tipos de habitación.
 */
export function useHabitacionRegistroForm(
  onSubmit: (values: HabitacionInput) => void
) {
  const [name, setName] = useState('')
  const [edificiosCatalog, setEdificiosCatalog] = useState<EdificioOption[]>([])
  const [edificiosLoading, setEdificiosLoading] = useState(false)
  const [estado, setEstado] = useState<HabitacionEstado>('disponible')
  const [capacity, setCapacity] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [errors, setErrors] = useState<HabitacionValidationErrors>({})

  const isMountedRef = useRef(true)
  const catalogLoadedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadEdificiosCatalog = useCallback(async () => {
    if (catalogLoadedRef.current) return
    setEdificiosLoading(true)
    try {
      const { fetchBuildingsCatalogCached } = await import(
        '../infrastructure/habitaciones-catalogs-cache'
      )
      const list = await fetchBuildingsCatalogCached(false)
      if (!isMountedRef.current) return
      catalogLoadedRef.current = true
      setEdificiosCatalog(
        list.map((item) => ({
          value: item.id,
          label: item.name,
          floorNumber: item.floorNumber,
        }))
      )
    } catch (error) {
      console.error('Error al cargar catálogo de edificios:', error)
    } finally {
      if (isMountedRef.current) {
        setEdificiosLoading(false)
      }
    }
  }, [])

  const {
    mergedEdificios,
    effectiveEdificioId: edificioId,
    isManualEdificio,
    loadingAutoEdificio,
    autoEdificioValidation,
    setManualEdificioId,
    toggleManualEdificio,
  } = useEdificioAutodetect(edificiosCatalog)

  const estadoOptions = useMemo(
    () =>
      HABITACION_ESTADOS.map((val) => ({
        value: val,
        label: HABITACION_ESTADO_LABELS[val],
      })),
    []
  )

  const clearError = useCallback((field: keyof HabitacionValidationErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      try {
        setName(event.target.value)
        clearError('name')
      } catch (error) {
        console.error('Error al editar nombre:', error)
      }
    },
    [clearError]
  )

  const handleCapacityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      try {
        setCapacity(event.target.value)
        clearError('capacity')
      } catch (error) {
        console.error('Error al editar capacidad:', error)
      }
    },
    [clearError]
  )

  const handleBasePriceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      try {
        setBasePrice(event.target.value)
        clearError('basePrice')
      } catch (error) {
        console.error('Error al editar precio base:', error)
      }
    },
    [clearError]
  )

  const handleEdificioChange = useCallback(
    (value: string) => {
      try {
        setManualEdificioId(value)
      } catch (error) {
        console.error('Error al seleccionar edificio:', error)
      }
    },
    [setManualEdificioId]
  )

  const handleToggleManualEdificio = useCallback(() => {
    try {
      if (!isManualEdificio && !catalogLoadedRef.current) {
        void loadEdificiosCatalog()
      }
      toggleManualEdificio()
    } catch (error) {
      console.error('Error al alternar edición manual de edificio:', error)
    }
  }, [isManualEdificio, loadEdificiosCatalog, toggleManualEdificio])

  const handleEstadoChange = useCallback(
    (value: string) => {
      try {
        setEstado((value || 'disponible') as HabitacionEstado)
        clearError('estado')
      } catch (error) {
        console.error('Error al cambiar estado:', error)
      }
    },
    [clearError]
  )

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        const values: HabitacionInput = {
          name,
          capacity,
          basePrice,
          edificioId,
          estado,
        }
        const nextErrors = validateHabitacionInput(values)
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length === 0) {
          onSubmit(values)
        }
      } catch (error) {
        console.error('Error al validar formulario de tipo de habitación:', error)
      }
    },
    [basePrice, capacity, edificioId, estado, name, onSubmit]
  )

  return {
    name,
    edificioId,
    mergedEdificios,
    edificiosLoading,
    loadingAutoEdificio,
    isManualEdificio,
    autoEdificioValidation,
    estado,
    capacity,
    basePrice,
    errors,
    estadoOptions,
    handleNameChange,
    handleCapacityChange,
    handleBasePriceChange,
    handleEdificioChange,
    handleToggleManualEdificio,
    handleEstadoChange,
    submit,
  }
}
