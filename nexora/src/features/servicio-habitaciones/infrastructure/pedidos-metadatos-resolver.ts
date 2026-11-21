import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import type { ServiceRequestOrder } from '../domain/pedidos-servicio-habitacion'

export interface PersonaBasicaPedido {
  id: string
  name: string
  document_type?: string
  document_number?: string
  phone_number?: string
  email?: string
  nationality?: string
}

interface PersonApi {
  id?: string
  _id?: string
  name?: string
  document_type?: string
  document_number?: string
  phone_number?: string
  email?: string
  nationality?: string
}

interface ItemMenuLookupApi {
  id?: string
  _id?: string
  category_id?: string
  imageURL?: string
  image_url?: string
}

interface MenuCategoryLookupApi {
  id?: string
  _id?: string
  headquartes_id?: string
  name?: string
}

const MAX_CONCURRENT_PERSON_REQUESTS = 4
const personNameCache = new Map<string, string>()
const personDetailCache = new Map<string, PersonaBasicaPedido>()
const personDetailInFlight = new Map<string, Promise<PersonaBasicaPedido | null>>()

let itemMenuCategoriaMapCache: Map<string, string> | null = null
let itemMenuImagenMapCache: Map<string, string> | null = null
let itemMenuCatalogInFlight: Promise<{
  categoriaMap: Map<string, string>
  imagenMap: Map<string, string>
}> | null = null

function extraerLista<T>(raw: unknown, extraKeys: string[] = []): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const key of ['data', ...extraKeys]) {
      const val = obj[key]
      if (Array.isArray(val)) return val as T[]
      if (val && typeof val === 'object') return [val as T]
    }
    if ('id' in obj || '_id' in obj || 'name' in obj || 'category_id' in obj) {
      return [raw as T]
    }
  }
  return []
}

function guardarDetallePersonaEnCache(
  personId: string,
  raw: PersonApi,
): PersonaBasicaPedido | null {
  const nombre = raw.name?.trim()
  if (!nombre) return null

  const detalle: PersonaBasicaPedido = {
    id: raw.id || raw._id || personId,
    name: nombre,
    document_type: raw.document_type,
    document_number: raw.document_number,
    phone_number: raw.phone_number,
    email: raw.email,
    nationality: raw.nationality,
  }
  personNameCache.set(personId, nombre)
  personDetailCache.set(personId, detalle)
  return detalle
}

/**
 * Resuelve la información básica de un huésped por ID usando caché compartida
 * (`/person/{id}` con respaldo `/persons/{id}`).
 */
export async function resolverDetalleHuespedPorId(
  personId: string,
): Promise<PersonaBasicaPedido | null> {
  const cleanId = personId.trim()
  if (!cleanId) return null

  const cached = personDetailCache.get(cleanId)
  if (cached) return cached

  const inFlight = personDetailInFlight.get(cleanId)
  if (inFlight) return inFlight

  const req = (async (): Promise<PersonaBasicaPedido | null> => {
    try {
      const resPrimary = await executeBalancedRequest(() =>
        api.get<PersonApi | { data?: PersonApi }>(
          `/person/${encodeURIComponent(cleanId)}`,
          { validateStatus: () => true },
        ),
      )
      if (validateStatusCode(resPrimary.status).isValid) {
        const [persona] = extraerLista<PersonApi>(resPrimary.data)
        if (persona) {
          const parsed = guardarDetallePersonaEnCache(cleanId, persona)
          if (parsed) return parsed
        }
      }

      const resFallback = await executeBalancedRequest(() =>
        api.get<PersonApi | { data?: PersonApi }>(
          `/persons/${encodeURIComponent(cleanId)}`,
          { validateStatus: () => true },
        ),
      )
      if (validateStatusCode(resFallback.status).isValid) {
        const [persona] = extraerLista<PersonApi>(resFallback.data)
        if (persona) {
          const parsed = guardarDetallePersonaEnCache(cleanId, persona)
          if (parsed) return parsed
        }
      }
    } catch (error) {
      console.error(`Error al consultar huésped (${cleanId}):`, error)
    } finally {
      personDetailInFlight.delete(cleanId)
    }

    return null
  })()

  personDetailInFlight.set(cleanId, req)
  return req
}

/**
 * Resuelve nombres de huéspedes en paralelo con pool de concurrencia limitada y caché compartida.
 */
