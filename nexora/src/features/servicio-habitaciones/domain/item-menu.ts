import type { MenuCategoria } from './menu-categoria'

/**
 * Modelo de Dominio para los productos y platillos individuales del menú de Room Service.
 * Mapea la estructura devuelta por GET /item-menu.
 */
export interface ItemMenuProducto {
  /** ID interno del producto (SOLO para desarrollador / claves técnicas, NUNCA visible al usuario) */
  id?: string
  /** ID de la categoría a la que pertenece (SOLO para desarrollador) */
  category_id?: string
  /** Nombre comercial del producto gastronómico */
  name: string
  /** Descripción detallada, notas de cata e ingredientes */
  description?: string
  /** Precio en pesos colombianos (COP) */
  price: number
  /** Porcentaje de impuesto aplicable (ej. 10%) */
  tax_percentage?: number
  /** Tiempo estimado de preparación en cocina (minutos) */
  prep_time?: number
  /** Indica si es apto para dietas vegetarianas */
  isVegetarian?: boolean
  /** Indica si es apto para dietas veganas */
  isVegan?: boolean
  /** URL pública de la fotografía o asset servido desde Supabase Storage */
  imageURL: string
  /** Hora de inicio del servicio (formato HH:mm) */
  start_time?: string
  /** Hora de finalización del servicio (formato HH:mm) */
  end_time?: string
  /** Estado de disponibilidad actual para pedidos */
  available?: boolean
  /** Usuario creador (SOLO para desarrollador / auditoría interna) */
  created_by?: string

  // Propiedades alternativas por resiliencia con el backend
  image_url?: string
  is_vegetarian?: boolean
  is_vegan?: boolean
}

/**
 * Formatea un valor numérico al formato oficial de la moneda colombiana (Peso Colombiano - COP).
 * Ejemplo: 5500 -> "$ 5.500" o "$ 5.500 COP"
 */
export function formatearMonedaCOP(valor: number): string {
  if (isNaN(valor) || valor === null || valor === undefined) {
    return '$ 0'
  }

  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor)
  } catch {
    return `$ ${Math.round(valor).toLocaleString('es-CO')}`
  }
}

export type OrdenProducto =
  | 'precio-alto'
  | 'precio-menor'
  | 'orden-az'
  | 'orden-za'

export interface CategoriaVinculadaInfo {
  name: string
  asset?: string
}

/**
 * Ordena productos aplicando secuencialmente múltiples criterios seleccionados.
 */
export function sortProductosByCriterios(
  productos: ReadonlyArray<ItemMenuProducto>,
  criterios: ReadonlyArray<OrdenProducto>
): ItemMenuProducto[] {
  if (criterios.length === 0) return [...productos]

  return [...productos].sort((a, b) => {
    for (const criterio of criterios) {
      let cmp = 0
      if (criterio === 'precio-alto') {
        cmp = Number(b.price) - Number(a.price)
      } else if (criterio === 'precio-menor') {
        cmp = Number(a.price) - Number(b.price)
      } else if (criterio === 'orden-az') {
        cmp = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      } else if (criterio === 'orden-za') {
        cmp = b.name.localeCompare(a.name, 'es', { sensitivity: 'base' })
      }
      if (cmp !== 0) return cmp
    }
    return 0
  })
}

/**
 * Construye un índice rápido por id, nombre normalizado y headquartes_id legado
 * para resolver imagen y nombre de la categoría vinculada a cada producto.
 */
export function buildCategoriasLookupMap(
  categorias: ReadonlyArray<MenuCategoria>
): Map<string, CategoriaVinculadaInfo> {
  const map = new Map<string, CategoriaVinculadaInfo>()
  for (const cat of categorias) {
    const info: CategoriaVinculadaInfo = {
      name: cat.name,
      asset: cat.asset,
    }
    if (cat.id) map.set(cat.id, info)
    if (cat.name) map.set(cat.name.trim().toLowerCase(), info)
    if (cat.headquartes_id && !map.has(cat.headquartes_id)) {
      map.set(cat.headquartes_id, info)
    }
  }
  return map
}

export function resolverCategoriaDeProducto(
  categoryId: string | undefined,
  lookup: ReadonlyMap<string, CategoriaVinculadaInfo>
): CategoriaVinculadaInfo | null {
  if (!categoryId) return null
  const clean = categoryId.trim()
  if (!clean) return null
  return lookup.get(clean) ?? lookup.get(clean.toLowerCase()) ?? null
}

/**
 * Resuelve la URL de la imagen del producto, garantizando siempre una URL válida y segura.
 */
export function resolverImagenProducto(producto: ItemMenuProducto): string {
  const url = producto.imageURL || producto.image_url
  if (url && typeof url === 'string' && url.trim().length > 0) {
    return url.trim()
  }
  return 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'
}

/**
 * Libera de forma segura una URL temporal `blob:` de memoria RAM mediante `try/catch`,
 * evitando errores si la URL ya fue revocada o si pertenece a un origen remoto.
 */
export function revocarBlobUrlSegura(url?: string | null): void {
  if (!url || typeof url !== 'string' || !url.startsWith('blob:')) {
    return
  }

  try {
    URL.revokeObjectURL(url)
  } catch {
    // Silencioso: evita interrumpir el flujo si el navegador ya liberó la referencia
  }
}
