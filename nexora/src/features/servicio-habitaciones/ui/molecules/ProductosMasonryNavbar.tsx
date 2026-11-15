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

export type FiltroDieta =
  | 'todos'
  | 'precio-alto'
  | 'precio-menor'
  | 'orden-az'
  | 'orden-za'
  | 'disponibles'

export interface ProductosMasonryNavbarProps {
  busqueda: string
  filtroDieta: FiltroDieta
  totalProductos: number
  loading: boolean
  onBusquedaChange: (value: string) => void
  onLimpiarBusqueda: () => void
  onFiltroChange: (filtro: FiltroDieta) => void
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

/**
 * Molécula: Barra de búsqueda, filtros dietéticos, selector desplegable
 * de ordenamiento (con RecursosDropdown) y acciones del catálogo de productos.
 */
export function ProductosMasonryNavbar({
  busqueda,
  filtroDieta,
  totalProductos,
  loading,
  onBusquedaChange,
  onLimpiarBusqueda,
  onFiltroChange,
  onRefrescar,
  onAgregarNuevo,
}: ProductosMasonryNavbarProps) {
  const isOrdenActivo = [
    'precio-alto',
    'precio-menor',
    'orden-az',
    'orden-za',
  ].includes(filtroDieta)

  const valorOrdenSeleccionado = isOrdenActivo ? filtroDieta : ''

  return (
    <nav
      aria-label="Filtros y acciones del menú de productos"
      className="border-line bg-panel flex flex-col gap-3 rounded-3xl border p-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between"
    >
      {/* Buscador reactivo */}
      <div className="relative w-full lg:max-w-sm lg:flex-1">
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

      {/* Filtros rápidos (Todos, Disponibles) + Dropdown de ordenamiento con RecursosDropdown */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="border-line bg-canvas flex items-center gap-1.5 rounded-2xl border p-1 text-xs">
          <button
            type="button"
            onClick={() => onFiltroChange('todos')}
            aria-pressed={filtroDieta === 'todos'}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
              filtroDieta === 'todos'
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink-muted hover:bg-panel/80 hover:text-ink'
            }`}
          >
            <FontAwesomeIcon icon={faUtensils} className="size-3.5" />
            <span>Todos ({totalProductos})</span>
          </button>

          <button
            type="button"
            onClick={() => onFiltroChange('disponibles')}
            aria-pressed={filtroDieta === 'disponibles'}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
              filtroDieta === 'disponibles'
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink-muted hover:bg-panel/80 hover:text-ink'
            }`}
          >
            <FontAwesomeIcon icon={faCircleCheck} className="size-3.5" />
            <span>Disponibles</span>
          </button>
        </div>

        {/* Componente Reutilizable RecursosDropdown para selección de ordenamiento */}
        <div className="w-48 sm:w-56">
          <RecursosDropdown
            value={valorOrdenSeleccionado}
            onChange={(val) => {
              if (val) onFiltroChange(val as FiltroDieta)
            }}
            options={OPCIONES_ORDENAMIENTO}
            placeholder="Ordenar por…"
            searchable={false}
            className="text-xs"
          />
        </div>
      </div>

      {/* Acciones de Cabecera: Refrescar y Nuevo Producto */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onRefrescar}
          disabled={loading}
          aria-label="Refrescar catálogo de productos"
          title="Refrescar catálogo de productos"
          className="border-line bg-canvas text-ink-muted hover:border-primary/40 hover:text-ink inline-flex h-9 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-xs font-bold shadow-2xs transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FontAwesomeIcon
            icon={faArrowsRotate}
            spin={loading}
            className="size-3.5"
          />
          <span className="sm:hidden lg:inline">Refrescar</span>
        </button>
        {onAgregarNuevo && (
          <button
            type="button"
            onClick={onAgregarNuevo}
            className="bg-primary shadow-primary/20 hover:bg-primary/90 inline-flex h-9 cursor-pointer items-center gap-2 rounded-2xl px-4 text-xs font-bold text-white shadow-sm transition-all"
          >
            <FontAwesomeIcon icon={faPlus} className="size-3.5" />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>
    </nav>
  )
}

export default ProductosMasonryNavbar
