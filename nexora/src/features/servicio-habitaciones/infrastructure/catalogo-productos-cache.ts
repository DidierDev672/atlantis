import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import type { ItemMenuProducto } from '../domain/item-menu'
import type { MenuCategoria } from '../domain/menu-categoria'
import { detectarPerfilRedDisponible } from './network-quality'

export interface CatalogoProductosCacheEntry {
  productos: ItemMenuProducto[]
  categorias: MenuCategoria[]
  feedback: StatusCodeValidationResult | null
  updatedAt: number
}

export interface MenuCategoriasCacheEntry {
  categorias: MenuCategoria[]
  validation: StatusCodeValidationResult | null
  usandoFallback: boolean
  updatedAt: number
}

let catalogoCache: CatalogoProductosCacheEntry | null = null
let menuCategoriasCache: MenuCategoriasCacheEntry | null = null

function getAdaptiveTtlMs(): number {
  try {
    return detectarPerfilRedDisponible().cacheTtlMs
  } catch {
    return 2 * 60 * 1000
  }
}

export function getCatalogoProductosCache(): CatalogoProductosCacheEntry | null {
  try {
    if (!catalogoCache) return null
    if (Date.now() - catalogoCache.updatedAt > getAdaptiveTtlMs()) {
      catalogoCache = null
      return null
    }
    return catalogoCache
  } catch {
    return null
  }
}

export function setCatalogoProductosCache(
  entry: Omit<CatalogoProductosCacheEntry, 'updatedAt'>
): void {
  const now = Date.now()
  catalogoCache = {
    ...entry,
    updatedAt: now,
  }
  if (entry.categorias.length > 0 && !menuCategoriasCache) {
    menuCategoriasCache = {
      categorias: entry.categorias,
      validation: entry.feedback,
      usandoFallback: false,
      updatedAt: now,
    }
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

export function getMenuCategoriasCache(): MenuCategoriasCacheEntry | null {
  try {
    if (!menuCategoriasCache) return null
    if (Date.now() - menuCategoriasCache.updatedAt > getAdaptiveTtlMs()) {
      menuCategoriasCache = null
      return null
    }
    return menuCategoriasCache
  } catch {
    return null
  }
}

export function setMenuCategoriasCache(
  entry: Omit<MenuCategoriasCacheEntry, 'updatedAt'>
): void {
  menuCategoriasCache = {
    ...entry,
    updatedAt: Date.now(),
  }
  if (catalogoCache && entry.categorias.length > 0) {
    catalogoCache = {
      ...catalogoCache,
      categorias: entry.categorias,
    }
  }
}

export function invalidarCacheCategoriasMenu(): void {
  menuCategoriasCache = null
}
