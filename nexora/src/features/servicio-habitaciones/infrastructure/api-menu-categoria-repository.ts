import axios from 'axios'
import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import type { MenuCategoria } from '../domain/menu-categoria'
import {
  getMenuCategoriasCache,
  setMenuCategoriasCache,
} from './catalogo-productos-cache'
import { detectarPerfilRedDisponible } from './network-quality'

/**
 * Catálogo de respaldo gastronómico de alta calidad (fallback)
 * para garantizar continuidad visual si el backend local no está levantado.
 */
export const FALLBACK_MENU_CATEGORIAS: MenuCategoria[] = [
  {
    headquartes_id: '857476d852c2d215',
    sub_headquartes_id: '3964a679462f9efc',
    building_id: '161ecb4a52a33a52',
    name: 'Panadería y Repostería',
    description:
      'Croissants, pan artesanal, tortas, galletas y postres horneados cada día, para disfrutar en la cafetería o en la mesa del restaurante.',
    order: 24,
    asset:
      'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_by: 'ariasdev672@gmail.com',
  },
  {
    headquartes_id: '857476d852c2d215',
    sub_headquartes_id: '3964a679462f9efc',
    building_id: '161ecb4a52a33a52',
    name: 'Bebidas y Coctelería de Autor',
    description:
      'Selección de cocteles de autor, vinos reserva, licores prémium y bebidas refrescantes con entrega directa a la habitación.',
    order: 17,
    asset:
      'https://images.pexels.com/photos/3136318/pexels-photo-3136318.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_by: 'ariasdev672@gmail.com',
  },
  {
    headquartes_id: '857476d852c2d215',
    sub_headquartes_id: 'sub-2',
    building_id: '161ecb4a52a33a52',
    name: 'Desayunos Ejecutivos & Healthy',
    description:
      'Omelettes al gusto, frutas de estación, yogurt griego, tostadas integrales y café recién tostado para empezar la jornada.',
    order: 12,
    asset:
      'https://images.pexels.com/photos/101533/pexels-photo-101533.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_by: 'ariasdev672@gmail.com',
  },
  {
    headquartes_id: '857476d852c2d215',
    sub_headquartes_id: '3964a679462f9efc',
    building_id: 'building-2',
    name: 'Cenas Gourmet & Alta Cocina',
    description:
      'Cortes de carne madurados, pastas caseras, risottos al funghi y maridajes exclusivos diseñados por el chef ejecutivo.',
    order: 35,
    asset:
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_by: 'ariasdev672@gmail.com',
  },
]

export interface ObtenerMenuCategoriasRespuesta {
  categorias: MenuCategoria[]
  validation: StatusCodeValidationResult
  usandoFallback: boolean
}

export interface ObtenerMenuCategoriaPorIdRespuesta {
  categoria: MenuCategoria | null
  validation: StatusCodeValidationResult
}

const DEFAULT_CATEGORY_ASSET =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800'

/**
 * Normaliza un objeto crudo de categoría devuelto por `/menu-category` o `/menu-category/{id}`
 * hacia el modelo de dominio `MenuCategoria`.
 */
function mapRawMenuCategoria(raw: Record<string, unknown>): MenuCategoria {
  const rawOrder = Number(raw.order)
  const rawId = raw.id ?? raw._id

  return {
    id: rawId ? String(rawId) : undefined,
    headquartes_id: String(raw.headquartes_id ?? raw.headquarter_id ?? '857476d852c2d215'),
    sub_headquartes_id: String(
      raw.sub_headquartes_id ?? raw.sub_headquarter_id ?? '3964a679462f9efc'
    ),
    building_id: String(raw.building_id ?? '161ecb4a52a33a52'),
    name: String(raw.name ?? 'Categoría de Servicio'),
    description: String(raw.description ?? ''),
    order: Number.isFinite(rawOrder) ? rawOrder : 1,
    asset: String(raw.asset || DEFAULT_CATEGORY_ASSET),
    created_by: raw.created_by ? String(raw.created_by) : undefined,
  }
}

/**
 * Extrae el registro HTTP de error de Axios y lo traduce con `validateStatusCode`.
 */
function resolveAxiosErrorValidation(error: unknown): StatusCodeValidationResult {
  let status = 500
  if (axios.isAxiosError(error) && error.response?.status) {
    status = error.response.status
  } else if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
    status = 408
  }
  return validateStatusCode(status)
}

