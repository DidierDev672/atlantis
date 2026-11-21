import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import type { ServiceRequestOrder } from '../domain/pedidos-servicio-habitacion'
import { obtenerPersonsCatalogoShared } from './api-estadias-recepcion-repository'
import { requestProductosMenu } from './api-item-menu-repository'
import { obtenerMenuCategoriasApi } from './api-menu-categoria-repository'
import {
  getCatalogoProductosCache,
  getMenuCategoriasCache,
} from './catalogo-productos-cache'
import { detectarPerfilRedDisponible } from './network-quality'

export interface PersonaBasicaPedido {
  id: string
  name: string
  document_type?: string
  document_number?: string
  phone_number?: string
  email?: string
  nationality?: string
}

export interface CategoriaMenuPedidoInfo {
  name: string
  asset?: string
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

const personNameCache = new Map<string, string>()
const personDetailCache = new Map<string, PersonaBasicaPedido>()
const personDetailInFlight = new Map<string, Promise<PersonaBasicaPedido | null>>()
const failedPersonLookupAt = new Map<string, number>()

let itemMenuCategoriaMapCache: Map<string, string> | null = null
let itemMenuCategoriaDetailMapCache: Map<string, CategoriaMenuPedidoInfo> | null = null
let itemMenuImagenMapCache: Map<string, string> | null = null
let itemMenuCatalogUpdatedAt = 0
let itemMenuCatalogInFlight: Promise<{
  categoriaMap: Map<string, string>
  categoriaDetailMap: Map<string, CategoriaMenuPedidoInfo>
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

  const resolvedId = raw.id || raw._id || personId
  const detalle: PersonaBasicaPedido = {
    id: resolvedId,
    name: nombre,
    document_type: raw.document_type,
    document_number: raw.document_number,
    phone_number: raw.phone_number,
    email: raw.email,
    nationality: raw.nationality,
  }
  personNameCache.set(personId, nombre)
  personNameCache.set(resolvedId, nombre)
  personDetailCache.set(personId, detalle)
  personDetailCache.set(resolvedId, detalle)
  return detalle
}

export function getCachedPersonaBasicaPedido(
  personId?: string,
): PersonaBasicaPedido | null {
  if (!personId) return null
  return personDetailCache.get(personId.trim()) ?? null
}

/**
 * Sincroniza el caché de personas usando una sola consulta batch `/persons` compartida
 * para evitar el patrón N+1 (`/person/{id}` por cada huésped).
 */
async function hidratarPersonasDesdeBatch(): Promise<void> {
  try {
    const personsList = await obtenerPersonsCatalogoShared()
    for (const p of personsList) {
      if (p?.id && p.name) {
        guardarDetallePersonaEnCache(p.id, p)
      }
    }
  } catch {
    // Fallback controlado a búsqueda individual si el batch falla
  }
}

/**
 * Resuelve la información básica de un huésped por ID usando caché compartida
 * (revisa caché de batch `/persons`, luego `/person/{id}` y respaldo `/persons/{id}`).
 */
export async function resolverDetalleHuespedPorId(
  personId: string,
): Promise<PersonaBasicaPedido | null> {
  const cleanId = personId.trim()
  if (!cleanId) return null

  const cached = personDetailCache.get(cleanId)
  if (cached) return cached

  const networkProfile = detectarPerfilRedDisponible()
  const failedAt = failedPersonLookupAt.get(cleanId)
  if (failedAt && Date.now() - failedAt < networkProfile.cacheTtlMs) {
    return null
  }
  if (!networkProfile.online) {
    return null
  }

  const inFlight = personDetailInFlight.get(cleanId)
  if (inFlight) return inFlight

  const req = (async (): Promise<PersonaBasicaPedido | null> => {
    try {
      await hidratarPersonasDesdeBatch()
      const afterBatch = personDetailCache.get(cleanId)
      if (afterBatch) return afterBatch

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

      // Solo intenta /persons/{id} si /person/{id} devolvió 404/405 (evita doble fetch en errores transitorios)
      if (resPrimary.status === 404 || resPrimary.status === 405) {
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
      }

      failedPersonLookupAt.set(cleanId, Date.now())
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
 * Resuelve nombres de huéspedes primero por batch `/persons` y luego (si la red lo permite)
 * con pool limitado para IDs únicos faltantes.
 */
export async function resolverNombresHuespedesPedidos(
  pedidos: ReadonlyArray<ServiceRequestOrder>,
): Promise<Map<string, string>> {
  const networkProfile = detectarPerfilRedDisponible()

  try {
    const necesitaHidratar = pedidos.some(
      (p) => p.person_id?.trim() && !personNameCache.has(p.person_id.trim()),
    )
    if (necesitaHidratar && networkProfile.online) {
      await hidratarPersonasDesdeBatch()
    }

    if (!networkProfile.enableBackgroundMetadata || !networkProfile.online) {
      return new Map(personNameCache)
    }

    const faltantes = Array.from(
      new Set(
        pedidos
          .map((p) => p.person_id?.trim())
          .filter((id): id is string => {
            if (!id || personNameCache.has(id)) return false
            const failedAt = failedPersonLookupAt.get(id)
            return !failedAt || Date.now() - failedAt >= networkProfile.cacheTtlMs
          }),
      ),
    )

    if (faltantes.length > 0) {
      let cursor = 0
      const workersCount = Math.min(networkProfile.maxConcurrentRequests, faltantes.length)
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
  } catch (error) {
    console.error('Error en resolución por lote de huéspedes:', error)
  }

  return new Map(personNameCache)
}

function buildLookupMapsFromLists(
  items: ReadonlyArray<{
    id?: string
    category_id?: string
    imageURL?: string
    image_url?: string
  }>,
  categories: ReadonlyArray<{
    id?: string
    headquartes_id?: string
    name?: string
    asset?: string
  }>,
) {
  const catById = new Map<string, CategoriaMenuPedidoInfo>()
  for (const cat of categories) {
    if (!cat.name) continue
    const info: CategoriaMenuPedidoInfo = { name: cat.name, asset: cat.asset }
    if (cat.id) catById.set(cat.id, info)
    if (cat.headquartes_id && !catById.has(cat.headquartes_id)) {
      catById.set(cat.headquartes_id, info)
    }
  }

  const categoriaMap = new Map<string, string>()
  const categoriaDetailMap = new Map<string, CategoriaMenuPedidoInfo>()
  const imagenMap = new Map<string, string>()

  for (const item of items) {
    const itemId = item.id
    if (!itemId) continue

    if (item.category_id) {
      const infoCat = catById.get(item.category_id)
      if (infoCat) {
        categoriaMap.set(itemId, infoCat.name)
        categoriaDetailMap.set(itemId, infoCat)
      }
    }

    const rawImg = (item.imageURL || item.image_url || '').trim()
    if (rawImg) {
      imagenMap.set(itemId, rawImg)
    }
  }

  return { categoriaMap, categoriaDetailMap, imagenMap }
}

async function fetchCatalogoItemCategoriaEImagenes(): Promise<{
  categoriaMap: Map<string, string>
  categoriaDetailMap: Map<string, CategoriaMenuPedidoInfo>
  imagenMap: Map<string, string>
}> {
  const ttlMs = detectarPerfilRedDisponible().cacheTtlMs
  if (
    itemMenuCategoriaMapCache &&
    itemMenuCategoriaDetailMapCache &&
    itemMenuImagenMapCache &&
    Date.now() - itemMenuCatalogUpdatedAt <= ttlMs
  ) {
    return {
      categoriaMap: itemMenuCategoriaMapCache,
      categoriaDetailMap: itemMenuCategoriaDetailMapCache,
      imagenMap: itemMenuImagenMapCache,
    }
  }

  // Reutiliza directamente la caché del catálogo de Productos / Categorías sin tocar la red
  const productosCached = getCatalogoProductosCache()
  const categoriasCached = getMenuCategoriasCache()
  if (
    productosCached &&
    productosCached.productos.length > 0 &&
    (productosCached.categorias.length > 0 || (categoriasCached?.categorias.length ?? 0) > 0)
  ) {
    const cats =
      productosCached.categorias.length > 0
        ? productosCached.categorias
        : (categoriasCached?.categorias ?? [])
    const built = buildLookupMapsFromLists(productosCached.productos, cats)
    itemMenuCategoriaMapCache = built.categoriaMap
    itemMenuCategoriaDetailMapCache = built.categoriaDetailMap
    itemMenuImagenMapCache = built.imagenMap
    itemMenuCatalogUpdatedAt = Date.now()
    return built
  }

  if (itemMenuCatalogInFlight) {
    return itemMenuCatalogInFlight
  }

  itemMenuCatalogInFlight = (async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        requestProductosMenu(),
        obtenerMenuCategoriasApi(),
      ])

      const built = buildLookupMapsFromLists(prodRes.productos, catRes.categorias)

      if (built.categoriaMap.size > 0) {
        itemMenuCategoriaMapCache = built.categoriaMap
        itemMenuCategoriaDetailMapCache = built.categoriaDetailMap
      }
      if (built.imagenMap.size > 0) {
        itemMenuImagenMapCache = built.imagenMap
      }
      itemMenuCatalogUpdatedAt = Date.now()

      return built
    } catch (error) {
      console.error('Error al resolver catálogo de categorías e imágenes:', error)
      return {
        categoriaMap: new Map<string, string>(),
        categoriaDetailMap: new Map<string, CategoriaMenuPedidoInfo>(),
        imagenMap: new Map<string, string>(),
      }
    } finally {
      itemMenuCatalogInFlight = null
    }
  })()

  return itemMenuCatalogInFlight
}

export async function resolverMapaItemCategoriaPedidos(): Promise<Map<string, string>> {
  const { categoriaMap } = await fetchCatalogoItemCategoriaEImagenes()
  return categoriaMap
}

export async function resolverMapaImagenesItemMenuPedidos(): Promise<Map<string, string>> {
  const { imagenMap } = await fetchCatalogoItemCategoriaEImagenes()
  return imagenMap
}

export async function resolverCategoriaPorItemMenuId(
  itemMenuId: string,
): Promise<CategoriaMenuPedidoInfo | null> {
  const cleanId = itemMenuId.trim()
  if (!cleanId || cleanId === 'N/A') return null

  const { categoriaDetailMap } = await fetchCatalogoItemCategoriaEImagenes()
  return categoriaDetailMap.get(cleanId) ?? null
}

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
