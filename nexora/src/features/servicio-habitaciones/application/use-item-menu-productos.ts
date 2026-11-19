import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import {
  buildCategoriasLookupMap,
  resolverCategoriaDeProducto,
  sortProductosByCriterios,
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
  type OrdenProducto,
} from '../domain/item-menu'
import type { MenuCategoria } from '../domain/menu-categoria'
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'
import { requestProductosMenu } from '../infrastructure/api-item-menu-repository'
import {
  FALLBACK_MENU_CATEGORIAS,
  obtenerMenuCategoriasApi,
} from '../infrastructure/api-menu-categoria-repository'
import {
  actualizarProductoEnCache,
  getCatalogoProductosCache,
  invalidarCacheProductosMenu,
  setCatalogoProductosCache,
} from '../infrastructure/catalogo-productos-cache'
import type { DisponibilidadFiltro } from '../ui/molecules/ProductosMasonryNavbar'

const PAGE_SIZE = 12
const INCREMENT_STEP = 5

export function useItemMenuProductos() {
  const initialCache = useMemo(() => getCatalogoProductosCache(), [])

  const [productos, setProductos] = useState<ItemMenuProducto[]>(
    () => initialCache?.productos ?? []
  )
  const [categoriasLista, setCategoriasLista] = useState<MenuCategoria[]>(
    () => initialCache?.categorias ?? []
  )
  const [loading, setLoading] = useState(() => !initialCache)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(
    () => initialCache?.feedback ?? null
  )
  const [busqueda, setBusqueda] = useState('')
  const [disponibilidad, setDisponibilidad] =
    useState<DisponibilidadFiltro>('todos')
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<
    string[]
  >([])
  const [ordenesSeleccionados, setOrdenesSeleccionados] = useState<
    OrdenProducto[]
  >([])
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE)
  const [, startTransition] = useTransition()
  const isMountedRef = useRef(true)

  const cargarCatalogo = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCatalogoProductosCache()
      if (cached) {
        if (!isMountedRef.current) return
        setProductos(cached.productos)
        setCategoriasLista(cached.categorias)
        setFeedback(cached.feedback)
        setLoading(false)
        return
      }
    }

    try {
      const [prodRes, catRes] = await Promise.all([
        requestProductosMenu(),
        obtenerMenuCategoriasApi(),
      ])
      if (!isMountedRef.current) return

      const categorias =
        catRes.categorias.length > 0
          ? catRes.categorias
          : FALLBACK_MENU_CATEGORIAS

      setProductos(prodRes.productos)
      setFeedback(prodRes.feedback)
      setCategoriasLista(categorias)

      setCatalogoProductosCache({
        productos: prodRes.productos,
        categorias,
        feedback: prodRes.feedback,
      })
    } catch {
      if (!isMountedRef.current) return
      setProductos([])
      setCategoriasLista(FALLBACK_MENU_CATEGORIAS)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    if (!initialCache) {
      void Promise.resolve().then(() => cargarCatalogo(false))
    }
    return () => {
      isMountedRef.current = false
    }
  }, [cargarCatalogo, initialCache])

  const cargarProductos = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    invalidarCacheProductosMenu()
    await cargarCatalogo(true)
  }, [cargarCatalogo])

  const categoriasMap: ReadonlyMap<string, CategoriaVinculadaInfo> = useMemo(() => {
    try {
      const fuente =
        categoriasLista.length > 0 ? categoriasLista : FALLBACK_MENU_CATEGORIAS
      return buildCategoriasLookupMap(fuente)
    } catch {
      return buildCategoriasLookupMap(FALLBACK_MENU_CATEGORIAS)
    }
  }, [categoriasLista])

  const categoriaOptions: DropdownOption[] = useMemo(() => {
    try {
      return categoriasLista.map((cat) => ({
        value: cat.id ?? cat.name,
        label: cat.name,
        id: cat.id,
        rawName: cat.name,
      }))
    } catch {
      return []
    }
  }, [categoriasLista])

  const productosFiltrados = useMemo(() => {
    const filtrados = productos.filter((item) => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const coincideNombre = item.name.toLowerCase().includes(q)
        const coincideDesc = item.description
          ? item.description.toLowerCase().includes(q)
          : false
        const cat = resolverCategoriaDeProducto(item.category_id, categoriasMap)
        const coincideCat = cat ? cat.name.toLowerCase().includes(q) : false
        if (!coincideNombre && !coincideDesc && !coincideCat) return false
      }

      if (disponibilidad === 'disponibles' && item.available === false) {
        return false
      }

      if (categoriasSeleccionadas.length > 0) {
        const itemCat = resolverCategoriaDeProducto(
          item.category_id,
          categoriasMap
        )
        const matchesCategory = categoriasSeleccionadas.some((selectedId) => {
          if (item.category_id && item.category_id === selectedId) return true
          const selectedCat = resolverCategoriaDeProducto(
            selectedId,
            categoriasMap
          )
          return Boolean(
            itemCat &&
              selectedCat &&
              itemCat.name.toLowerCase() === selectedCat.name.toLowerCase()
          )
        })
        if (!matchesCategory) return false
      }

      return true
    })

    return sortProductosByCriterios(filtrados, ordenesSeleccionados)
  }, [
    productos,
    categoriasMap,
    busqueda,
    disponibilidad,
    categoriasSeleccionadas,
    ordenesSeleccionados,
  ])

  const visibleProductos = useMemo(
    () => productosFiltrados.slice(0, visibleCount),
    [productosFiltrados, visibleCount]
  )

  const hasMore = visibleCount < productosFiltrados.length

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }, [])

  const mostrarCincoMas = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(productosFiltrados.length, prev + INCREMENT_STEP)
    )
  }, [productosFiltrados.length])

  const handleBusquedaChange = useCallback((val: string) => {
    startTransition(() => {
      setBusqueda(val)
      setVisibleCount(PAGE_SIZE)
    })
  }, [])

  const handleLimpiarBusqueda = useCallback(() => {
    setBusqueda('')
    setVisibleCount(PAGE_SIZE)
  }, [])

  const handleDisponibilidadChange = useCallback(
    (next: DisponibilidadFiltro) => {
      if (next === disponibilidad) return
      startTransition(() => {
        setDisponibilidad(next)
        setVisibleCount(PAGE_SIZE)
      })
    },
    [disponibilidad]
  )

  const handleCategoriasChange = useCallback((nextCategorias: string[]) => {
    startTransition(() => {
      setCategoriasSeleccionadas(nextCategorias)
      setVisibleCount(PAGE_SIZE)
    })
  }, [])

  const handleOrdenesChange = useCallback((nextOrdenes: OrdenProducto[]) => {
    startTransition(() => {
      setOrdenesSeleccionados(nextOrdenes)
      setVisibleCount(PAGE_SIZE)
    })
  }, [])

  const aplicarProductoActualizado = useCallback((updated: ItemMenuProducto) => {
    actualizarProductoEnCache(updated)
    setProductos((prev) =>
      prev.map((item) => {
        if (updated.id && item.id && item.id === updated.id) {
          return { ...item, ...updated }
        }
        return item
      })
    )
  }, [])

  return {
    productos,
    productosFiltrados,
    visibleProductos,
    categoriasMap,
    categoriaOptions,
    loading,
    feedback,
    setFeedback,
    busqueda,
    disponibilidad,
    categoriasSeleccionadas,
    ordenesSeleccionados,
    hasMore,
    handleLoadMore,
    mostrarCincoMas,
    cargarProductos,
    handleBusquedaChange,
    handleLimpiarBusqueda,
    handleDisponibilidadChange,
    handleCategoriasChange,
    handleOrdenesChange,
    aplicarProductoActualizado,
  }
}
