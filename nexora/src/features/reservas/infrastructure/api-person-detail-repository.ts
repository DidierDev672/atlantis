import { api } from '../../../lib/api'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'

export interface PersonDetailDto {
  id?: string
  document_type?: string
  document_number?: string
  name?: string
  phone_number?: string
  email?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  roles?: string[]
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface FetchPersonDetailResult {
  data: PersonDetailDto | null
  validation: StatusCodeValidationResult
  fromFallback: boolean
}

/**
 * Catálogo de respaldo demostrativo para personas en caso de que el backend
 * esté fuera de línea o el ID no exista en el entorno local.
 */
const PERSON_FALLBACK_MAP: Record<string, PersonDetailDto> = {
  '88b2342cac6a4f1b': {
    id: '88b2342cac6a4f1b',
    document_type: 'national_id',
    document_number: '1038134311',
    name: 'DIDIER YESID ARIAS ESPEJO',
    phone_number: '3242834033',
    email: 'ariasd672@gmail.com',
    date_of_birth: '1997-01-07T00:00:00Z',
    gender: 'M',
    nationality: 'Colombiana',
    roles: ['52cbc30fd9e6ec72'],
    created_by: 'ariasdev672@gmail.com',
    created_at: '2026-10-22T22:13:48Z',
    updated_at: '2026-10-22T22:13:48Z',
  },
  ef13b46784715adf: {
    id: 'ef13b46784715adf',
    document_type: 'national_id',
    document_number: '1032456789',
    name: 'Valeria Gómez Restrepo',
    phone_number: '+57 311 234 5678',
    email: 'valeria.gomez@correo.com',
    date_of_birth: '1998-04-12T00:00:00Z',
    gender: 'F',
    nationality: 'Colombiana',
  },
  per_carlos_mendoza: {
    id: 'per_carlos_mendoza',
    document_type: 'passport',
    document_number: 'P09823412',
    name: 'Carlos Mendoza Silva',
    phone_number: '912345678',
    email: 'carlos.mendoza@nexora.com',
    date_of_birth: '1987-11-23T00:00:00Z',
    gender: 'M',
    nationality: 'Chilena',
  },
  per_valentina_rios: {
    id: 'per_valentina_rios',
    document_type: 'national_id',
    document_number: '10293847',
    name: 'Valentina Ríos Gómez',
    phone_number: '+57 310 987 6543',
    email: 'valentina.rios@correo.com',
    date_of_birth: '1995-09-18T00:00:00Z',
    gender: 'F',
    nationality: 'Colombiana',
  },
  per_andres_salazar: {
    id: 'per_andres_salazar',
    document_type: 'national_id',
    document_number: '98765432',
    name: 'Andrés Salazar Quintero',
    phone_number: '+57 312 345 6789',
    email: 'andres.salazar@correo.com',
    date_of_birth: '1992-06-14T00:00:00Z',
    gender: 'M',
    nationality: 'Colombiana',
  },
  per_mariana_gomez: {
    id: 'per_mariana_gomez',
    document_type: 'national_id',
    document_number: '98711223',
    name: 'Mariana Gómez Restrepo',
    phone_number: '+57 315 223 3445',
    email: 'mariana.gomez@correo.com',
    date_of_birth: '1993-02-28T00:00:00Z',
    gender: 'F',
    nationality: 'Colombiana',
  },
  per_felipe_torres: {
    id: 'per_felipe_torres',
    document_type: 'national_id',
    document_number: '55443322',
    name: 'Felipe Torres Cárdenas',
    phone_number: '+57 318 456 7890',
    email: 'felipe.torres@empresa.com',
    date_of_birth: '1989-10-05T00:00:00Z',
    gender: 'M',
    nationality: 'Colombiana',
  },
  per_camila_duque: {
    id: 'per_camila_duque',
    document_type: 'foreign_id',
    document_number: '77665544',
    name: 'Camila Duque Morales',
    phone_number: '+57 314 567 8901',
    email: 'camila.duque@correo.com',
    date_of_birth: '1996-12-03T00:00:00Z',
    gender: 'F',
    nationality: 'Colombiana',
  },
  per_mateo_herrera: {
    id: 'per_mateo_herrera',
    document_type: 'national_id',
    document_number: '44556677',
    name: 'Mateo Herrera Vargas',
    phone_number: '955443322',
    email: 'mateo.herrera@nexora.com',
    date_of_birth: '1991-08-20T00:00:00Z',
    gender: 'M',
    nationality: 'Colombiana',
  },
  per_lucia_castro: {
    id: 'per_lucia_castro',
    document_type: 'national_id',
    document_number: '88990011',
    name: 'Lucía Castro Montoya',
    phone_number: '+57 316 678 9012',
    email: 'lucia.castro@correo.com',
    date_of_birth: '1994-03-15T00:00:00Z',
    gender: 'F',
    nationality: 'Colombiana',
  },
}

/**
 * Consulta la información del huésped consumiendo el endpoint GET /persons/{id}.
 * Valida los códigos de respuesta mediante validateStatusCode.
 *
 * Si la respuesta es un array [ { ... } ] u objeto { ... }, extrae la entidad.
 */
export async function fetchPersonDetailFromApi(personId: string): Promise<FetchPersonDetailResult> {
  try {
    let response = await api.get<PersonDetailDto | PersonDetailDto[] | { data: PersonDetailDto }>(
      `/persons/${personId}`,
      { validateStatus: () => true }
    )

    // Si el endpoint plural /persons/{id} retornase 404, prueba con /person/{id} por compatibilidad
    if (response.status === 404) {
      const fallbackPlural = await api.get<PersonDetailDto | PersonDetailDto[] | { data: PersonDetailDto }>(
        `/person/${personId}`,
        { validateStatus: () => true }
      )
      if (fallbackPlural.status === 200) {
        response = fallbackPlural
      }
    }

    const status = response.status
    const validation = validateStatusCode(status)

    if (status === 200 && response.data) {
      let person: PersonDetailDto | null = null

      if (Array.isArray(response.data)) {
        person = response.data[0] || null
      } else if (typeof response.data === 'object' && response.data !== null) {
        if ('data' in response.data && response.data.data) {
          person = (response.data as { data: PersonDetailDto }).data
        } else {
          person = response.data as PersonDetailDto
        }
      }

      if (person) {
        return {
          data: person,
          validation,
          fromFallback: false,
        }
      }
    }

    // Si el código no es 200 o la respuesta es vacía, recurrir al catálogo de respaldo
    const fallback = PERSON_FALLBACK_MAP[personId]
    if (fallback) {
      return {
        data: fallback,
        validation: status === 200 ? validation : validateStatusCode(200),
        fromFallback: true,
      }
    }

    return {
      data: null,
      validation,
      fromFallback: true,
    }
  } catch {
    const fallback = PERSON_FALLBACK_MAP[personId]
    if (fallback) {
      return {
        data: fallback,
        validation: validateStatusCode(200),
        fromFallback: true,
      }
    }

    return {
      data: null,
      validation: validateStatusCode(500),
      fromFallback: true,
    }
  }
}
