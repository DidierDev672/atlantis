import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsRotate,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Input } from '../../../../shared/ui/Input'
import { formatCurrencyAmount } from '../../../recepciones/domain/salida-huesped'
import type { FacturaFilterOption } from '../../domain/factura-checkout'

export interface FacturaToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  conditionFilter: FacturaFilterOption
  onFilterChange: (value: FacturaFilterOption) => void
  counts: {
    total: number
    buenEstado: number
    novedades: number
    totalAmount: number
  }
  loading: boolean
  onReload: () => void
}

export const FacturaToolbar = memo(function FacturaToolbar({
  searchQuery,
  onSearchChange,
  conditionFilter,
  onFilterChange,
  counts,
  loading,
  onReload,
}: FacturaToolbarProps) {
  const filters: ReadonlyArray<{
    id: FacturaFilterOption
    label: string
    count: number
  }> = [
    { id: 'todas', label: 'Todas', count: counts.total },
    { id: 'buen_estado', label: 'Buen estado', count: counts.buenEstado },
    { id: 'novedades', label: 'Con novedades', count: counts.novedades },
  ]

  return (
    <div className="border-line bg-panel space-y-3 rounded-2xl border p-4 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código, huésped, habitación, método o nota…"
            aria-label="Buscar facturas de salida"
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
                  className="text-ink-muted hover:text-ink flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="size-3.5"
                    aria-hidden="true"
                  />
                </button>
              ) : undefined
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="border-primary/20 bg-primary/10 text-primary rounded-xl border px-3 py-2 text-xs font-semibold tabular-nums">
            Recaudado: {formatCurrencyAmount(counts.totalAmount, 'COP')}
          </div>

          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            aria-label="Actualizar facturas"
            title="Actualizar facturas"
            className="border-line bg-canvas text-ink hover:bg-panel inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className="size-3.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const active = conditionFilter === filter.id
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-primary bg-primary text-white shadow-2xs'
                  : 'border-line bg-canvas text-ink-muted hover:text-ink'
              }`}
            >
              <span>{filter.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-panel text-ink'
                }`}
              >
                {filter.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
})
