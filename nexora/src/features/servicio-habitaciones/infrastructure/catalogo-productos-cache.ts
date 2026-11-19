import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import type { ItemMenuProducto } from '../domain/item-menu'
import type { MenuCategoria } from '../domain/menu-categoria'

export interface CatalogoProductosCacheEntry {
  productos: ItemMenuProducto[]
  categorias: MenuCategoria[]
  feedback: StatusCodeValidationResult | null
  updatedAt: number
}

const CACHE_TTL_MS = 2 * 60 * 1000
let catalogoCache: CatalogoProductosCacheEntry | null = null

export function getCatalogoProductosCache(): CatalogoProductosCacheEntry | null {
  if (!catalogoCache) return null
  if (Date.now() - catalogoCache.updatedAt > CACHE_TTL_MS) {
    catalogoCache = null
    return null
  }
  return catalogoCache
}

export function setCatalogoProductosCache(
  entry: Omit<CatalogoProductosCacheEntry, 'updatedAt'>
): void {
  catalogoCache = {
    ...entry,
    updatedAt: Date.now(),
  }
}

export function actualizarProductoEnCache(updated: ItemMenuProducto): void {
  if (!catalogoCache) return
  catalogoCache = {
    ...catalogoCache,
    productos: catalogoCache.productos.map((item) =>
      updated.id && item.id && item.id === updated.id
        ? { ...item, ...updated }
        : item
    ),
  }
}

export function invalidarCacheProductosMenu(): void {
  catalogoCache = null
}
