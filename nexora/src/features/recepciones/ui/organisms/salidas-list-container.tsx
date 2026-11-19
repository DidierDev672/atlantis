import { useCallback, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDoorOpen, faFilterCircleXmark } from '@fortawesome/free-solid-svg-icons'
import {
  InfiniteScroll,
  InfiniteScrollEnd,
} from '../../../../shared/ui/InfiniteScroll'
import { Loading } from '../../../../shared/loading'
import type {
  SalidaFilterOption,
  SalidaHuespedItem,
} from '../../domain/salida-huesped'
import { SalidaHuespedCard } from '../molecules/salida-huesped-card'

const PAGE_SIZE = 9

export interface SalidasListContainerProps {
  guests: SalidaHuespedItem[]
  searchQuery: string
  departureFilter: SalidaFilterOption
  onResetFilters: () => void
  isServiceRequestsLoading?: boolean
  onViewAccount?: (guest: SalidaHuespedItem) => void
}

export function SalidasListContainer({
  guests,
  searchQuery,
  departureFilter,
  onResetFilters,
  isServiceRequestsLoading = false,
  onViewAccount,
}: SalidasListContainerProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [prevGuests, setPrevGuests] = useState(guests)

  if (prevGuests !== guests) {
    setPrevGuests(guests)
    setVisibleCount(PAGE_SIZE)
  }

  const visibleGuests = guests.slice(0, visibleCount)
  const hasMore = visibleCount < guests.length

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 250))
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, guests.length))
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, guests.length])

  const hasActiveFilters =
    searchQuery.trim().length > 0 || departureFilter !== 'todos'

  if (guests.length === 0) {
    return (
      <div className="border-line bg-panel flex flex-col items-center justify-center rounded-2xl border px-6 py-16 text-center shadow-xs">
        <div className="bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-2xl">
          <FontAwesomeIcon
            icon={hasActiveFilters ? faFilterCircleXmark : faDoorOpen}
            className="size-6"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-ink text-base font-bold">
          {hasActiveFilters
            ? 'No encontramos huéspedes con esos filtros'
            : 'Aún no hay salidas registradas'}
        </h2>
        <p className="text-ink-muted mt-1.5 max-w-md text-xs leading-relaxed sm:text-sm">
          {hasActiveFilters
            ? 'Prueba ajustando el texto de búsqueda o cambiando la programación de salida para ver más resultados.'
            : 'Cuando existan huéspedes asociados a una recepción o reserva, aparecerán listados aquí.'}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="bg-primary mt-5 cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
          >
            Restablecer filtros
          </button>
        )}
      </div>
    )
  }

  return (
    <InfiniteScroll
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      isLoading={loadingMore}
      loader={
        <div className="flex justify-center py-6">
          <Loading
            variant="inline"
            size="sm"
            label="Cargando más huéspedes…"
            delay={0}
          />
        </div>
      }
      endMessage={
        <InfiniteScrollEnd
          label={`Has visualizado los ${guests.length} ${
            guests.length === 1 ? 'huésped' : 'huéspedes'
          } disponibles`}
        />
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleGuests.map((guest) => (
          <SalidaHuespedCard
            key={guest.internalKey}
            guest={guest}
            isServiceRequestsLoading={isServiceRequestsLoading}
            onViewAccount={onViewAccount}
          />
        ))}
      </div>
    </InfiniteScroll>
  )
}
