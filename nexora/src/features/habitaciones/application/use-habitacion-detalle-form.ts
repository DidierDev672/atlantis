import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import { ObtenerSiguienteNumeroHabitacion } from '../application/obtener-siguiente-numero-habitacion'
import {
  HABITACION_ESTADOS,
  HABITACION_ESTADO_LABELS,
  validateHabitacionDetalleInput,
  type HabitacionDetalleInput,
  type HabitacionDetalleValidationErrors,
  type HabitacionEstado,
} from '../domain/habitacion-detalle'
import type { HabitacionDetalleRepository } from '../domain/habitacion-detalle-repository'
import { ApiHabitacionDetalleRepository } from '../infrastructure/api-habitacion-detalle-repository'
import { useEdificioFloors, type EdificioOption } from './use-edificio-floors'

export type { EdificioOption }

export interface Option {
  value: string
  label: string
}

export interface TarifaOption {
  value: string
  label: string
  price: number
  modality?: string
}

type FieldKey = keyof HabitacionDetalleValidationErrors

const ALLOWED_NAVIGATION_KEYS = new Set([
  'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
])

export const HABITACION_ESTADO_OPTIONS: ReadonlyArray<Option> =
  HABITACION_ESTADOS.map((value) => ({
    value,
    label: HABITACION_ESTADO_LABELS[value],
  }))

const defaultHabitacionDetalleRepository = new ApiHabitacionDetalleRepository()

export function formatCurrencyCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export interface UseHabitacionDetalleFormParams {
  edificios: ReadonlyArray<EdificioOption>
  selectedTarifa?: TarifaOption | null
  onTarifaChange?: (tarifaId: string) => void
  onSubmit: (values: HabitacionDetalleInput) => void
  onClear?: () => void
  repository?: HabitacionDetalleRepository
}

