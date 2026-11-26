import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import { ObtenerSiguienteNumeroHabitacion } from '../application/obtener-siguiente-numero-habitacion'
import type { HabitacionDetalleRepository } from '../domain/habitacion-detalle-repository'

/**
 * Sub-hook SRP para autogenerar y controlar la edición manual del número de habitación.
 */
export function useHabitacionNextNumber({
  repository,
  numeroContainerRef,
  onAutoNumberResolved,
}: {
  repository: HabitacionDetalleRepository
  numeroContainerRef: RefObject<HTMLDivElement | null>
  onAutoNumberResolved: () => void
}) {
  const [numero, setNumero] = useState('')
  const [autoNextNumber, setAutoNextNumber] = useState('')
  const [isManualNumber, setIsManualNumber] = useState(false)
  const [loadingNextNumber, setLoadingNextNumber] = useState(true)
  const [nextNumberError, setNextNumberError] = useState<string | null>(null)
  const onResolvedRef = useRef(onAutoNumberResolved)

  useEffect(() => {
    onResolvedRef.current = onAutoNumberResolved
  }, [onAutoNumberResolved])

  const applyNextNumberResult = useCallback(
    (
      result: Awaited<
        ReturnType<ReturnType<typeof ObtenerSiguienteNumeroHabitacion>>
      >
    ) => {
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
        onResolvedRef.current()
      }
    },
    []
  )

  const fetchNextNumber = useCallback(async () => {
    setLoadingNextNumber(true)
    setNextNumberError(null)
    try {
      const getNext = ObtenerSiguienteNumeroHabitacion(repository)
      applyNextNumberResult(await getNext())
    } catch {
      const validation = validateStatusCode(0)
      setNextNumberError(
        validation.message ?? 'No se pudo consultar el próximo número.'
      )
      setIsManualNumber(true)
    } finally {
      setLoadingNextNumber(false)
    }
  }, [applyNextNumberResult, repository])

  useEffect(() => {
    let active = true
    async function loadNextNumberOnMount() {
      try {
        const getNext = ObtenerSiguienteNumeroHabitacion(repository)
        const result = await getNext()
        if (active) applyNextNumberResult(result)
      } catch {
        if (!active) return
        const validation = validateStatusCode(0)
        setNextNumberError(
          validation.message ?? 'No se pudo consultar el próximo número.'
        )
        setIsManualNumber(true)
      } finally {
        if (active) setLoadingNextNumber(false)
      }
    }
    void loadNextNumberOnMount()
    return () => {
      active = false
    }
  }, [applyNextNumberResult, repository])

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
  }, [isManualNumber, numeroContainerRef])

  const toggleManualNumber = useCallback(() => {
    if (isManualNumber) {
      setIsManualNumber(false)
      if (autoNextNumber) {
        setNumero(autoNextNumber)
        onResolvedRef.current()
      } else {
        void fetchNextNumber()
      }
      return
    }
    setIsManualNumber(true)
  }, [autoNextNumber, fetchNextNumber, isManualNumber])

  const resetNextNumber = useCallback(() => {
    if (autoNextNumber) {
      setIsManualNumber(false)
      setNumero(autoNextNumber)
    } else {
      setNumero('')
      void fetchNextNumber()
    }
  }, [autoNextNumber, fetchNextNumber])

  return {
    numero,
    setNumero,
    isManualNumber,
    loadingNextNumber,
    nextNumberError,
    toggleManualNumber,
    resetNextNumber,
  }
}
