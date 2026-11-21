import axios from 'axios'
import { api } from '../../../lib/api'
import {
  getActiveHeadquarterId,
  getRawJwtToken,
  readAuthTokenEmail,
  readAuthUser,
} from '../../../shared/auth-storage'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'

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
  headquarters_id?: string
  sub_headquarters_id?: string
}

export interface AuthUserLocationIds {
  headquartersId: string | null
  subHeadquartersId: string | null
  buildingId: string | null
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

function extractRecords(rawData: unknown): Record<string, unknown>[] {
  if (!rawData) return []
  if (Array.isArray(rawData)) {
    return rawData.filter(
      (item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'),
    )
  }
  if (typeof rawData === 'object') {
    const obj = rawData as Record<string, unknown>
    if (Array.isArray(obj.data)) {
      return obj.data.filter(
        (item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'),
      )
    }
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return [obj.data as Record<string, unknown>]
    }
    return [obj]
  }
  return []
}

function extractAxiosStatus(err: unknown): number {
  if (axios.isAxiosError(err) && err.response?.status) {
    return err.response.status
  }
  if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
    return 408
  }
  return 500
}

function readStringField(
  record: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return null
}

/**
 * Lee los identificadores de ubicación (`headquarters_id`, etc.) del usuario autenticado
 * almacenado en `localStorage` bajo la clave `auth_user`.
 */
export function readAuthUserLocationIds(): AuthUserLocationIds {
  try {
    const authUser = readAuthUser()
    if (!authUser) {
      return {
        headquartersId: getActiveHeadquarterId(),
        subHeadquartersId: null,
        buildingId: null,
      }
    }

    const headquartersId =
      readStringField(authUser, ['headquarters_id', 'headquarter_id']) ||
      getActiveHeadquarterId()

    const subHeadquartersId = readStringField(authUser, [
      'sub_headquarters_id',
      'sub_headquarter_id',
    ])
    const buildingId = readStringField(authUser, ['building_id'])

    return { headquartersId, subHeadquartersId, buildingId }
  } catch (error) {
    console.error('Error al leer ubicación desde auth_user en localStorage:', error)
    return { headquartersId: null, subHeadquartersId: null, buildingId: null }
  }
}

/**
 * Consulta la sede específica del recepcionista en `GET /headquarters/{id}`
 * con balanceo de carga (`executeBalancedRequest`) y validación de status code.
 */
export async function fetchSedePorIdApi(headquartersId: string): Promise<{
  sede: SedeOption | null
  validation: StatusCodeValidationResult
}> {
  if (!headquartersId.trim()) {
    return { sede: null, validation: validateStatusCode(400) }
  }

  try {
    const response = await executeBalancedRequest(
      () =>
        api.get(`/headquarters/${encodeURIComponent(headquartersId.trim())}`, {
          validateStatus: () => true,
        }),
      { maxRetries: 2 },
    )
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const records = extractRecords(response.data)
      const first = records.find((item) => typeof item.name === 'string')
      if (first) {
        return {
          sede: {
            id: String(first.id ?? headquartersId),
            name: String(first.name),
            address: typeof first.address === 'string' ? first.address : undefined,
            city: typeof first.city === 'string' ? first.city : undefined,
          },
          validation,
        }
      }
    }

    return { sede: null, validation }
  } catch (err: unknown) {
    return { sede: null, validation: validateStatusCode(extractAxiosStatus(err)) }
  }
}

/**
 * Consulta todas las sedes en `GET /headquarters` (respaldo cuando no hay `headquarters_id` en sesión).
 */
export async function fetchSedesApi(): Promise<{
  sedes: SedeOption[]
  validation: StatusCodeValidationResult
}> {
  try {
    const response = await executeBalancedRequest(
      () => api.get('/headquarters', { validateStatus: () => true }),
      { maxRetries: 2 },
    )
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const items = extractRecords(response.data)
        .filter((item) => typeof item.name === 'string')
        .map((item) => ({
          id: String(item.id ?? item.name),
          name: String(item.name),
        }))
      if (items.length > 0) return { sedes: items, validation }
    }
    return { sedes: FALLBACK_SEDES, validation }
  } catch (err: unknown) {
    return { sedes: FALLBACK_SEDES, validation: validateStatusCode(extractAxiosStatus(err)) }
  }
}

/**
 * Consulta sub-sedes balanceando la carga en `GET /sub-headquarters/by-headquarter/{id}`
 * y validando status codes.
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
          { validateStatus: () => true },
        ),
      { maxRetries: 2 },
    )
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const items = extractRecords(response.data)
        .filter((item) => typeof item.name === 'string')
        .map((item) => ({
          id: String(item.id ?? item.name),
          headquarter_id:
            typeof item.headquarter_id === 'string' ? item.headquarter_id : headquarterId,
          name: String(item.name),
        }))

      if (items.length > 0) {
        return { subSedes: items, validation }
      }
    }

    return { subSedes: [], validation }
  } catch (err: unknown) {
    return { subSedes: [], validation: validateStatusCode(extractAxiosStatus(err)) }
  }
}

/**
 * Consulta edificios filtrados por sede en `GET /building?headquarters_id={id}`
 * con balanceo de carga y validación de status codes.
 */
export async function fetchEdificiosApi(headquartersId?: string): Promise<{
  edificios: EdificioOption[]
  validation: StatusCodeValidationResult
}> {
  try {
    const endpoint = headquartersId
      ? `/building?headquarters_id=${encodeURIComponent(headquartersId)}`
      : '/building'

    const response = await executeBalancedRequest(
      () => api.get(endpoint, { validateStatus: () => true }),
      { maxRetries: 2 },
    )
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const items = extractRecords(response.data)
        .filter((item) => typeof item.name === 'string')
        .map((item) => ({
          id: String(item.id ?? item.name),
          name: String(item.name),
          floor_number:
            typeof item.floor_number === 'number' ? item.floor_number : undefined,
          headquarters_id:
            typeof item.headquarters_id === 'string'
              ? item.headquarters_id
              : headquartersId,
          sub_headquarters_id:
            typeof item.sub_headquarters_id === 'string'
              ? item.sub_headquarters_id
              : undefined,
        }))

      if (items.length > 0) {
        return { edificios: items, validation }
      }
    }

    return { edificios: headquartersId ? [] : FALLBACK_EDIFICIOS, validation }
  } catch (err: unknown) {
    return {
      edificios: headquartersId ? [] : FALLBACK_EDIFICIOS,
      validation: validateStatusCode(extractAxiosStatus(err)),
    }
  }
}

/**
 * Envía el registro de categoría con balanceo de carga en `POST /menu-category`
 * y validación de status codes.
 */
export async function guardarMenuCategoriaApi(
  payload: MenuCategoriaPayload,
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
      { maxRetries: 2 },
    )

    return validateStatusCode(response.status)
  } catch (err: unknown) {
    return validateStatusCode(extractAxiosStatus(err))
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
