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
import type { DisponibilidadFiltro } from '../ui/molecules/ProductosMasonryNavbar'

const PAGE_SIZE = 12

export function useItemMenuProductos() {
  const [productos, setProductos] = useState<ItemMenuProducto[]>([])
  const [categoriasLista, setCategoriasLista] = useState<MenuCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(
    null
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
  const [organizando, setOrganizando] = useState(false)
  const [, startTransition] = useTransition()
  const isMountedRef = useRef(true)

  const cargarCatalogoInicial = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        requestProductosMenu(),
        obtenerMenuCategoriasApi(),
      ])
      if (!isMountedRef.current) return
      setProductos(prodRes.productos)
      setFeedback(prodRes.feedback)
      const categorias =
        catRes.categorias.length > 0
          ? catRes.categorias
          : FALLBACK_MENU_CATEGORIAS
      setCategoriasLista(categorias)
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

  useEffect(() => {
    isMountedRef.current = true
    void Promise.resolve().then(() => cargarCatalogoInicial())
    return () => {
      isMountedRef.current = false
    }
  }, [cargarCatalogoInicial])

  const cargarProductos = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    await cargarCatalogoInicial()
  }, [cargarCatalogoInicial])

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

  const mostrarTodos = useCallback(() => {
    setVisibleCount(productosFiltrados.length)
  }, [productosFiltrados.length])

  const runOrganizeTransition = useCallback((updateFn: () => void) => {
    setOrganizando(true)
    startTransition(() => {
      updateFn()
      setVisibleCount(PAGE_SIZE)
    })
    setTimeout(() => {
      if (!isMountedRef.current) return
      setOrganizando(false)
    }, 450)
  }, [])

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
      runOrganizeTransition(() => setDisponibilidad(next))
    },
    [disponibilidad, runOrganizeTransition]
  )

  const handleCategoriasChange = useCallback(
    (nextCategorias: string[]) => {
      runOrganizeTransition(() => setCategoriasSeleccionadas(nextCategorias))
    },
    [runOrganizeTransition]
  )

  const handleOrdenesChange = useCallback(
    (nextOrdenes: OrdenProducto[]) => {
      runOrganizeTransition(() => setOrdenesSeleccionados(nextOrdenes))
    },
    [runOrganizeTransition]
  )

  const aplicarProductoActualizado = useCallback((updated: ItemMenuProducto) => {
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
    organizando,
    feedback,
    setFeedback,
    busqueda,
    disponibilidad,
    categoriasSeleccionadas,
    ordenesSeleccionados,
    hasMore,
    handleLoadMore,
    mostrarTodos,
    cargarProductos,
    handleBusquedaChange,
    handleLimpiarBusqueda,
    handleDisponibilidadChange,
    handleCategoriasChange,
    handleOrdenesChange,
    aplicarProductoActualizado,
  }
}
