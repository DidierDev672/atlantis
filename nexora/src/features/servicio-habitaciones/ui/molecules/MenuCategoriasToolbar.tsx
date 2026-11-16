import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faXmark,
  faArrowsRotate,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { fadeIn } from '../../../../design-tokens/motion'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import {
  LayoutViewSwitch,
  type LayoutViewMode,
} from '../atoms/LayoutViewSwitch'

export interface MenuCategoriasToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  edificioOptions: DropdownOption[]
  selectedBuilding: string
  onBuildingChange: (value: string) => void
  ordenOptions: DropdownOption[]
  orden: string
  onOrderChange: (value: string) => void
  viewMode: LayoutViewMode
  onViewModeChange: (mode: LayoutViewMode) => void
  loading: boolean
  onRecargar: () => void
  onNuevoRegistro?: () => void
}

/**
 * Barra de herramientas y filtros reactivos para las categorías de menú.
 * Incluye búsqueda, dropdowns de edificio/ordenación, switch Masonry/Grid y acciones.
 */
export function MenuCategoriasToolbar({
  searchTerm,
  onSearchChange,
  onClearSearch,
  edificioOptions,
  selectedBuilding,
  onBuildingChange,
  ordenOptions,
  orden,
  onOrderChange,
  viewMode,
  onViewModeChange,
  loading,
  onRecargar,
  onNuevoRegistro,
}: MenuCategoriasToolbarProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="border-line bg-panel rounded-3xl border p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Campo de Búsqueda reactivo */}
        <div className="relative max-w-md flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="text-ink-muted/70 pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o descripción (ej. Panadería, Coctelería)..."
            className="border-line bg-canvas text-ink placeholder:text-ink-muted/70 focus:border-primary focus:ring-primary/20 w-full rounded-2xl border py-2.5 pr-8 pl-9 text-xs transition-colors outline-none focus:ring-2"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={onClearSearch}
              className="text-ink-muted hover:text-ink absolute inset-y-0 right-3 flex cursor-pointer items-center"
              title="Limpiar búsqueda"
            >
              <FontAwesomeIcon icon={faXmark} className="size-3" />
            </button>
          )}
        </div>

        {/* Controles de Filtros, Switch de Vista y Acciones */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switch Masonry / Grid */}
          <LayoutViewSwitch
            mode={viewMode}
            onChange={onViewModeChange}
          />

          {/* Filtro por Edificio */}
          <RecursosDropdown
            label="Edificio"
            options={edificioOptions}
            value={selectedBuilding}
            onChange={onBuildingChange}
            placeholder="Todos los edificios"
            className="w-40 sm:w-48 [&>label]:sr-only"
          />

          {/* Ordenación */}
          <RecursosDropdown
            label="Ordenar"
            options={ordenOptions}
            value={orden}
            onChange={onOrderChange}
            placeholder="Ordenar por..."
            className="w-44 sm:w-56 [&>label]:sr-only"
          />

          {/* Botón Refrescar (solo icono) */}
          <button
            type="button"
            onClick={onRecargar}
            disabled={loading}
            aria-label="Actualizar categorías"
            title="Actualizar categorías"
            className="border-line bg-canvas text-ink hover:bg-panel hover:border-primary/40 inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Botón para registrar nueva categoría (solo icono) */}
          {onNuevoRegistro && (
            <button
              type="button"
              onClick={onNuevoRegistro}
              aria-label="Registrar categoría"
              title="Registrar categoría"
              className="bg-primary hover:bg-primary/90 inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-white shadow-xs transition-all active:scale-95"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

