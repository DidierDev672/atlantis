import axios from 'axios'
import { api } from '../../../lib/api'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import { getRawJwtToken, readAuthTokenEmail } from '../../../shared/auth-storage'

export interface SedeOption {
  id: string
  name: string
  address?: string
  city?: string
}

export interface SubSedeOption {
  id: string
  headquarter_id?: string
  name: string
}

export interface EdificioOption {
  id: string
  name: string
  floor_number?: number
}

export const FALLBACK_SEDES: SedeOption[] = [
  { id: '857476d852c2d215', name: 'Sede Central' },
  { id: 'hq-2', name: 'Sede Campestre Sol' },
  { id: 'hq-3', name: 'Sede Playa Mirador' },
]

export const FALLBACK_SUB_SEDES: SubSedeOption[] = [
  { id: '3964a679462f9efc', headquarter_id: '857476d852c2d215', name: 'Sede Norte' },
  { id: 'sub-2', headquarter_id: '857476d852c2d215', name: 'Sede Sur San Isidro' },
  { id: 'sub-3', headquarter_id: 'hq-2', name: 'Anexo Valle Verde' },
  { id: 'sub-4', headquarter_id: 'hq-3', name: 'Pabellón Costa Mar' },
]

export const FALLBACK_EDIFICIOS: EdificioOption[] = [
  { id: '161ecb4a52a33a52', name: 'Edificio A' },
  { id: 'building-2', name: 'Edificio B - Torre Ejecutiva' },
  { id: 'building-3', name: 'Edificio C - Suites Presidenciales' },
]

export interface MenuCategoriaPayload {
  headquartes_id: string
  sub_headquartes_id: string
  building_id: string
  name: string
  description: string
  order: number
  asset: string
  created_by: string
}

/**
 * Consulta las sedes balanceando la carga en GET /headquarters y validando status codes.
 */
export async function fetchSedesApi(): Promise<{
  sedes: SedeOption[]
  validation: StatusCodeValidationResult
}> {
  try {
    const response = await executeBalancedRequest(
      () =>
        api.get('/headquarters', {
          validateStatus: () => true,
        }),
      { maxRetries: 2 }
    )
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const raw = Array.isArray(response.data) ? response.data : [response.data]
      const items = raw
        .filter((item): item is { id: unknown; name: unknown } =>
          Boolean(item && typeof item.name === 'string')
        )
        .map((item) => ({
          id: String(item.id ?? item.name),
          name: String(item.name),
        }))

      if (items.length > 0) {
        return { sedes: items, validation }
      }
    }
    return { sedes: FALLBACK_SEDES, validation }
  } catch (err: unknown) {
    let status = 500
    if (axios.isAxiosError(err) && err.response?.status) {
      status = err.response.status
    } else if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      status = 408
    }
    return { sedes: FALLBACK_SEDES, validation: validateStatusCode(status) }
  }
}

/**
 * Consulta sub-sedes balanceando la carga en GET /sub-headquarters/by-headquarter/{id} y validando status codes.
 */
export async function fetchSubSedesApi(headquarterId: string): Promise<{
  subSedes: SubSedeOption[]
  validation: StatusCodeValidationResult
}> {
  if (!headquarterId) {
    return { subSedes: [], validation: validateStatusCode(200) }
  }

  try {
    const response = await executeBalancedRequest(
      () =>
        api.get(
          `/sub-headquarters/by-headquarter/${encodeURIComponent(headquarterId)}`,
          { validateStatus: () => true }
        ),
      { maxRetries: 2 }
    )
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const raw = Array.isArray(response.data) ? response.data : [response.data]
      const items = raw
        .filter((item): item is { id: unknown; name: unknown } =>
          Boolean(item && typeof item.name === 'string')
        )
        .map((item) => ({
          id: String(item.id ?? item.name),
          name: String(item.name),
        }))

      if (items.length > 0) {
        return { subSedes: items, validation }
      }
    }

    const fallback = FALLBACK_SUB_SEDES.filter(
      (s) => s.headquarter_id === headquarterId || !s.headquarter_id
    )
    const res = fallback.length > 0 ? fallback : [{ id: '3964a679462f9efc', name: 'Sede Norte' }]
    return { subSedes: res, validation }
  } catch (err: unknown) {
    let status = 500
    if (axios.isAxiosError(err) && err.response?.status) {
      status = err.response.status
    } else if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      status = 408
    }
    const fallback = FALLBACK_SUB_SEDES.filter(
      (s) => s.headquarter_id === headquarterId || !s.headquarter_id
    )
    const res = fallback.length > 0 ? fallback : [{ id: '3964a679462f9efc', name: 'Sede Norte' }]
    return { subSedes: res, validation: validateStatusCode(status) }
  }
}

/**
 * Consulta edificios balanceando la carga en GET /building y validando status codes.
 */
export async function fetchEdificiosApi(): Promise<{
  edificios: EdificioOption[]
  validation: StatusCodeValidationResult
}> {
  try {
    const response = await executeBalancedRequest(
      () =>
        api.get('/building', {
          validateStatus: () => true,
        }),
      { maxRetries: 2 }
    )
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const raw = Array.isArray(response.data) ? response.data : [response.data]
      const items = raw
        .filter((item): item is { id: unknown; name: unknown } =>
          Boolean(item && typeof item.name === 'string')
        )
        .map((item) => ({
          id: String(item.id ?? item.name),
          name: String(item.name),
        }))

      if (items.length > 0) {
        return { edificios: items, validation }
      }
    }
    return { edificios: FALLBACK_EDIFICIOS, validation }
  } catch (err: unknown) {
    let status = 500
    if (axios.isAxiosError(err) && err.response?.status) {
      status = err.response.status
    } else if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      status = 408
    }
    return { edificios: FALLBACK_EDIFICIOS, validation: validateStatusCode(status) }
  }
}

/**
 * Envía el registro de categoría con balanceo de carga en POST /menu-category y validación de status codes.
 */
export async function guardarMenuCategoriaApi(
  payload: MenuCategoriaPayload
): Promise<StatusCodeValidationResult> {
  try {
    const authToken = getRawJwtToken()
    const headers: Record<string, string> = {}
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
      headers['auth-token'] = authToken
    }

    const response = await executeBalancedRequest(
      () =>
        api.post('/menu-category', payload, {
          headers,
          validateStatus: () => true,
        }),
      { maxRetries: 2 }
    )

    return validateStatusCode(response.status)
  } catch (err: unknown) {
    let status = 500
    if (axios.isAxiosError(err) && err.response?.status) {
      status = err.response.status
    } else if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      status = 408
    }
    return validateStatusCode(status)
  }
}

/**
 * Extrae el email del usuario desde auth-storage con fallback seguro.
 */
export function obtenerEmailCreador(): string {
  const email = readAuthTokenEmail()
  return email && email !== 'admin' && email.includes('@')
    ? email
    : 'ariasdev672@gmail.com'
}

