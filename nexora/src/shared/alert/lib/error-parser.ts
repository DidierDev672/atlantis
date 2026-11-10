import type { ParsedApiError } from './types'

/**
 * Extrae y normaliza de forma segura cualquier error de endpoints o librerías HTTP (Axios, Fetch, Go Rest API, etc.)
 * en un objeto estructurado `ParsedApiError` para mostrarle al usuario qué errores exactos está obteniendo.
 */
export function parseApiError(error: unknown, fallbackMessage = 'Ha ocurrido un error inesperado al procesar la solicitud.'): ParsedApiError {
  if (!error) {
    return {
      title: 'Aviso',
      message: fallbackMessage,
      details: [],
    }
  }

  // Si ya es un ParsedApiError
  if (typeof error === 'object' && error !== null && 'message' in error && 'details' in error) {
    const custom = error as ParsedApiError
    return {
      title: custom.title || 'Error en la solicitud',
      message: custom.message || fallbackMessage,
      details: Array.isArray(custom.details) ? custom.details : [],
      statusCode: custom.statusCode,
      errorCode: custom.errorCode,
    }
  }

  // 1. Caso: String simple
  if (typeof error === 'string') {
    return {
      title: 'Error de operación',
      message: error,
      details: [],
    }
  }

  // 2. Caso: Array de strings o errores
  if (Array.isArray(error)) {
    const list = error.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
    return {
      title: 'Errores detectados en la validación',
      message: list[0] || fallbackMessage,
      details: list.length > 1 ? list : [],
    }
  }

  // 3. Caso: Objeto error de Axios u objeto genérico
  const errObj = error as Record<string, any>
  let statusCode: number | undefined
  let message = ''
  const details: string[] = []

  // Extraer código HTTP si existe (típico de axios.response.status o status directo)
  if (errObj.response && typeof errObj.response.status === 'number') {
    statusCode = errObj.response.status
  } else if (typeof errObj.status === 'number') {
    statusCode = errObj.status
  }

  // Extraer payload de datos del backend (ej: axios.response.data o err.data)
  const data = errObj.response?.data ?? errObj.data ?? errObj

  if (typeof data === 'string') {
    message = data
  } else if (typeof data === 'object' && data !== null) {
    // Patrones comunes en backend Go: { "error": "..." }
    if (typeof data.error === 'string' && data.error.trim()) {
      message = data.error
    }
    // Patrones comunes en REST: { "message": "..." }
    else if (typeof data.message === 'string' && data.message.trim()) {
      message = data.message
    }
    // Patrones como { "detail": "..." } o { "title": "..." }
    else if (typeof data.detail === 'string' && data.detail.trim()) {
      message = data.detail
    }

    // Extraer lista de errores detallados: data.errors o data.details
    if (Array.isArray(data.errors)) {
      data.errors.forEach((e: unknown) => {
        if (typeof e === 'string') details.push(e)
        else if (typeof e === 'object' && e !== null && 'message' in e) details.push(String((e as any).message))
        else details.push(JSON.stringify(e))
      })
    } else if (typeof data.errors === 'object' && data.errors !== null) {
      // Objeto mapa: { "room_id": ["El campo es requerido"], "person_ids": "Debe tener al menos un huésped" }
      Object.entries(data.errors).forEach(([field, val]) => {
        if (Array.isArray(val)) {
          val.forEach((subVal) => details.push(`${field}: ${String(subVal)}`))
        } else {
          details.push(`${field}: ${String(val)}`)
        }
      })
    } else if (Array.isArray(data.details)) {
      data.details.forEach((d: unknown) => details.push(typeof d === 'string' ? d : JSON.stringify(d)))
    }
  }

  // Si no se extrajo mensaje de `data`, intentar desde `errObj.message` estándar de JS Error
  if (!message && typeof errObj.message === 'string') {
    message = errObj.message
  }

  // Si aún está vacío, usar fallback
  if (!message) {
    message = fallbackMessage
  }

  // Asignar título contextual según el código HTTP
  let title = 'Error en el servidor'
  if (statusCode === 400) {
    title = 'Solicitud incorrecta (400 Bad Request)'
  } else if (statusCode === 401) {
    title = 'No autorizado (401 Unauthorized)'
  } else if (statusCode === 403) {
    title = 'Acceso denegado (403 Forbidden)'
  } else if (statusCode === 404) {
    title = 'Recurso no encontrado (404 Not Found)'
  } else if (statusCode === 422) {
    title = 'Error de validación (422 Unprocessable Entity)'
  } else if (statusCode && statusCode >= 500) {
    title = `Error interno del servidor (${statusCode})`
  } else if (errObj.name && typeof errObj.name === 'string') {
    title = errObj.name
  }

  return {
    title,
    message,
    details,
    statusCode,
    errorCode: typeof data?.code === 'string' ? data.code : undefined,
  }
}
