import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsRotate,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Input } from '../../../../shared/ui/Input'
import { RecursosDropdown } from '../../../recursos/ui/molecules/recursos-dropdown'
import {
  SALIDA_FILTER_OPTIONS,
  type SalidaFilterOption,
} from '../../domain/salida-huesped'

export interface SalidasToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  departureFilter: SalidaFilterOption
  onDepartureFilterChange: (value: SalidaFilterOption) => void
  onReload: () => void
  isLoading: boolean
  filteredCount: number
  totalCount: number
}

export const SalidasToolbar = memo(function SalidasToolbar({
  searchQuery,
  onSearchChange,
  departureFilter,
  onDepartureFilterChange,
  onReload,
  isLoading,
  filteredCount,
  totalCount,
}: SalidasToolbarProps) {
  return (
    <section
      aria-label="Filtros de salidas de huéspedes"
      className="border-line bg-panel rounded-2xl border p-4 shadow-xs sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-7">
            <Input
              label="Buscar huésped"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, documento o fecha de nacimiento…"
              aria-label="Buscar huésped en tiempo real"
              icon={
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="size-3.5"
                  aria-hidden="true"
                />
              }
              action={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                    className="text-ink-muted hover:text-ink flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                  </button>
                ) : undefined
              }
            />
          </div>

          <div className="md:col-span-5">
            <RecursosDropdown
              label="Programación de salida"
              placeholder="Filtrar salidas…"
              value={departureFilter}
              onChange={(nextValue) =>
                onDepartureFilterChange(nextValue as SalidaFilterOption)
              }
              options={SALIDA_FILTER_OPTIONS}
              searchable={false}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <p className="text-ink-muted text-xs font-medium whitespace-nowrap">
            Mostrando <span className="text-ink font-bold">{filteredCount}</span>{' '}
            de <span className="text-ink font-bold">{totalCount}</span>
          </p>

          <button
            type="button"
            onClick={onReload}
            disabled={isLoading}
            className="border-line bg-canvas text-ink hover:border-primary/40 hover:text-primary inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </section>
  )
})
