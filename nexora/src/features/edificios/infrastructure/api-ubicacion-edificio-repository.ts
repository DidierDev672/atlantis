import axios from 'axios'
import { api } from '../../../lib/api'
import { readAuthUser } from '../../../shared/auth-storage'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'

export interface EdificioSedeInfo {
  id: string
  name: string
  address?: string
  city?: string
  phone?: string
  status?: string
}

export interface EdificioSubSedeInfo {
  id: string
  headquarter_id?: string
  name: string
  address?: string
  phone?: string
  status?: string
}

export interface AuthUserUbicacionIds {
  headquartersId: string | null
  subHeadquartersId: string | null
}

function readStringFromRecord(
  record: Record<string, unknown>,
  keys: ReadonlyArray<string>
): string | null {
  for (const key of keys) {
    const raw = record[key]
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim()
    }
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return String(raw)
    }
  }
  return null
}

function readFirstIdFromArray(
  record: Record<string, unknown>,
  keys: ReadonlyArray<string>
): string | null {
  for (const key of keys) {
    const raw = record[key]
    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0]
      if (typeof first === 'string' && first.trim()) return first.trim()
      if (typeof first === 'number' && Number.isFinite(first)) return String(first)
      if (first && typeof first === 'object') {
        const nested = readStringFromRecord(first as Record<string, unknown>, ['id'])
        if (nested) return nested
      }
    }
  }
  return null
}

function extractRecords(rawData: unknown): Record<string, unknown>[] {
  if (!rawData) return []
  if (Array.isArray(rawData)) {
    return rawData.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item && typeof item === 'object')
    )
  }
  if (typeof rawData === 'object') {
    const obj = rawData as Record<string, unknown>
    if (Array.isArray(obj.data)) {
      return obj.data.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item && typeof item === 'object')
      )
    }
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return [obj.data as Record<string, unknown>]
    }
    return [obj]
  }
  return []
}

function extractHttpStatus(error: unknown): number {
  if (axios.isAxiosError(error)) {
    if (error.response?.status) return error.response.status
    if (error.code === 'ECONNABORTED') return 408
  }
  return 500
}

function mapHeadquarterRecord(
  record: Record<string, unknown>,
  fallbackId?: string
): EdificioSedeInfo | null {
  if (typeof record.name !== 'string' || !record.name.trim()) return null
  return {
    id: String(record.id ?? fallbackId ?? record.name),
    name: record.name.trim(),
    address: typeof record.address === 'string' ? record.address : undefined,
    city: typeof record.city === 'string' ? record.city : undefined,
    phone: typeof record.phone === 'string' ? record.phone : undefined,
    status: typeof record.status === 'string' ? record.status : undefined,
  }
}

function mapSubHeadquarterRecord(
  record: Record<string, unknown>
): EdificioSubSedeInfo | null {
  if (typeof record.name !== 'string' || !record.name.trim()) return null
  return {
    id: String(record.id ?? record.name),
    headquarter_id:
      typeof record.headquarter_id === 'string'
        ? record.headquarter_id
        : typeof record.headquarters_id === 'string'
          ? record.headquarters_id
          : undefined,
    name: record.name.trim(),
    address: typeof record.address === 'string' ? record.address : undefined,
    phone: typeof record.phone === 'string' ? record.phone : undefined,
    status: typeof record.status === 'string' ? record.status : undefined,
  }
}

/**
 * Lee `headquarters_id` y `sub_headquarters_id` del JSON `auth_user` en `localStorage`.
 */
