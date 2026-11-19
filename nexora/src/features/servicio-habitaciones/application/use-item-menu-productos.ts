import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import {
  buildCategoriasLookupMap,
  resolverCategoriaDeProducto,
  sortProductosByCriterios,
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
  type OrdenProducto,
} from '../domain/item-menu'
import { requestProductosMenu } from '../infrastructure/api-item-menu-repository'
import {
  FALLBACK_MENU_CATEGORIAS,
  obtenerMenuCategoriasApi,
} from '../infrastructure/api-menu-categoria-repository'
import type { DisponibilidadFiltro } from '../ui/molecules/ProductosMasonryNavbar'

const PAGE_SIZE = 8

export function useItemMenuProductos() {
  const [productos, setProductos] = useState<ItemMenuProducto[]>([])
  const [categoriasMap, setCategoriasMap] = useState<
    ReadonlyMap<string, CategoriaVinculadaInfo>
  >(() => buildCategoriasLookupMap(FALLBACK_MENU_CATEGORIAS))
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

  useEffect(() => {
    isMountedRef.current = true
    void Promise.all([requestProductosMenu(), obtenerMenuCategoriasApi()]).then(
      ([prodRes, catRes]) => {
        if (!isMountedRef.current) return
        setProductos(prodRes.productos)
        setFeedback(prodRes.feedback)
        const categorias =
          catRes.categorias.length > 0
            ? catRes.categorias
            : FALLBACK_MENU_CATEGORIAS
        setCategoriasMap(buildCategoriasLookupMap(categorias))
        setLoading(false)
      }
    )
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const cargarProductos = async () => {
    setLoading(true)
    setFeedback(null)
    const [prodRes, catRes] = await Promise.all([
      requestProductosMenu(),
      obtenerMenuCategoriasApi(),
    ])
    if (!isMountedRef.current) return
    setProductos(prodRes.productos)
    setFeedback(prodRes.feedback)
    const categorias =
      catRes.categorias.length > 0 ? catRes.categorias : FALLBACK_MENU_CATEGORIAS
    setCategoriasMap(buildCategoriasLookupMap(categorias))
    setLoading(false)
  }

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
  const handleLoadMore = () => setVisibleCount((prev) => prev + PAGE_SIZE)

  const runOrganizeTransition = (updateFn: () => void) => {
    setOrganizando(true)
    startTransition(() => {
      updateFn()
      setVisibleCount(PAGE_SIZE)
    })
    setTimeout(() => {
      if (!isMountedRef.current) return
      setOrganizando(false)
    }, 450)
  }

  const handleBusquedaChange = (val: string) => {
    startTransition(() => {
      setBusqueda(val)
      setVisibleCount(PAGE_SIZE)
    })
  }

  const handleLimpiarBusqueda = () => {
    setBusqueda('')
    setVisibleCount(PAGE_SIZE)
  }

  const handleDisponibilidadChange = (next: DisponibilidadFiltro) => {
    if (next === disponibilidad) return
    runOrganizeTransition(() => setDisponibilidad(next))
  }

  const handleCategoriasChange = (nextCategorias: string[]) => {
    runOrganizeTransition(() => setCategoriasSeleccionadas(nextCategorias))
  }

  const handleOrdenesChange = (nextOrdenes: OrdenProducto[]) => {
    runOrganizeTransition(() => setOrdenesSeleccionados(nextOrdenes))
  }

  const aplicarProductoActualizado = (updated: ItemMenuProducto) => {
    setProductos((prev) =>
      prev.map((item) => {
        if (updated.id && item.id && item.id === updated.id) {
          return { ...item, ...updated }
        }
        return item
      })
    )
  }

  return {
    productos,
    productosFiltrados,
    visibleProductos,
    categoriasMap,
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
    cargarProductos,
    handleBusquedaChange,
    handleLimpiarBusqueda,
    handleDisponibilidadChange,
    handleCategoriasChange,
    handleOrdenesChange,
    aplicarProductoActualizado,
  }
}
