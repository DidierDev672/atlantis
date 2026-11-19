import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { obtenerMenuCategoriasApi } from '../infrastructure/api-menu-categoria-repository'
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'
import type { MenuCategoria } from '../domain/menu-categoria'

export interface UseCategoriasMenuProductoParams {
  categoriaInicial?: MenuCategoria | null
  categoriasDisponibles?: MenuCategoria[]
}

/**
 * Hook auxiliar para cargar y validar las categorías de `GET /menu-category`
 * con balanceo de carga y mapeo de opciones para `RecursosDropdown`.
 */
export function useCategoriasMenuProducto({
  categoriaInicial,
  categoriasDisponibles = [],
}: UseCategoriasMenuProductoParams) {
  const [categoriasCargadas, setCategoriasCargadas] = useState<MenuCategoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(
    () => categoriasDisponibles.length === 0
  )
  const [categoriaValidation, setCategoriaValidation] =
    useState<StatusCodeValidationResult | null>(null)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(
    () => categoriaInicial?.id || ''
  )
  const [categoriaError, setCategoriaError] = useState<string | undefined>()

  const fetchCategorias = useCallback(
    async (isActive: () => boolean = () => true) => {
      setLoadingCategorias(true)
      setCategoriaValidation(null)

      try {
        const res = await obtenerMenuCategoriasApi()
        if (!isActive()) return

        setCategoriasCargadas(res.categorias)
        setCategoriaValidation(validateStatusCode(res.validation.status))

        if (!categoriaInicial?.id && categoriaInicial?.name) {
          const match = res.categorias.find(
            (c) => c.name.toLowerCase() === categoriaInicial.name.toLowerCase()
          )
          if (match?.id) {
            setCategoriaSeleccionada(match.id)
          }
        }
      } catch {
        if (!isActive()) return
        setCategoriaValidation(validateStatusCode(500))
      } finally {
        if (isActive()) {
          setLoadingCategorias(false)
        }
      }
    },
    [categoriaInicial]
  )

  const recargarCategorias = useCallback(
    () => fetchCategorias(),
    [fetchCategorias]
  )

  useEffect(() => {
    if (categoriasDisponibles.length > 0) return

    let active = true
    void Promise.resolve().then(() => fetchCategorias(() => active))

    return () => {
      active = false
    }
  }, [categoriasDisponibles.length, fetchCategorias])

  const listaCategorias = useMemo(
    () =>
      categoriasDisponibles.length > 0 ? categoriasDisponibles : categoriasCargadas,
    [categoriasDisponibles, categoriasCargadas]
  )

  const categoriaOptions: DropdownOption[] = useMemo(
    () =>
      listaCategorias
        .filter((cat): cat is MenuCategoria & { id: string } => Boolean(cat.id))
        .map((cat) => ({
          value: cat.id,
          label: cat.name,
        })),
    [listaCategorias]
  )

  return {
    listaCategorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    categoriaOptions,
    loadingCategorias: categoriasDisponibles.length === 0 && loadingCategorias,
    categoriaValidation:
      categoriasDisponibles.length === 0 ? categoriaValidation : null,
    setCategoriaValidation,
    recargarCategorias,
    categoriaError,
    setCategoriaError,
  }
}