export function readAuthUserUbicacionIds(): AuthUserUbicacionIds {
  try {
    const authUser = readAuthUser()
    if (!authUser) {
      return { headquartersId: null, subHeadquartersId: null }
    }

    const nestedCandidate =
      (authUser.user && typeof authUser.user === 'object'
        ? (authUser.user as Record<string, unknown>)
        : null) ??
      (authUser.data && typeof authUser.data === 'object'
        ? (authUser.data as Record<string, unknown>)
        : null)

    const sources = nestedCandidate ? [authUser, nestedCandidate] : [authUser]

    let headquartersId: string | null = null
    let subHeadquartersId: string | null = null

    for (const source of sources) {
      headquartersId ??=
        readStringFromRecord(source, [
          'headquarters_id',
          'headquarter_id',
          'headquartersId',
          'headquarterId',
        ]) ??
        readFirstIdFromArray(source, ['headquarters_ids', 'headquarters'])

      subHeadquartersId ??=
        readStringFromRecord(source, [
          'sub_headquarters_id',
          'sub_headquarter_id',
          'subHeadquartersId',
          'subHeadquarterId',
        ]) ??
        readFirstIdFromArray(source, ['sub_headquarters_ids', 'subHeadquarters'])
    }

    return { headquartersId, subHeadquartersId }
  } catch (error) {
    console.error('Error al leer ubicación desde auth_user:', error)
    return { headquartersId: null, subHeadquartersId: null }
  }
}

/**
 * Consulta la sede específica en `GET /headquarters/{id}` con balanceo de carga
 * (`executeBalancedRequest`) y validación de status code (`validateStatusCode`).
 */
export async function fetchHeadquarterById(headquartersId: string): Promise<{
  headquarter: EdificioSedeInfo | null
  validation: StatusCodeValidationResult
}> {
  const cleanId = headquartersId.trim()
  if (!cleanId) {
    return { headquarter: null, validation: validateStatusCode(400) }
  }

  try {
    const response = await executeBalancedRequest(
      () =>
        api.get<unknown>(`/headquarters/${encodeURIComponent(cleanId)}`, {
          validateStatus: () => true,
        }),
      { maxRetries: 2 }
    )
    const validation = validateStatusCode(response.status)
    if (!validation.isValid || !response.data) {
      return { headquarter: null, validation }
    }

    const mapped = extractRecords(response.data)
      .map((item) => mapHeadquarterRecord(item, cleanId))
      .find((item): item is EdificioSedeInfo => Boolean(item))

    return { headquarter: mapped ?? null, validation }
  } catch (error) {
    return {
      headquarter: null,
      validation: validateStatusCode(extractHttpStatus(error)),
    }
  }
}

/**
 * Consulta el catálogo completo de sedes en `GET /headquarters` con balanceo y validación.
 */
export async function fetchAllHeadquarters(): Promise<{
  headquarters: EdificioSedeInfo[]
  validation: StatusCodeValidationResult
}> {
  try {
    const response = await executeBalancedRequest(
      () => api.get<unknown>('/headquarters', { validateStatus: () => true }),
      { maxRetries: 2 }
    )
    const validation = validateStatusCode(response.status)
    if (!validation.isValid || !response.data) {
      return { headquarters: [], validation }
    }

    const headquarters = extractRecords(response.data)
      .map((item) => mapHeadquarterRecord(item))
      .filter((item): item is EdificioSedeInfo => Boolean(item))

    return { headquarters, validation }
  } catch (error) {
    return {
      headquarters: [],
      validation: validateStatusCode(extractHttpStatus(error)),
    }
  }
}

/**
 * Consulta sub-sedes en `GET /sub-headquarters/by-headquarter/{id_headquarters}`
 * aceptando tanto un objeto único como un arreglo de sub-sedes.
 */
export async function fetchSubHeadquartersByHeadquarter(
  headquarterId: string
): Promise<{
  subHeadquarters: EdificioSubSedeInfo[]
  validation: StatusCodeValidationResult
}> {
  const cleanId = headquarterId.trim()
  if (!cleanId) {
    return { subHeadquarters: [], validation: validateStatusCode(200) }
  }

  try {
    const response = await executeBalancedRequest(
      () =>
        api.get<unknown>(
          `/sub-headquarters/by-headquarter/${encodeURIComponent(cleanId)}`,
          { validateStatus: () => true }
        ),
      { maxRetries: 2 }
    )
    const validation = validateStatusCode(response.status)
    if (!validation.isValid || !response.data) {
      return { subHeadquarters: [], validation }
    }

    const subHeadquarters = extractRecords(response.data)
      .map(mapSubHeadquarterRecord)
      .filter((item): item is EdificioSubSedeInfo => Boolean(item))

    return { subHeadquarters, validation }
  } catch (error) {
    return {
      subHeadquarters: [],
      validation: validateStatusCode(extractHttpStatus(error)),
    }
  }
}
