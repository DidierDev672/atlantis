import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
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

export type FiltroDieta =
  | 'todos'
  | 'precio-alto'
  | 'precio-menor'
  | 'orden-az'
  | 'orden-za'
  | 'disponibles'

interface FiltroDietaOption {
  id: FiltroDieta
  label: string
  icon?: IconDefinition
}

const FILTROS_DIETA: FiltroDietaOption[] = [
  { id: 'todos', label: 'Todos', icon: faUtensils },
  { id: 'precio-alto', label: 'Precio Alto', icon: faArrowUpWideShort },
  { id: 'precio-menor', label: 'Precio Menor', icon: faArrowDownShortWide },
  { id: 'orden-az', label: 'Ordenar A-Z', icon: faArrowDownAZ },
  { id: 'orden-za', label: 'Ordenar Z-A', icon: faArrowDownZA },
  { id: 'disponibles', label: 'Disponibles', icon: faCircleCheck },
]

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

/**
 * Molécula: Barra de búsqueda, filtros dietéticos y acciones del catálogo de productos.
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
  return (
    <nav
      aria-label="Filtros y acciones del menú de productos"
      className="border-line bg-panel flex flex-col gap-3 rounded-3xl border p-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between"
    >
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

      {/* Filtros de Dieta / Disponibilidad */}
      <div className="border-line bg-canvas flex flex-wrap items-center gap-1.5 rounded-2xl border p-1 text-xs">
        {FILTROS_DIETA.map((opcion) => {
          const isActive = filtroDieta === opcion.id
          return (
            <button
              key={opcion.id}
              type="button"
              onClick={() => onFiltroChange(opcion.id)}
              aria-pressed={isActive}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-muted hover:bg-panel/80 hover:text-ink'
              }`}
            >
              {opcion.icon && (
                <FontAwesomeIcon icon={opcion.icon} className="size-3.5" />
              )}
              <span>
                {opcion.id === 'todos'
                  ? `${opcion.label} (${totalProductos})`
                  : opcion.label}
              </span>
            </button>
          )
        })}
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

