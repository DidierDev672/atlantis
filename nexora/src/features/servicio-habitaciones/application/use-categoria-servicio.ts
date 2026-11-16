import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  FALLBACK_MENU_CATEGORIAS,
  obtenerMenuCategoriasApi,
} from '../infrastructure/api-menu-categoria-repository'

export interface CategoriaServicioInfo {
  name: string
  asset?: string
}

const categoriaServicioCache = new Map<string, CategoriaServicioInfo | null>()

function obtenerCategoriaLocal(categoryId?: string): CategoriaServicioInfo | null {
  if (!categoryId) return null
  const catLocal = FALLBACK_MENU_CATEGORIAS.find(
    (c) =>
      c.id === categoryId ||
      c.headquartes_id === categoryId ||
      c.name.toLowerCase() === categoryId.toLowerCase()
  )
  return catLocal ? { name: catLocal.name, asset: catLocal.asset } : null
}

async function consultarCategoriaPorId(
  categoryId: string
): Promise<CategoriaServicioInfo | null> {
  if (categoriaServicioCache.has(categoryId)) {
    return categoriaServicioCache.get(categoryId) ?? null
  }

  try {
    const response = await executeBalancedRequest(() =>
      api.get(`/menu-category/${encodeURIComponent(categoryId)}`, {
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

      if (raw && typeof raw === 'object' && raw.name) {
        const info: CategoriaServicioInfo = {
          name: String(raw.name),
          asset: raw.asset ? String(raw.asset) : undefined,
        }
        categoriaServicioCache.set(categoryId, info)
        return info
      }
    }

    // Fallback al catálogo general GET /menu-category buscando por id o headquartes_id legado
    const catalogoRes = await obtenerMenuCategoriasApi()
    const coincidencia =
      catalogoRes.categorias.find((c) => c.id === categoryId) ||
      catalogoRes.categorias.find(
        (c) => c.name.toLowerCase() === categoryId.toLowerCase()
      ) ||
      catalogoRes.categorias.find((c) => c.headquartes_id === categoryId)

    if (coincidencia) {
      const info: CategoriaServicioInfo = {
        name: coincidencia.name,
        asset: coincidencia.asset,
      }
      categoriaServicioCache.set(categoryId, info)
      return info
    }
  } catch (err) {
    console.warn('Aviso al consultar servicio de habitaciones:', err)
  }

  return obtenerCategoriaLocal(categoryId)
}

/**
 * Hook de aplicación: Consulta los datos (nombre e imagen) de la categoría
 * a la que pertenece un ítem de menú con balanceo de carga, validación HTTP
 * y fallback al catálogo `/menu-category`.
 */
export function useCategoriaServicio(categoryId?: string) {
  const [estado, setEstado] = useState<{
    resolvedForId: string | null
    categoria: CategoriaServicioInfo | null
  }>({
    resolvedForId: null,
    categoria: null,
  })

  useEffect(() => {
    if (!categoryId) return

    let isMounted = true
    void consultarCategoriaPorId(categoryId).then((data) => {
      if (!isMounted) return
      setEstado({
        resolvedForId: categoryId,
        categoria: data,
      })
    })

    return () => {
      isMounted = false
    }
  }, [categoryId])

  const loadingCategoria = Boolean(categoryId) && estado.resolvedForId !== categoryId
  const categoriaServicio =
    categoryId && estado.resolvedForId === categoryId ? estado.categoria : null

  return {
    categoriaServicio,
    loadingCategoria,
  }
}
