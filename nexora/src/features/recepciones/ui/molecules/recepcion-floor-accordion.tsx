import { Suspense, lazy, memo, useCallback, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faLayerGroup,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { Input } from '../../../../shared/ui/Input';
import {
  buildFloorStatusBadges,
  filterFloorEntries,
  type FloorReceptionGroup,
  type RoomFloorStatusFilter,
  type RoomFloorStatusKey,
} from '../../domain/recepcion-floor';
import type { StayItem } from '../../domain/stay';
import { RecepcionFloorStatusPill } from '../atoms/recepcion-floor-status-pill';

const LazyRecepcionCard = lazy(() => import('./recepcion-card'));

export interface RecepcionFloorAccordionProps {
  group: FloorReceptionGroup;
  isOpen: boolean;
  activeBadgeFilter: RoomFloorStatusFilter;
  onToggle: (floorKey: string) => void;
  onSelectBadge: (floorKey: string, badge: RoomFloorStatusFilter) => void;
  onSelectStay: (stay: StayItem) => void;
  onOpenRoom: (roomId: string) => void;
  onSelectGuest: (personId: string) => void;
}

/**
 * Molécula: Acordeón operativo por piso con badges interactivos de estado,
 * buscador en tiempo real mediante Input.tsx y tarjetas RecepcionCard con carga perezosa.
 */
export const RecepcionFloorAccordion = memo(function RecepcionFloorAccordion({
  group,
  isOpen,
  activeBadgeFilter,
  onToggle,
  onSelectBadge,
  onSelectStay,
  onOpenRoom,
  onSelectGuest,
}: RecepcionFloorAccordionProps) {
  const panelId = useId();
  const [floorSearch, setFloorSearch] = useState('');

  const statusBadges = useMemo(
    () => buildFloorStatusBadges(group.entries),
    [group.entries]
  );

  const visibleEntries = useMemo(
    () => filterFloorEntries(group.entries, activeBadgeFilter, floorSearch),
    [activeBadgeFilter, floorSearch, group.entries]
  );

  const handleToggleFloor = useCallback(() => {
    try {
      onToggle(group.floorKey);
    } catch (err) {
      console.error('Error al alternar acordeón de piso:', err);
    }
  }, [group.floorKey, onToggle]);

  const handleBadgeClick = useCallback(
    (badgeKey: RoomFloorStatusKey) => {
      try {
        const nextFilter: RoomFloorStatusFilter =
          activeBadgeFilter === badgeKey ? 'all' : badgeKey;
        onSelectBadge(group.floorKey, nextFilter);
      } catch (err) {
        console.error('Error al seleccionar badge de piso:', err);
      }
    },
    [activeBadgeFilter, group.floorKey, onSelectBadge]
  );

  const handleClearFloorFilters = useCallback(() => {
    try {
      setFloorSearch('');
      onSelectBadge(group.floorKey, 'all');
    } catch (err) {
      console.error('Error al limpiar filtros del piso:', err);
    }
  }, [group.floorKey, onSelectBadge]);

  return (
    <article className="border-line bg-panel overflow-hidden rounded-2xl border shadow-xs">
      {/* Cabecera del acordeón: Piso + Badges interactivos + Chevron */}
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <button
          type="button"
          onClick={handleToggleFloor}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="focus-visible:ring-primary/40 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="bg-primary/10 text-primary border-primary/20 grid size-9 shrink-0 place-items-center rounded-xl border">
            <FontAwesomeIcon
              icon={faLayerGroup}
              className="size-4"
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-ink truncate text-sm font-extrabold sm:text-base">
                {group.floorLabel}
              </h3>
              <span className="border-line bg-canvas text-ink-muted rounded-full border px-2 py-0.5 text-[11px] font-semibold">
                {group.entries.length}{' '}
                {group.entries.length === 1 ? 'habitación' : 'habitaciones'}
              </span>
            </div>
          </div>
        </button>

        {/* Badges interactivos por estado + Botón expandir */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <div
            role="group"
            aria-label={`Filtrar habitaciones de ${group.floorLabel} por estado`}
            className="flex flex-wrap items-center gap-1.5"
          >
            {statusBadges.map((badge) => {
              const isActive = activeBadgeFilter === badge.key;
              const isDisabled = badge.count === 0 && !isActive;

              return (
                <RecepcionFloorStatusPill
                  key={badge.key}
                  statusKey={badge.key}
                  label={badge.label}
                  tone={badge.tone}
                  active={isActive}
                  disabled={isDisabled}
                  title={
                    isActive
                      ? `Quitar filtro ${badge.shortLabel}`
                      : `Filtrar por ${badge.shortLabel} en ${group.floorLabel}`
                  }
                  onClick={() => handleBadgeClick(badge.key)}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleToggleFloor}
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label={
              isOpen
                ? `Contraer ${group.floorLabel}`
                : `Expandir ${group.floorLabel}`
            }
            className="border-line bg-canvas text-ink-muted hover:border-primary/40 hover:text-primary grid size-8 shrink-0 cursor-pointer place-items-center rounded-xl border transition-colors"
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`size-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Contenido desplegable del piso */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-line/70 space-y-4 border-t p-4 sm:p-5">
              {/* Buscador en tiempo real dentro de la accordion con Input.tsx */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:max-w-md">
                  <Input
                    type="search"
                    value={floorSearch}
                    onChange={(e) => setFloorSearch(e.target.value)}
                    placeholder={`Buscar en ${group.floorLabel} por número, tipo, estado o huésped…`}
                    aria-label={`Buscar habitaciones en ${group.floorLabel}`}
                    icon={
                      <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="size-3.5"
                      />
                    }
                    inputClassName="py-2 text-xs bg-canvas"
                    action={
                      floorSearch ? (
                        <button
                          type="button"
                          onClick={() => setFloorSearch('')}
                          aria-label="Limpiar búsqueda de piso"
                          className="text-ink-muted hover:text-ink grid size-7 cursor-pointer place-items-center rounded-lg transition-colors"
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

                <span className="text-ink-muted text-xs font-medium">
                  Mostrando{' '}
                  <strong className="text-ink font-bold">
                    {visibleEntries.length}
                  </strong>{' '}
                  de {group.entries.length}
                </span>
              </div>

              {visibleEntries.length === 0 ? (
                <div className="border-line bg-canvas/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                  <p className="text-ink text-xs font-semibold">
                    No hay habitaciones que coincidan en {group.floorLabel}
                  </p>
                  <p className="text-ink-muted mt-1 text-[11px]">
                    Ajusta la búsqueda o el estado seleccionado.
                  </p>
                  {(floorSearch || activeBadgeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={handleClearFloorFilters}
                      className="text-primary border-line bg-panel mt-3 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold hover:underline"
                    >
                      Restablecer filtro del piso
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleEntries.map((entry) => (
                    <Suspense
                      key={entry.stay.id}
                      fallback={
                        <div className="border-line bg-canvas h-72 w-full animate-pulse rounded-2xl border" />
                      }
                    >
                      <LazyRecepcionCard
                        recepcion={entry.recepcion}
                        onOpenHabitacion={onOpenRoom}
                        onSelectGuest={onSelectGuest}
                        onViewDetail={() => onSelectStay(entry.stay)}
                        onCheckIn={() => onSelectStay(entry.stay)}
                      />
                    </Suspense>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
});

export default RecepcionFloorAccordion;
