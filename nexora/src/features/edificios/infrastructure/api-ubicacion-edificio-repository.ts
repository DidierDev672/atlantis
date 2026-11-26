import { api } from '../../../lib/api'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  extractHttpStatus,
  extractRecords,
  mapHeadquarterRecord,
  mapSubHeadquarterRecord,
  readAuthUserUbicacionIds,
  type AuthUserUbicacionIds,
  type EdificioSedeInfo,
  type EdificioSubSedeInfo,
} from './ubicacion-edificio-mappers'

export {
  readAuthUserUbicacionIds,
  type AuthUserUbicacionIds,
  type EdificioSedeInfo,
  type EdificioSubSedeInfo,
}

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