export async function resolverNombresHuespedesPedidos(
  pedidos: ReadonlyArray<ServiceRequestOrder>,
): Promise<Map<string, string>> {
  const faltantes = Array.from(
    new Set(
      pedidos
        .map((p) => p.person_id?.trim())
        .filter((id): id is string => Boolean(id) && !personNameCache.has(id)),
    ),
  )

  if (faltantes.length > 0) {
    let cursor = 0
    const workersCount = Math.min(MAX_CONCURRENT_PERSON_REQUESTS, faltantes.length)
    await Promise.all(
      Array.from({ length: workersCount }, async () => {
        while (cursor < faltantes.length) {
          const targetId = faltantes[cursor++]
          if (targetId) {
            await resolverDetalleHuespedPorId(targetId)
          }
        }
      }),
    )
  }

  return new Map(personNameCache)
}

async function fetchCatalogoItemCategoriaEImagenes(): Promise<{
  categoriaMap: Map<string, string>
  imagenMap: Map<string, string>
}> {
  if (itemMenuCategoriaMapCache && itemMenuImagenMapCache) {
    return {
      categoriaMap: itemMenuCategoriaMapCache,
      imagenMap: itemMenuImagenMapCache,
    }
  }
  if (itemMenuCatalogInFlight) {
    return itemMenuCatalogInFlight
  }

  itemMenuCatalogInFlight = (async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        executeBalancedRequest(() =>
          api.get<ItemMenuLookupApi[] | { data?: ItemMenuLookupApi[] }>('/item-menu', {
            skipAuth: true,
            validateStatus: () => true,
          }),
        ),
        executeBalancedRequest(() =>
          api.get<MenuCategoryLookupApi[] | { data?: MenuCategoryLookupApi[] }>(
            '/menu-category',
            { skipAuth: true, validateStatus: () => true },
          ),
        ),
      ])

      const items = validateStatusCode(itemsRes.status).isValid
        ? extraerLista<ItemMenuLookupApi>(itemsRes.data, ['items', 'results'])
        : []
      const categories = validateStatusCode(catsRes.status).isValid
        ? extraerLista<MenuCategoryLookupApi>(catsRes.data, ['categories', 'items'])
        : []

      const catById = new Map<string, string>()
      for (const cat of categories) {
        const cid = cat.id ?? cat._id
        if (cid && cat.name) catById.set(cid, cat.name)
        if (cat.headquartes_id && cat.name && !catById.has(cat.headquartes_id)) {
          catById.set(cat.headquartes_id, cat.name)
        }
      }

      const categoriaMap = new Map<string, string>()
      const imagenMap = new Map<string, string>()

      for (const item of items) {
        const itemId = item.id ?? item._id
        if (!itemId) continue

        if (item.category_id) {
          const nombreCat = catById.get(item.category_id)
          if (nombreCat) categoriaMap.set(itemId, nombreCat)
        }

        const rawImg = (item.imageURL || item.image_url || '').trim()
        if (rawImg) {
          imagenMap.set(itemId, rawImg)
        }
      }

      if (categoriaMap.size > 0) itemMenuCategoriaMapCache = categoriaMap
      if (imagenMap.size > 0) itemMenuImagenMapCache = imagenMap

      return { categoriaMap, imagenMap }
    } catch (error) {
      console.error('Error al resolver catálogo de categorías e imágenes:', error)
      return {
        categoriaMap: new Map<string, string>(),
        imagenMap: new Map<string, string>(),
      }
    } finally {
      itemMenuCatalogInFlight = null
    }
  })()

  return itemMenuCatalogInFlight
}

/**
 * Construye una única vez el mapa `item_menu_id -> nombreCategoría`.
 */
export async function resolverMapaItemCategoriaPedidos(): Promise<Map<string, string>> {
  const { categoriaMap } = await fetchCatalogoItemCategoriaEImagenes()
  return categoriaMap
}

/**
 * Devuelve el mapa cacheado `item_menu_id -> imageURL` para mostrar fotos en el detalle.
 */
export async function resolverMapaImagenesItemMenuPedidos(): Promise<Map<string, string>> {
  const { imagenMap } = await fetchCatalogoItemCategoriaEImagenes()
  return imagenMap
}

/**
 * Resuelve la etiqueta de categoría principal (y contador si hay varias) para una orden.
 */
export function construirEtiquetaCategoriaOrden(
  orden: ServiceRequestOrder,
  itemCategoriaMap: ReadonlyMap<string, string>,
): string {
  const categorias = new Set<string>()
  for (const item of orden.items ?? []) {
    const nombre = item.item_menu_id ? itemCategoriaMap.get(item.item_menu_id) : undefined
    if (nombre) categorias.add(nombre)
  }

  if (categorias.size === 0) return 'Room Service'
  const lista = Array.from(categorias)
  return lista.length === 1 ? lista[0] : `${lista[0]} (+${lista.length - 1})`
}
