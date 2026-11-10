import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBed, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import { motion } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
import { InfiniteScroll } from '../../../../shared/ui/InfiniteScroll'
import { Loading } from '../../../../shared/loading'
import type { ReservaViewItem, ReservaViewMode } from '../../domain/reserva-list-types'
import { ReservaCardItem } from '../molecules/reserva-card-item'
import { ReservasTablaView } from '../molecules/reservas-tabla-view'

interface ReservasListContainerProps {
  viewMode: ReservaViewMode
  items: ReservaViewItem[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => Promise<void> | void
  onResetFilters?: () => void
  onSelectReserva?: (id: string) => void
  onSelectHuesped?: (personId: string) => void
}

export function ReservasListContainer({
  viewMode,
  items,
  loading,
  hasMore,
  onLoadMore,
  onResetFilters,
  onSelectReserva,
  onSelectHuesped,
}: ReservasListContainerProps) {
  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel p-16 text-center shadow-xs">
        <Loading
          variant="block"
          size="md"
          label="Cargando reservas balanceadas…"
          description="Conectando con el catálogo de estadías mediante balanceo preventivo de carga."
          delay={0}
          minDuration={500}
        />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-panel p-12 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-surface text-neutral">
          <FontAwesomeIcon icon={faBed} className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-ink">Sin resultados que coincidan</h3>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-muted">
          No hay reservas para los criterios o búsqueda ingresados. Prueba modificando los filtros
          para ver más estadías.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition-colors"
          >
            <FontAwesomeIcon icon={faRotateRight} className="size-3 text-neutral" />
            <span>Restablecer filtros</span>
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <InfiniteScroll
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoading={loading}
      loader={
        <div className="flex items-center justify-center py-6">
          <Loading
            variant="inline"
            size="sm"
            label="Cargando más reservas…"
            delay={0}
            minDuration={400}
          />
        </div>
      }
      endMessage={
        <p className="py-8 text-center text-xs font-medium text-ink-muted">
          Has explorado todas las reservas registradas en este período.
        </p>
      }
    >
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ReservaCardItem
              key={item.id}
              item={item}
              onSelect={onSelectReserva}
              onSelectHuesped={onSelectHuesped}
            />
          ))}
        </div>
      ) : (
        <ReservasTablaView
          items={items}
          onSelect={onSelectReserva}
          onSelectHuesped={onSelectHuesped}
        />
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-6 pb-2">
          <button
            type="button"
            onClick={() => void onLoadMore()}
            className="border-line bg-panel hover:bg-surface text-ink inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold shadow-2xs transition active:scale-95"
          >
            <span>Cargar más reservas</span>
          </button>
        </div>
      )}
    </InfiniteScroll>
  )
}
