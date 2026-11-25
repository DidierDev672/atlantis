import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsRotate,
  faCircleCheck,
  faMagnifyingGlass,
  faPlus,
  faXmark,
  faUtensils,
  faArrowUpWideShort,
  faArrowDownShortWide,
  faArrowDownAZ,
  faArrowDownZA,
} from '@fortawesome/free-solid-svg-icons'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import type { OrdenProducto } from '../../domain/item-menu'

export type DisponibilidadFiltro = 'todos' | 'disponibles'

export type FiltroDieta = DisponibilidadFiltro | OrdenProducto

export interface ProductosMasonryNavbarProps {
  busqueda: string
  disponibilidad: DisponibilidadFiltro
  categoriasSeleccionadas: string[]
  categoriaOptions?: ReadonlyArray<DropdownOption>
  ordenesSeleccionados: OrdenProducto[]
  totalProductos: number
  loading: boolean
  onBusquedaChange: (value: string) => void
  onLimpiarBusqueda: () => void
  onDisponibilidadChange: (filtro: DisponibilidadFiltro) => void
  onCategoriasChange: (categorias: string[]) => void
  onOrdenesChange: (ordenes: OrdenProducto[]) => void
  onRefrescar: () => void
  onAgregarNuevo?: () => void
}

const OPCIONES_ORDENAMIENTO: DropdownOption[] = [
  {
    value: 'precio-alto',
    label: 'Precio: Alto a Menor',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon
          icon={faArrowUpWideShort}
          className="size-3.5 text-primary"
        />
        <span>Precio: Alto a Menor</span>
      </span>
    ),
  },
  {
    value: 'precio-menor',
    label: 'Precio: Menor a Alto',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon
          icon={faArrowDownShortWide}
          className="size-3.5 text-primary"
        />
        <span>Precio: Menor a Alto</span>
      </span>
    ),
  },
  {
    value: 'orden-az',
    label: 'Ordenar A-Z',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon icon={faArrowDownAZ} className="size-3.5 text-primary" />
        <span>Alfabético A-Z</span>
      </span>
    ),
  },
  {
    value: 'orden-za',
    label: 'Ordenar Z-A',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon icon={faArrowDownZA} className="size-3.5 text-primary" />
        <span>Alfabético Z-A</span>
      </span>
    ),
  },
]

const EMPTY_CATEGORIA_OPTIONS: ReadonlyArray<DropdownOption> = []

/**
 * Molécula: Barra de búsqueda, filtros dietéticos, selector desplegable
 * de ordenamiento (con RecursosDropdown) y acciones del catálogo de productos.
 * Envuelto en `React.memo` y reutiliza `categoriaOptions` ya cargadas para evitar
 * duplicar peticiones a `GET /menu-category`.
 */
export const ProductosMasonryNavbar = memo(function ProductosMasonryNavbar({
  busqueda,
  disponibilidad,
  categoriasSeleccionadas,
  categoriaOptions = EMPTY_CATEGORIA_OPTIONS,
  ordenesSeleccionados,
  totalProductos,
  loading,
  onBusquedaChange,
  onLimpiarBusqueda,
  onDisponibilidadChange,
  onCategoriasChange,
  onOrdenesChange,
  onRefrescar,
  onAgregarNuevo,
}: ProductosMasonryNavbarProps) {
  const handleOrdenesMultiChange = useCallback(
    (values: string[]) => {
      onOrdenesChange(values as OrdenProducto[])
    },
    [onOrdenesChange]
  )

  return (
    <nav
      aria-label="Filtros y acciones del menú de productos"
      className="border-line bg-panel flex flex-col gap-3 rounded-3xl border p-3.5 shadow-xs lg:flex-row lg:items-end lg:justify-between"
    >
      {/* Buscador reactivo */}
      <div className="relative w-full lg:flex-1">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
        />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar por platillo, ingrediente o nota de sabor..."
          className="border-line bg-canvas text-ink placeholder:text-ink-muted/70 focus:border-primary focus:ring-primary/20 w-full rounded-2xl border py-2.5 pr-9 pl-9 text-xs transition-colors outline-none focus:ring-2"
        />
        {busqueda && (
          <button
            type="button"
            onClick={onLimpiarBusqueda}
            aria-label="Limpiar búsqueda"
            className="text-ink-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-xs transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filtros rápidos (Todos, Disponibles), dropdowns y acciones (Refrescar / Agregar producto) */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="border-line bg-canvas flex items-center gap-1.5 rounded-2xl border p-1 text-xs">
          <button
            type="button"
            onClick={() => onDisponibilidadChange('todos')}
            aria-pressed={disponibilidad === 'todos'}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
              disponibilidad === 'todos'
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink-muted hover:bg-panel/80 hover:text-ink'
            }`}
          >
            <FontAwesomeIcon icon={faUtensils} className="size-3.5" />
            <span>Todos ({totalProductos})</span>
          </button>

          <button
            type="button"
            onClick={() => onDisponibilidadChange('disponibles')}
            aria-pressed={disponibilidad === 'disponibles'}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
              disponibilidad === 'disponibles'
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink-muted hover:bg-panel/80 hover:text-ink'
            }`}
          >
            <FontAwesomeIcon icon={faCircleCheck} className="size-3.5" />
            <span>Disponibles</span>
          </button>
        </div>

        {/* Reutiliza las opciones ya cargadas desde useItemMenuProductos sin re-consultar GET /menu-category */}
        <div className="w-56 sm:w-72">
          <RecursosDropdown
            label="Categorías"
            options={categoriaOptions}
            isLoading={loading && categoriaOptions.length === 0}
            multiple
            searchable
            searchPlaceholder="Buscar categoría…"
            selectedValues={categoriasSeleccionadas}
            onMultiChange={onCategoriasChange}
            placeholder="Todas las categorías"
            emptyLabel="No hay categorías disponibles."
            className="text-xs"
          />
        </div>

        {/* Componente Reutilizable RecursosDropdown con selección múltiple para ordenamiento */}
        <div className="w-56 sm:w-64">
          <RecursosDropdown
            label="Ordenar"
            multiple
            selectedValues={ordenesSeleccionados}
            onMultiChange={handleOrdenesMultiChange}
            options={OPCIONES_ORDENAMIENTO}
            placeholder="Ordenar por…"
            searchable={false}
            className="text-xs"
          />
        </div>

        {/* Acciones en filtros: Refrescar y Agregar producto (icono plus) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefrescar}
            disabled={loading}
            aria-label="Refrescar catálogo de productos"
            title="Refrescar catálogo de productos"
            className="border-line bg-canvas text-ink-muted hover:border-primary/40 hover:text-ink inline-flex size-9 cursor-pointer items-center justify-center rounded-2xl border shadow-2xs transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              spin={loading}
              className="size-3.5"
            />
          </button>
          {onAgregarNuevo && (
            <button
              type="button"
              onClick={onAgregarNuevo}
              aria-label="Agregar producto"
              title="Agregar producto"
              className="bg-primary shadow-primary/20 hover:bg-primary/90 inline-flex size-9 cursor-pointer items-center justify-center rounded-2xl text-white shadow-sm transition-all active:scale-95"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
})

export default ProductosMasonryNavbar
