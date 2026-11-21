import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { requestProductosMenu } from '../infrastructure/api-item-menu-repository'
import { getCatalogoProductosCache } from '../infrastructure/catalogo-productos-cache'
import type { ItemMenuProducto } from '../domain/item-menu'
import type { MenuCategoria } from '../domain/menu-categoria'

const PAGE_SIZE_MODAL = 10
const INCREMENT_STEP_MODAL = 5

/**
 * Hook de aplicación para consultar y filtrar los productos (`/item-menu`)
 * vinculados a una categoría específica, aprovechando caché en memoria,
 * paginación progresiva y manejo de errores con `try/catch/finally`.
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
  const [paginacionState, setPaginacionState] = useState<{
    categoriaKey: string | null
    count: number
  }>({ categoriaKey: null, count: PAGE_SIZE_MODAL })

  const isMountedRef = useRef(true)

  const cargarProductos = useCallback(async () => {
    if (!categoriaKey) return
    setReloading(true)

    try {
      const { productos: lista, feedback: validacion } = await requestProductosMenu()
      if (!isMountedRef.current) return
      setEstado({
        resolvedKey: categoriaKey,
        productos: lista,
        feedback: validacion,
      })
    } catch (error) {
      console.error('Error al recargar productos de la categoría:', error)
      if (!isMountedRef.current) return
      setEstado((prev) => ({
        resolvedKey: categoriaKey,
        productos: prev.resolvedKey === categoriaKey ? prev.productos : [],
        feedback: validateStatusCode(500),
      }))
    } finally {
      if (isMountedRef.current) {
        setReloading(false)
      }
    }
  }, [categoriaKey])

  useEffect(() => {
    isMountedRef.current = true
    if (!categoriaKey) {
      return () => {
        isMountedRef.current = false
      }
    }

    const inicializar = async () => {
      try {
        const cached = getCatalogoProductosCache()
        if (cached) {
          if (!isMountedRef.current) return
          setEstado({
            resolvedKey: categoriaKey,
            productos: cached.productos,
            feedback: cached.feedback,
          })
          return
        }

        const { productos: lista, feedback: validacion } = await requestProductosMenu()
        if (!isMountedRef.current) return
        setEstado({
          resolvedKey: categoriaKey,
          productos: lista,
          feedback: validacion,
        })
      } catch (error) {
        console.error('Error al cargar productos vinculados:', error)
        if (!isMountedRef.current) return
        setEstado({
          resolvedKey: categoriaKey,
          productos: [],
          feedback: validateStatusCode(500),
        })
      }
    }

    void Promise.resolve().then(() => inicializar())

    return () => {
      isMountedRef.current = false
    }
  }, [categoriaKey])

  const busqueda =
    busquedaState.categoriaKey === categoriaKey ? busquedaState.termino : ''

  const setBusqueda = useCallback(
    (termino: string) => {
      setBusquedaState({ categoriaKey, termino })
      setPaginacionState({ categoriaKey, count: PAGE_SIZE_MODAL })
    },
    [categoriaKey],
  )

  const loading = reloading || (Boolean(categoriaKey) && estado.resolvedKey !== categoriaKey)
  const feedback =
    categoriaKey && estado.resolvedKey === categoriaKey ? estado.feedback : null

  const productosVinculados = useMemo(() => {
    if (!categoria?.id || estado.resolvedKey !== categoriaKey) return []
    return estado.productos.filter((producto) => producto.category_id === categoria.id)
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

  const visibleCount =
    paginacionState.categoriaKey === categoriaKey ? paginacionState.count : PAGE_SIZE_MODAL

  const visibleProductos = useMemo(
    () => productosFiltrados.slice(0, visibleCount),
    [productosFiltrados, visibleCount],
  )
  const hasMore = visibleCount < productosFiltrados.length

  const handleLoadMore = useCallback(() => {
    setPaginacionState((prev) => ({
      categoriaKey,
      count:
        (prev.categoriaKey === categoriaKey ? prev.count : PAGE_SIZE_MODAL) + PAGE_SIZE_MODAL,
    }))
  }, [categoriaKey])

  const mostrarCincoMas = useCallback(() => {
    setPaginacionState((prev) => ({
      categoriaKey,
      count:
        (prev.categoriaKey === categoriaKey ? prev.count : PAGE_SIZE_MODAL) +
        INCREMENT_STEP_MODAL,
    }))
  }, [categoriaKey])

  return {
    productosVinculados,
    productosFiltrados,
    visibleProductos,
    hasMore,
    busqueda,
    setBusqueda,
    loading,
    feedback,
    recargar: cargarProductos,
    handleLoadMore,
    mostrarCincoMas,
  }
}
