import { isAxiosError } from 'axios'
import { api } from '../../../lib/api'
import { readAuthUser } from '../../../shared/auth-storage'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import type { EdificioOption } from '../application/use-edificio-floors'

export interface AuthUserEdificioIds {
  buildingId: string | null
  buildingName: string | null
  headquartersId: string | null
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

function readNestedBuildingField(
  record: Record<string, unknown>,
  field: 'id' | 'name'
): string | null {
  const nested = record.building ?? record.edificio
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return null
  return readStringFromRecord(nested as Record<string, unknown>, [
    field,
    field === 'name' ? 'nombre' : 'building_id',
  ])
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

function mapBuildingRecord(
  record: Record<string, unknown>,
  fallbackId?: string
): EdificioOption | null {
  if (typeof record.name !== 'string' || !record.name.trim()) return null
  const floorNum =
    typeof record.floor_number === 'number' && record.floor_number > 0
      ? record.floor_number
      : undefined
  return {
    value: String(record.id ?? fallbackId ?? record.name),
    label: record.name.trim(),
    floorNumber: floorNum,
  }
}

/**
 * Lee los identificadores de edificio (`building_id`, `building_name` y `headquarters_id`)
 * desde `localStorage.getItem('auth_user')`.
 */
export function readAuthUserEdificioIds(): AuthUserEdificioIds {
  try {
    const authUser = readAuthUser()
    if (!authUser) {
      return { buildingId: null, buildingName: null, headquartersId: null }
    }

    const nestedCandidate =
      (authUser.user && typeof authUser.user === 'object'
        ? (authUser.user as Record<string, unknown>)
        : null) ??
      (authUser.data && typeof authUser.data === 'object'
        ? (authUser.data as Record<string, unknown>)
        : null)

    const sources = nestedCandidate ? [authUser, nestedCandidate] : [authUser]

    let buildingId: string | null = null
    let buildingName: string | null = null
    let headquartersId: string | null = null

    for (const source of sources) {
      buildingId ??=
        readStringFromRecord(source, ['building_id', 'buildingId', 'edificio_id']) ??
        readNestedBuildingField(source, 'id')

      buildingName ??=
        readStringFromRecord(source, [
          'building_name',
          'buildingName',
          'edificio_nombre',
          'nombre_edificio',
        ]) ?? readNestedBuildingField(source, 'name')

      headquartersId ??= readStringFromRecord(source, [
        'headquarters_id',
        'headquarter_id',
        'headquartersId',
        'headquarterId',
      ])
    }

    return { buildingId, buildingName, headquartersId }
  } catch (err) {
    console.error('Error al leer edificio desde auth_user:', err)
    return { buildingId: null, buildingName: null, headquartersId: null }
  }
}

/**
 * Consulta el edificio asignado al recepcionista mediante balanceo de carga
 * y validación de códigos HTTP.
 */
export async function fetchDetectedBuildingFromAuthUser(): Promise<{
  building: EdificioOption | null
  buildingNameHint: string | null
  validation: StatusCodeValidationResult | null
}> {
  const { buildingId, buildingName, headquartersId } = readAuthUserEdificioIds()

  if (!buildingId && !headquartersId) {
    return {
      building: null,
      buildingNameHint: buildingName,
      validation: null,
    }
  }

  const endpoint = buildingId
    ? `/building/${encodeURIComponent(buildingId)}`
    : `/building?headquarters_id=${encodeURIComponent(headquartersId!)}`

  try {
    const response = await executeBalancedRequest(
      () => api.get<unknown>(endpoint, { validateStatus: () => true }),
      { maxRetries: 2 }
    )
    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      const mapped = extractRecords(response.data)
        .map((item) => mapBuildingRecord(item, buildingId ?? undefined))
        .find((item): item is EdificioOption => Boolean(item))

      if (mapped) {
        return { building: mapped, buildingNameHint: buildingName, validation }
      }
    }

    if (buildingId && buildingName) {
      return {
        building: { value: buildingId, label: buildingName },
        buildingNameHint: buildingName,
        validation: validation.isValid ? null : validation,
      }
    }

    return {
      building: null,
      buildingNameHint: buildingName,
      validation: validation.isValid ? null : validation,
    }
  } catch (err) {
    const status = isAxiosError(err) ? (err.response?.status ?? 0) : 0
    return {
      building:
        buildingId && buildingName
          ? { value: buildingId, label: buildingName }
          : null,
      buildingNameHint: buildingName,
      validation: validateStatusCode(status),
    }
  }
}
