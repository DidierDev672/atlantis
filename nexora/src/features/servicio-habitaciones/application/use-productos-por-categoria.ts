import { useState, useEffect, useCallback, useMemo } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import { requestProductosMenu } from '../infrastructure/api-item-menu-repository'
import type { ItemMenuProducto } from '../domain/item-menu'
import type { MenuCategoria } from '../domain/menu-categoria'

/**
 * Hook de aplicación para consultar y filtrar en tiempo real los productos (`/item-menu`)
 * vinculados a una categoría específica, usando balanceo de carga y validación de status codes.
 */
export function useProductosPorCategoria(categoria: MenuCategoria | null) {
  const categoriaKey = categoria ? `${categoria.id ?? ''}:${categoria.name}` : null

  const [estado, setEstado] = useState<{
    resolvedKey: string | null
    productos: ItemMenuProducto[]
    feedback: StatusCodeValidationResult | null
  }>({
    resolvedKey: null,
    productos: [],
    feedback: null,
  })
  const [reloading, setReloading] = useState(false)
  const [busquedaState, setBusquedaState] = useState<{
    categoriaKey: string | null
    termino: string
  }>({ categoriaKey: null, termino: '' })

  const cargarProductos = useCallback(async () => {
    if (!categoriaKey) return
    setReloading(true)

    const { productos: lista, feedback: validacion } = await requestProductosMenu()
    setEstado({
      resolvedKey: categoriaKey,
      productos: lista,
      feedback: validacion,
    })
    setReloading(false)
  }, [categoriaKey])

  useEffect(() => {
    if (!categoriaKey) return

    let activo = true
    void requestProductosMenu().then(({ productos: lista, feedback: validacion }) => {
      if (!activo) return
      setEstado({
        resolvedKey: categoriaKey,
        productos: lista,
        feedback: validacion,
      })
    })

    return () => {
      activo = false
    }
  }, [categoriaKey])

  const busqueda =
    busquedaState.categoriaKey === categoriaKey ? busquedaState.termino : ''

  const setBusqueda = useCallback(
    (termino: string) => {
      setBusquedaState({ categoriaKey, termino })
    },
    [categoriaKey]
  )

  const loading = reloading || (Boolean(categoriaKey) && estado.resolvedKey !== categoriaKey)
  const feedback =
    categoriaKey && estado.resolvedKey === categoriaKey ? estado.feedback : null

  const productosVinculados = useMemo(() => {
    if (!categoria?.id || estado.resolvedKey !== categoriaKey) return []
    return estado.productos.filter(
      (producto) => producto.category_id === categoria.id
    )
  }, [estado.productos, estado.resolvedKey, categoriaKey, categoria])

  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase()
    if (!query) return productosVinculados

    return productosVinculados.filter((producto) => {
      const coincideNombre = producto.name?.toLowerCase().includes(query)
      const coincideDescripcion = producto.description?.toLowerCase().includes(query)
      return Boolean(coincideNombre || coincideDescripcion)
    })
  }, [productosVinculados, busqueda])

  return {
    productosVinculados,
    productosFiltrados,
    busqueda,
    setBusqueda,
    loading,
    feedback,
    recargar: cargarProductos,
  }
}