export function useHabitacionDetalleForm({
  edificios,
  selectedTarifa,
  onTarifaChange,
  onSubmit,
  onClear,
  repository,
}: UseHabitacionDetalleFormParams) {
  const [numero, setNumero] = useState('')
  const [autoNextNumber, setAutoNextNumber] = useState('')
  const [isManualNumber, setIsManualNumber] = useState(false)
  const [loadingNextNumber, setLoadingNextNumber] = useState(true)
  const [nextNumberError, setNextNumberError] = useState<string | null>(null)
  const [edificioId, setEdificioId] = useState('')
  const [piso, setPiso] = useState('')
  const [tipoHabitacion, setTipoHabitacion] = useState('')
  const [estado, setEstado] = useState<HabitacionEstado>('disponible')
  const [precio, setPrecio] = useState('')
  const [errors, setErrors] = useState<HabitacionDetalleValidationErrors>({})

  const numeroContainerRef = useRef<HTMLDivElement>(null)
  const effectiveRepository = useMemo(
    () => repository ?? defaultHabitacionDetalleRepository,
    [repository]
  )

  const clearError = useCallback((field: FieldKey) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  const applyNextNumberResult = useCallback(
    (result: Awaited<ReturnType<ReturnType<typeof ObtenerSiguienteNumeroHabitacion>>>) => {
      if (!result.validation.isValid) {
        setNextNumberError(
          result.validation.message ??
            `No se pudo obtener el número automático (código ${result.validation.status}).`
        )
        setIsManualNumber(true)
        return
      }
      if (result.nextNumber) {
        setAutoNextNumber(result.nextNumber)
        setNumero(result.nextNumber)
        clearError('numero')
      }
    },
    [clearError]
  )

  const fetchNextNumber = useCallback(async () => {
    setLoadingNextNumber(true)
    setNextNumberError(null)
    try {
      const getNext = ObtenerSiguienteNumeroHabitacion(effectiveRepository)
      applyNextNumberResult(await getNext())
    } catch {
      const validation = validateStatusCode(0)
      setNextNumberError(validation.message ?? 'No se pudo consultar el próximo número.')
      setIsManualNumber(true)
    } finally {
      setLoadingNextNumber(false)
    }
  }, [applyNextNumberResult, effectiveRepository])

  useEffect(() => {
    let active = true
    async function loadNextNumberOnMount() {
      try {
        const getNext = ObtenerSiguienteNumeroHabitacion(effectiveRepository)
        const result = await getNext()
        if (active) applyNextNumberResult(result)
      } catch {
        if (!active) return
        const validation = validateStatusCode(0)
        setNextNumberError(validation.message ?? 'No se pudo consultar el próximo número.')
        setIsManualNumber(true)
      } finally {
        if (active) setLoadingNextNumber(false)
      }
    }
    void loadNextNumberOnMount()
    return () => {
      active = false
    }
  }, [applyNextNumberResult, effectiveRepository])

  useEffect(() => {
    if (!isManualNumber) return
    const timerId = window.setTimeout(() => {
      const inputEl = numeroContainerRef.current?.querySelector('input')
      if (inputEl) {
        inputEl.focus()
        inputEl.select()
      }
    }, 40)
    return () => window.clearTimeout(timerId)
  }, [isManualNumber])

  const {
    selectedEdificio,
    loadingFloors,
    totalPisos,
    effectivePiso,
    pisoOptions,
    fetchedFloors,
  } = useEdificioFloors(edificioId, edificios, piso)

  const handleEdificioChange = useCallback(
    (newEdificioId: string) => {
      setEdificioId(newEdificioId)
      clearError('edificioId')
      clearError('piso')
      const matched = edificios.find((e) => e.value === newEdificioId)
      const availableFloors = matched?.floorNumber ?? fetchedFloors[newEdificioId] ?? 0
      if (!newEdificioId || (piso && availableFloors > 0 && Number(piso) > availableFloors)) {
        setPiso('')
      }
    },
    [clearError, edificios, fetchedFloors, piso]
  )

  const handlePisoChange = useCallback((v: string) => {
    setPiso(v)
    clearError('piso')
  }, [clearError])

  const handleNumeroChange = useCallback((v: string) => {
    setNumero(v)
    clearError('numero')
  }, [clearError])

  const handleToggleManualNumber = useCallback(() => {
    if (isManualNumber) {
      setIsManualNumber(false)
      if (autoNextNumber) {
        setNumero(autoNextNumber)
        clearError('numero')
      } else {
        void fetchNextNumber()
      }
      return
    }
    setIsManualNumber(true)
  }, [autoNextNumber, clearError, fetchNextNumber, isManualNumber])

  const handleTipoHabitacionChange = useCallback((v: string) => {
    setTipoHabitacion(v)
    clearError('tipoHabitacion')
  }, [clearError])

  const handleEstadoChange = useCallback((v: string) => {
    setEstado(v as HabitacionEstado)
    clearError('estado')
  }, [clearError])

  const handlePrecioChange = useCallback((rawValue: string) => {
    setPrecio(rawValue.replace(/\D/g, ''))
    clearError('precio')
  }, [clearError])

  const handlePrecioKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (ALLOWED_NAVIGATION_KEYS.has(event.key)) return
    if (!/^\d$/.test(event.key)) event.preventDefault()
  }, [])

  const handleApplyTarifaPrice = useCallback(() => {
    if (selectedTarifa && selectedTarifa.price > 0) {
      handlePrecioChange(String(Math.trunc(selectedTarifa.price)))
    }
  }, [handlePrecioChange, selectedTarifa])

  const numericPrecio = precio.trim() ? Number(precio.trim()) : 0
  const hasValidNumericPrecio = !Number.isNaN(numericPrecio) && numericPrecio > 0
  const isOverTariff = Boolean(
    selectedTarifa && selectedTarifa.price > 0 && hasValidNumericPrecio && numericPrecio > selectedTarifa.price
  )

  const tariffOverPriceError = useMemo(() => {
    if (selectedTarifa && selectedTarifa.price > 0 && hasValidNumericPrecio && numericPrecio > selectedTarifa.price) {
      return `El precio (${formatCurrencyCOP(numericPrecio)}) no puede superar la tarifa seleccionada (${formatCurrencyCOP(selectedTarifa.price)}).`
    }
    return undefined
  }, [hasValidNumericPrecio, numericPrecio, selectedTarifa])

  const handleReset = useCallback(() => {
    try {
      setEdificioId('')
      setPiso('')
      setTipoHabitacion('')
      setEstado('disponible')
      setPrecio('')
      setErrors({})
      onTarifaChange?.('')
      onClear?.()
      if (autoNextNumber) {
        setIsManualNumber(false)
        setNumero(autoNextNumber)
      } else {
        setNumero('')
        void fetchNextNumber()
      }
    } catch (error) {
      console.error('Error al limpiar formulario de habitación:', error)
    }
  }, [autoNextNumber, fetchNextNumber, onClear, onTarifaChange])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        const values: HabitacionDetalleInput = {
          numero,
          piso: effectivePiso,
          tipoHabitacion,
          edificioId,
          precio,
          estado,
          tarifaId: selectedTarifa?.value || undefined,
        }
        const nextErrors = validateHabitacionDetalleInput(
          values,
          selectedTarifa?.price,
          totalPisos > 0 ? totalPisos : null
        )
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length === 0) onSubmit(values)
      } catch (error) {
        console.error('Error al validar o enviar habitación:', error)
      }
    },
    [
      edificioId,
      effectivePiso,
      estado,
      numero,
      onSubmit,
      precio,
      selectedTarifa,
      tipoHabitacion,
      totalPisos,
    ]
  )

  return {
    numero,
    isManualNumber,
    loadingNextNumber,
    nextNumberError,
    numeroContainerRef,
    edificioId,
    selectedEdificio,
    loadingFloors,
    totalPisos,
    effectivePiso,
    pisoOptions,
    tipoHabitacion,
    estado,
    precio,
    numericPrecio,
    hasValidNumericPrecio,
    isOverTariff,
    errors,
    displayedPrecioError: errors.precio ?? tariffOverPriceError,
    handleEdificioChange,
    handlePisoChange,
    handleNumeroChange,
    handleToggleManualNumber,
    handleTipoHabitacionChange,
    handleEstadoChange,
    handlePrecioChange,
    handlePrecioKeyDown,
    handleApplyTarifaPrice,
    handleReset,
    handleSubmit,
  }
}
