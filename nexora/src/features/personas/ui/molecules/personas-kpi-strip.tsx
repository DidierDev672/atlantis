import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faDoorOpen,
  faStore,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import type { PersonasKpisSummary } from '../../application/use-personas-registros'
import { formatCurrencyAmount } from '../../domain/registro-huesped'

export interface PersonasKpiStripProps {
  kpis: PersonasKpisSummary
}

/**
 * Molécula: Tarjetas KPI operativas del día para la pestaña de Registros.
 */
export const PersonasKpiStrip = memo(function PersonasKpiStrip({
  kpis,
}: PersonasKpiStripProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="border-line bg-panel flex items-center gap-3.5 rounded-2xl border p-4 shadow-2xs">
        <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-xl">
          <FontAwesomeIcon
            icon={faUsers}
            className="size-5"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="text-ink-muted text-[11px] font-medium">
            Personas / Activos hoy
          </p>
          <p className="text-ink text-lg font-bold">
            {kpis.activeTodayCount}{' '}
            <span className="text-ink-muted text-xs font-normal">
              de {kpis.totalGuests} registrados
            </span>
          </p>
        </div>
      </div>

      <div className="border-line bg-panel flex items-center gap-3.5 rounded-2xl border p-4 shadow-2xs">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <FontAwesomeIcon
            icon={faDoorOpen}
            className="size-5"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="text-ink-muted text-[11px] font-medium">
            Salidas programadas hoy
          </p>
          <p className="text-ink text-lg font-bold">
            {kpis.departingTodayCount}{' '}
            <span className="text-ink-muted text-xs font-normal">
              por hacer Check-out
            </span>
          </p>
        </div>
      </div>

      <div className="border-line bg-panel flex items-center gap-3.5 rounded-2xl border p-4 shadow-2xs">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <FontAwesomeIcon
            icon={faBed}
            className="size-5"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="text-ink-muted text-[11px] font-medium">
            Deuda por Alojamiento
          </p>
          <p className="text-ink truncate text-lg font-bold">
            {formatCurrencyAmount(kpis.totalLodgingDebt)}
          </p>
        </div>
      </div>

      <div className="border-line bg-panel flex items-center gap-3.5 rounded-2xl border p-4 shadow-2xs">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <FontAwesomeIcon
            icon={faStore}
            className="size-5"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="text-ink-muted text-[11px] font-medium">
            Deuda por Tienda / Servicios
          </p>
          <p className="text-ink truncate text-lg font-bold">
            {formatCurrencyAmount(kpis.totalStoreDebt)}
          </p>
        </div>
      </div>
    </div>
  )
})
