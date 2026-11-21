import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import type { MenuCategoria } from '../domain/menu-categoria'
import { obtenerMenuCategoriasApi } from '../infrastructure/api-menu-categoria-repository'
import {
  getMenuCategoriasCache,
  invalidarCacheCategoriasMenu,
} from '../infrastructure/catalogo-productos-cache'

export type CriterioOrden = 'order-asc' | 'order-desc' | 'name-asc' | 'name-desc'

export function useMenuCategorias() {
  const initialCache = useMemo(() => getMenuCategoriasCache(), [])

  const [categorias, setCategorias] = useState<MenuCategoria[]>(
    () => initialCache?.categorias ?? [],
  )
  const [loading, setLoading] = useState<boolean>(() => !initialCache)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(
    () => initialCache?.validation ?? null,
  )
  const [usandoFallback, setUsandoFallback] = useState<boolean>(
    () => initialCache?.usandoFallback ?? false,
  )

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedBuilding, setSelectedBuilding] = useState<string>('todos')
  const [selectedHeadquarter, setSelectedHeadquarter] = useState<string>('todas')
  const [ordenes, setOrdenes] = useState<CriterioOrden[]>(['order-asc'])
  const isMountedRef = useRef(true)

  const fetchCategorias = useCallback(async (forceRefresh: boolean = false) => {
    try {
      const res = await obtenerMenuCategoriasApi({ forceRefresh })
      if (!isMountedRef.current) return
      setCategorias(res.categorias)
      setFeedback(res.validation)
      setUsandoFallback(res.usandoFallback)
    } catch {
      if (!isMountedRef.current) return
      setCategorias([])
      setFeedback(validateStatusCode(500))
      setUsandoFallback(false)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const cargarCategorias = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    invalidarCacheCategoriasMenu()
    await fetchCategorias(true)
  }, [fetchCategorias])

  useEffect(() => {
    isMountedRef.current = true
    if (!initialCache) {
      void Promise.resolve().then(() => fetchCategorias(false))
    }
    return () => {
      isMountedRef.current = false
    }
  }, [fetchCategorias, initialCache])

  const edificiosDisponibles = useMemo(() => {
    const set = new Set<string>()
    categorias.forEach((c) => {
      if (c.building_id) set.add(c.building_id)
    })
    return Array.from(set)
  }, [categorias])

  const sedesDisponibles = useMemo(() => {
    const set = new Set<string>()
    categorias.forEach((c) => {
      if (c.headquartes_id) set.add(c.headquartes_id)
    })
    return Array.from(set)
  }, [categorias])

  const categoriasFiltradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    const filtradas = categorias.filter((item) => {
      const coincideTexto =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)

      const coincideEdificio =
        selectedBuilding === 'todos' || item.building_id === selectedBuilding

      const coincideSede =
        selectedHeadquarter === 'todas' || item.headquartes_id === selectedHeadquarter

      return coincideTexto && coincideEdificio && coincideSede
    })

    if (ordenes.length === 0) return filtradas
    return [...filtradas].sort((a, b) => {
      for (const criterio of ordenes) {
        let cmp = 0
        if (criterio === 'order-asc') cmp = a.order - b.order
        else if (criterio === 'order-desc') cmp = b.order - a.order
        else if (criterio === 'name-asc') cmp = a.name.localeCompare(b.name)
        else if (criterio === 'name-desc') cmp = b.name.localeCompare(a.name)
        if (cmp !== 0) return cmp
      }
      return 0
    })
  }, [categorias, searchTerm, selectedBuilding, selectedHeadquarter, ordenes])

  const limpiarFiltros = useCallback(() => {
    setSearchTerm('')
    setSelectedBuilding('todos')
    setSelectedHeadquarter('todas')
    setOrdenes(['order-asc'])
  }, [])

  return {
    categorias,
    categoriasFiltradas,
    loading,
    feedback,
    setFeedback,
    usandoFallback,
    searchTerm,
    setSearchTerm,
    selectedBuilding,
    setSelectedBuilding,
    selectedHeadquarter,
    setSelectedHeadquarter,
    ordenes,
    setOrdenes,
    edificiosDisponibles,
    sedesDisponibles,
    recargar: cargarCategorias,
    limpiarFiltros,
  }
}
