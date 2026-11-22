import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faRotateRight,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import type { DrawerGuestItem } from '../../application/fetch-drawer-stay-guests';
import { DrawerGuestCardItem } from '../atoms/drawer-guest-card-item';
import { PisoAccordionChevron } from '../atoms/piso-accordion-chevron';

const LazyDrawerGuestsSearchBar = lazy(
  () => import('./drawer-guests-search-bar')
);

export interface DrawerStayGuestsListProps {
  guests: DrawerGuestItem[];
  fallbackGuestName?: string;
  guestsCount: number;
  nights: number;
  loading: boolean;
}

/**
 * Molécula: Acordeón minimalista de huéspedes vinculados con búsqueda en tiempo real si hay > 3 huéspedes.
 */
export const DrawerStayGuestsList = memo(function DrawerStayGuestsList({
  guests,
  fallbackGuestName = 'Huésped Registrado',
  guestsCount,
  nights,
  loading,
}: DrawerStayGuestsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);

  const displayList = useMemo<DrawerGuestItem[]>(
    () =>
      guests.length > 0
        ? guests
        : [
            {
              id: 'fallback-primary',
              name: fallbackGuestName,
              isPrimary: true,
            },
          ],
    [fallbackGuestName, guests]
  );

  const primaryGuest = displayList[0];
  const companionsCount = Math.max(0, displayList.length - 1);
  const hasMultipleGuests = displayList.length > 1;
  const showSearchBar = displayList.length > 3;

  const filteredGuests = useMemo(() => {
    try {
      const q = deferredQuery.trim().toLowerCase();
      if (!q) return displayList;
      return displayList.filter((guest) => {
        const nameMatch = guest.name.toLowerCase().includes(q);
        const docMatch = (guest.documentLabel ?? '').toLowerCase().includes(q);
        const phoneMatch = (guest.phoneNumber ?? '').toLowerCase().includes(q);
        return nameMatch || docMatch || phoneMatch;
      });
    } catch {
      return displayList;
    }
  }, [deferredQuery, displayList]);

  const handleToggleAccordion = useCallback(() => {
    try {
      setIsExpanded((prev) => !prev);
    } catch (err) {
      console.error('Error al alternar acordeón de huéspedes:', err);
    }
  }, []);

  return (
    <div className="space-y-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 p-4">
      {/* Cabecera / Botón de acordeón */}
      {hasMultipleGuests ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={handleToggleAccordion}
          className="focus-visible:ring-primary/40 flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Huéspedes vinculados ({displayList.length})
              </span>
              {loading && (
                <FontAwesomeIcon
                  icon={faRotateRight}
                  className="size-3 animate-spin text-indigo-500"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-ink truncate text-sm font-bold">
                {primaryGuest.name}
              </span>
              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                +{companionsCount}{' '}
                {companionsCount === 1 ? 'acompañante' : 'acompañantes'}
              </span>
            </div>
          </div>

          <PisoAccordionChevron isOpen={isExpanded} />
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Huésped Titular
            </span>
            {loading && (
              <FontAwesomeIcon
                icon={faRotateRight}
                className="size-3.5 animate-spin text-indigo-500"
                aria-hidden="true"
              />
            )}
          </div>
          <ul className="list-none">
            <DrawerGuestCardItem guest={primaryGuest} />
          </ul>
        </div>
      )}

      {/* Cuerpo expandible del acordeón cuando hay múltiples huéspedes */}
      <AnimatePresence initial={false}>
        {hasMultipleGuests && isExpanded && (
          <motion.div
            key="guests-accordion-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-indigo-500/15 pt-3">
              {showSearchBar && (
                <Suspense
                  fallback={
                    <div className="bg-line/40 h-9 w-full animate-pulse rounded-xl" />
                  }
                >
                  <LazyDrawerGuestsSearchBar
                    value={searchQuery}
                    matchedCount={filteredGuests.length}
                    totalCount={displayList.length}
                    onChange={setSearchQuery}
                    onClear={() => setSearchQuery('')}
                  />
                </Suspense>
              )}

              {filteredGuests.length === 0 ? (
                <div className="border-indigo-500/15 bg-panel/70 flex flex-col items-center gap-1.5 rounded-xl border py-4 text-center">
                  <p className="text-ink-muted text-xs">
                    No se encontró ningún huésped con &ldquo;{searchQuery.trim()}&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-primary cursor-pointer text-[11px] font-semibold hover:underline"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <ul
                  className="max-h-60 space-y-2 overflow-y-auto pr-0.5"
                  aria-label="Lista de huéspedes de la habitación"
                >
                  {filteredGuests.map((guest) => (
                    <DrawerGuestCardItem key={guest.id} guest={guest} />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumen de estancia */}
      <div className="text-ink-muted flex flex-wrap items-center gap-4 border-t border-indigo-500/15 pt-2.5 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="size-3.5 text-indigo-500"
            aria-hidden="true"
          />
          <span>
            {nights} {nights === 1 ? 'noche' : 'noches'}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FontAwesomeIcon
            icon={faUsers}
            className="size-3.5 text-indigo-500"
            aria-hidden="true"
          />
          <span>
            {guestsCount} {guestsCount === 1 ? 'huésped' : 'huéspedes'}
          </span>
        </span>
      </div>
    </div>
  );
});

export default DrawerStayGuestsList;