let inFlightMenuCategoriasRequest: Promise<ObtenerMenuCategoriasRespuesta> | null = null

/**
 * Consulta el endpoint GET /menu-category con deduplicación en vuelo, caché compartida en memoria
 * y validación de códigos HTTP.
 */
export async function obtenerMenuCategoriasApi(
  options?: { forceRefresh?: boolean }
): Promise<ObtenerMenuCategoriasRespuesta> {
  if (!options?.forceRefresh) {
    const cached = getMenuCategoriasCache()
    if (cached && cached.categorias.length > 0) {
      return {
        categorias: cached.categorias,
        validation: cached.validation ?? validateStatusCode(200),
        usandoFallback: cached.usandoFallback,
      }
    }
    if (!detectarPerfilRedDisponible().online) {
      return {
        categorias: cached?.categorias ?? [],
        validation: validateStatusCode(503),
        usandoFallback: false,
      }
    }
    if (inFlightMenuCategoriasRequest) {
      return inFlightMenuCategoriasRequest
    }
  }

  const req = (async (): Promise<ObtenerMenuCategoriasRespuesta> => {
    try {
      const response = await executeBalancedRequest(() =>
        api.get('/menu-category', {
          skipAuth: true,
          validateStatus: () => true,
        })
      )

      const validation = validateStatusCode(response.status)

      if (validation.isValid && response.data) {
        let itemsCrudos: unknown[] = []

        if (Array.isArray(response.data)) {
          itemsCrudos = response.data
        } else if (response.data && typeof response.data === 'object') {
          const payload = response.data as Record<string, unknown>
          if (Array.isArray(payload.data)) {
            itemsCrudos = payload.data
          } else if (Array.isArray(payload.categories)) {
            itemsCrudos = payload.categories
          } else if (Array.isArray(payload.items)) {
            itemsCrudos = payload.items
          }
        }

        if (itemsCrudos.length > 0) {
          const categoriasMapeadas: MenuCategoria[] = itemsCrudos.map((item) =>
            mapRawMenuCategoria(
              (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
            )
          )

          setMenuCategoriasCache({
            categorias: categoriasMapeadas,
            validation,
            usandoFallback: false,
          })

          return {
            categorias: categoriasMapeadas,
            validation,
            usandoFallback: false,
          }
        }
      }

      return {
        categorias: [],
        validation,
        usandoFallback: false,
      }
    } catch (error) {
      return {
        categorias: [],
        validation: resolveAxiosErrorValidation(error),
        usandoFallback: false,
      }
    } finally {
      inFlightMenuCategoriasRequest = null
    }
  })()

  inFlightMenuCategoriasRequest = req
  return req
}

/**
 * Consulta una categoría puntual en `GET /menu-category/{id}` con balanceo de carga
 * (`executeBalancedRequest`) y validación de códigos de estado (`validateStatusCode`).
 */
export async function obtenerMenuCategoriaPorIdApi(
  categoryId: string
): Promise<ObtenerMenuCategoriaPorIdRespuesta> {
  const cleanId = categoryId.trim()
  if (!cleanId) {
    return {
      categoria: null,
      validation: validateStatusCode(400),
    }
  }

  try {
    const response = await executeBalancedRequest(() =>
      api.get(`/menu-category/${encodeURIComponent(cleanId)}`, {
        skipAuth: true,
        validateStatus: () => true,
      })
    )

    const validation = validateStatusCode(response.status)

    if (validation.isValid && response.data) {
      let raw: Record<string, unknown> | null = null

      if (Array.isArray(response.data) && response.data.length > 0) {
        raw = response.data[0] as Record<string, unknown>
      } else if (response.data && typeof response.data === 'object') {
        const obj = response.data as Record<string, unknown>
        if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
          raw = obj.data as Record<string, unknown>
        } else if (Array.isArray(obj.data) && obj.data.length > 0) {
          raw = obj.data[0] as Record<string, unknown>
        } else {
          raw = obj
        }
      }

      if (raw && typeof raw === 'object' && typeof raw.name === 'string' && raw.name.trim()) {
        return {
          categoria: mapRawMenuCategoria(raw),
          validation,
        }
      }
    }

    return {
      categoria: null,
      validation,
    }
  } catch (error) {
    return {
      categoria: null,
      validation: resolveAxiosErrorValidation(error),
    }
  }
}
