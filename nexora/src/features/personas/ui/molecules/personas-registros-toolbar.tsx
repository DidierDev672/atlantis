import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsRotate,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import type {
  PersonasKpisSummary,
  RegistrosFilterMode,
} from '../../application/use-personas-registros'

export interface PersonasRegistrosToolbarProps {
  filterMode: RegistrosFilterMode
  onFilterChange: (mode: RegistrosFilterMode) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  kpis: PersonasKpisSummary
  loading: boolean
  isVisibleServiceLoading: boolean
  onReload: () => void
}

/**
 * Molécula: Barra de filtros rápidos, buscador y recarga de Registros.
 */
export const PersonasRegistrosToolbar = memo(function PersonasRegistrosToolbar({
  filterMode,
  onFilterChange,
  searchQuery,
  onSearchChange,
  kpis,
  loading,
  isVisibleServiceLoading,
  onReload,
}: PersonasRegistrosToolbarProps) {
  const pills = [
    { id: 'todos', label: 'Todos los registros', count: kpis.totalGuests },
    {
      id: 'hoy',
      label: 'Ingresos hoy / En habitación',
      count: kpis.activeTodayCount,
    },
    { id: 'salen_hoy', label: 'Salen hoy', count: kpis.departingTodayCount },
    { id: 'con_deuda', label: 'Con deuda pendiente', count: kpis.withDebtCount },
  ] as const

  return (
    <div className="border-line bg-panel flex flex-col gap-3 rounded-2xl border p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-1.5">
        {pills.map((pill) => {
          const active = filterMode === pill.id
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onFilterChange(pill.id)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                active
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-canvas text-ink-muted hover:text-ink border-line border'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-panel text-ink-muted'
                }`}
              >
                {pill.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-72">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="text-ink-muted absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, documento, habitación, NIT…"
            aria-label="Buscar en registros"
            className="border-line bg-canvas text-ink placeholder:text-ink-muted/60 focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border pr-3.5 pl-9 text-xs outline-none focus:ring-2"
          />
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          title="Actualizar registros"
          aria-label="Actualizar registros"
          className="border-line bg-canvas text-ink hover:bg-panel inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition disabled:opacity-50"
        >
          <FontAwesomeIcon
            icon={faArrowsRotate}
            className={`size-3.5 ${
              loading || isVisibleServiceLoading ? 'animate-spin' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  )
})
