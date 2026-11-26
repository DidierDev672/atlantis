import axios from 'axios'
import { readAuthUser } from '../../../shared/auth-storage'

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
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  }
  return null
}

function readFirstIdFromArray(
  record: Record<string, unknown>,
  keys: ReadonlyArray<string>
): string | null {
  for (const key of keys) {
    const raw = record[key]
    if (!Array.isArray(raw) || raw.length === 0) continue
    const first = raw[0]
    if (typeof first === 'string' && first.trim()) return first.trim()
    if (typeof first === 'number' && Number.isFinite(first)) return String(first)
    if (first && typeof first === 'object') {
      const nested = readStringFromRecord(first as Record<string, unknown>, ['id'])
      if (nested) return nested
    }
  }
  return null
}

export function extractRecords(rawData: unknown): Record<string, unknown>[] {
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

export function extractHttpStatus(error: unknown): number {
  if (axios.isAxiosError(error)) {
    if (error.response?.status) return error.response.status
    if (error.code === 'ECONNABORTED') return 408
  }
  return 500
}

export function mapHeadquarterRecord(
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

export function mapSubHeadquarterRecord(
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
        ]) ?? readFirstIdFromArray(source, ['headquarters_ids', 'headquarters'])

      subHeadquartersId ??=
        readStringFromRecord(source, [
          'sub_headquarters_id',
          'sub_headquarter_id',
          'subHeadquartersId',
          'subHeadquarterId',
        ]) ?? readFirstIdFromArray(source, ['sub_headquarters_ids', 'subHeadquarters'])
    }

    return { headquartersId, subHeadquartersId }
  } catch (error) {
    console.error('Error al leer ubicación desde auth_user:', error)
    return { headquartersId: null, subHeadquartersId: null }
  }
}
