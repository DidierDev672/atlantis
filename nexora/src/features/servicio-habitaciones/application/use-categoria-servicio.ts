import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import { FALLBACK_MENU_CATEGORIAS } from '../infrastructure/api-menu-categoria-repository'

export interface CategoriaServicioInfo {
  name: string
  asset?: string
}

function obtenerCategoriaLocal(categoryId?: string): CategoriaServicioInfo | null {
  if (!categoryId) return null
  const catLocal = FALLBACK_MENU_CATEGORIAS.find(
    (c) => c.headquartes_id === categoryId || c.name.toLowerCase() === categoryId.toLowerCase()
  )
  return catLocal ? { name: catLocal.name, asset: catLocal.asset } : null
}

/**
 * Hook de aplicación: Consulta los datos de la categoría o servicio de habitaciones
 * a la que pertenece un ítem de menú, aplicando fallback local y validación de status code.
 */
export function useCategoriaServicio(categoryId?: string) {
  const [categoriaServicio, setCategoriaServicio] = useState<CategoriaServicioInfo | null>(() =>
    obtenerCategoriaLocal(categoryId)
  )
  const [loadingCategoria, setLoadingCategoria] = useState(false)

  useEffect(() => {
    const local = obtenerCategoriaLocal(categoryId)

    if (!categoryId) {
      return
    }

    let isMounted = true

    const fetchCategoria = async () => {
      setLoadingCategoria(true)
      try {
        const response = await api.get(`/menu-category/${encodeURIComponent(categoryId)}`, {
          skipAuth: true,
          validateStatus: () => true,
        })

        const validation = validateStatusCode(response.status)

        if (validation.isValid && response.data && isMounted) {
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
            setCategoriaServicio({
              name: String(raw.name),
              asset: raw.asset ? String(raw.asset) : local?.asset,
            })
          }
        }
      } catch (err) {
        console.warn('Aviso al consultar servicio de habitaciones:', err)
      } finally {
        if (isMounted) setLoadingCategoria(false)
      }
    }

    void fetchCategoria()

    return () => {
      isMounted = false
    }
  }, [categoryId])

  return {
    categoriaServicio: categoryId ? categoriaServicio : null,
    loadingCategoria: categoryId ? loadingCategoria : false,
  }
}
