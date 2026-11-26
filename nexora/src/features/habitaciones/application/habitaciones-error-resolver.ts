import { isAxiosError } from 'axios'
import type {
  AlertPlanet,
  AlertVariant,
} from '../../../shared/alert/lib/types'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'

export interface HabitacionesErrorInfo {
  message: string
  title: string
  variant: AlertVariant
  planet: AlertPlanet
  statusCode?: number
  rawError: unknown
}

const DEFAULT_FALLBACK_MESSAGE =
  'No pudimos conectar con el servidor para obtener la lista de pisos y habitaciones. Verifica tu conexión e inténtalo de nuevo.'

function extractHttpStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    if (error.response?.status) return error.response.status
    if (error.code === 'ECONNABORTED') return 408
    return undefined
  }
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status
    if (typeof status === 'number' && status > 0) return status
  }
  return undefined
}

/**
 * Normaliza excepciones producidas al obtener pisos o habitaciones para
 * alimentar `PlanetAlert` y el validador centralizado de status codes.
 */
export function resolveHabitacionesFetchError(
  error: unknown,
  fallbackMessage = DEFAULT_FALLBACK_MESSAGE
): HabitacionesErrorInfo {
  try {
    const statusCode = extractHttpStatus(error)
    if (statusCode && statusCode > 0) {
      const validation = validateStatusCode(statusCode)
      return {
        message: validation.message ?? fallbackMessage,
        title: validation.title ?? 'Aviso del sistema',
        variant: validation.variant,
        planet: validation.planet,
        statusCode,
        rawError: error,
      }
    }

    return {
      message: fallbackMessage,
      title: 'Sin conexión con el servidor',
      variant: 'error',
      planet: 'mars',
      rawError: error,
    }
  } catch {
    return {
      message: fallbackMessage,
      title: 'Aviso del sistema',
      variant: 'error',
      planet: 'mars',
      rawError: error,
    }
  }
}
