import { api } from '../../../lib/api'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import type { ApiRole } from '../domain/role-router'

/**
 * Roles de respaldo para desarrollo local o resiliencia cuando el backend no responda.
 * Coincide exactamente con el JSON proporcionado por la especificación.
 */
export const FALLBACK_ROLES: ApiRole[] = [
  {
    id: '8f38a62e411fe504',
    name: 'gerente_sede',
    description: 'Administra una sede y sus sub-sedes',
  },
  {
    id: '041d8c939fd15b07',
    name: 'recepcionista',
    description: 'Opera dentro de una sub-sede',
  },
  {
    id: '8fc0b42f88f8aede',
    name: 'admin-repro',
    description: '',
  },
  {
    id: 'bde7655f7b737f03',
    name: 'admin-repro-97a82aae4a75dfa2',
    description: '',
  },
  {
    id: '4f79c6d1d092fd57',
    name: 'verify-e2bdce71dd289e6c',
    description: '',
  },
  {
    id: 'b7690ea886a4e169',
    name: 'super_admin',
    description: 'Control total del sistema',
  },
  {
    id: 'd31b4705-d772-4703-9d67-9083f3acf38f',
    name: 'huesped',
    description: 'Persona que ocupan habitaciones',
  },
  {
    id: 'fa4a36a75927731d',
    name: 'admin',
    description: 'Administrador / Dueño del Hotel con control de infraestructura y personal',
  },
  {
    id: '910dc925870dc286',
    name: 'reception',
    description: 'Recepcionista operativo para check-in, check-out y atención de huéspedes',
  },
  {
    id: '99d32d1e9b8f336d',
    name: 'housekeeping',
    description: 'Personal de limpieza y camarería',
  },
  {
    id: '87c922d1528efffe',
    name: 'manager',
    description: 'Supervisor o gerente operativo de sede',
  },
  {
    id: '9d1f35ca827bb8de',
    name: 'guest',
    description: 'Huésped con acceso al portal de servicios',
  },
]

export interface FetchRolesResult {
  roles: ApiRole[]
  validation: StatusCodeValidationResult
  isFallback: boolean
}

/**
 * Consulta la lista de roles del sistema consumiendo el endpoint GET /roles con Axios.
 * Valida el status code retornado utilizando `validateStatusCode`.
 *
 * @returns Lista de roles, resultado de validación del status code e indicador de fallback.
 */
export async function fetchRoles(): Promise<FetchRolesResult> {
  try {
    // 1. Petición HTTP con Axios al endpoint /roles
    const response = await api.get<ApiRole[]>('/roles', {
      validateStatus: () => true, // Permite evaluar todos los códigos con status-code-validator
    })

    // 2. Validación del código de estado HTTP
    const validation = validateStatusCode(response.status)

    // 3. Si la respuesta es exitosa (2xx) y contiene un array de roles
    if (validation.isValid && Array.isArray(response.data) && response.data.length > 0) {
      return {
        roles: response.data,
        validation,
        isFallback: false,
      }
    }

    // Si el servidor respondió con error o vacío, retorna los datos de respaldo
    return {
      roles: FALLBACK_ROLES,
      validation,
      isFallback: true,
    }
  } catch {
    // Manejo seguro en caso de error de conexión de red
    const errValidation = validateStatusCode(500)
    return {
      roles: FALLBACK_ROLES,
      validation: errValidation,
      isFallback: true,
    }
  }
}

