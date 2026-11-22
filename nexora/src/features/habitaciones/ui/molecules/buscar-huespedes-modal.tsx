import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faRotateRight,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
  PERSONS_PAGE_SIZE,
  searchPersonsCached,
  type CachedPersonItem,
} from '../../infrastructure/persons-search-cache';
import { useDeviceResourceProfile } from '../../application/use-device-resource-profile';

const LazyBuscarHuespedCard = lazy(
  () => import('../atoms/buscar-huesped-card')
);
const LazyBuscarHuespedesFooter = lazy(
  () => import('./buscar-huespedes-footer')
);

export type PersonItem = CachedPersonItem;

export interface BuscarHuespedesModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAllowed: number;
  selectedGuests: PersonItem[];
  onConfirmSelection: (selected: PersonItem[]) => void;
  roomNumber?: string | number;
}

/**
 * Modal paginado y cacheado para buscar huéspedes (`GET /persons?page&limit&search`)
 * con debounce (300ms) y descarga acotada de 20 registros por página.
 */
export const BuscarHuespedesModal = memo(function BuscarHuespedesModal({
  isOpen,
  onClose,
  maxAllowed,
  selectedGuests,
  onConfirmSelection,
  roomNumber,
}: BuscarHuespedesModalProps) {
  const {
    policy: { enableBackdropBlur, personsPageLimit },
  } = useDeviceResourceProfile();
  const [persons, setPersons] = useState<PersonItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tempSelected, setTempSelected] = useState<PersonItem[]>(selectedGuests);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<{
    title: string;
    message: string;
    category: 'warning' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setTempSelected(selectedGuests);
      setLimitNotice(null);
      setErrorNotice(null);
    })();
    return () => {
      active = false;
    };
  }, [isOpen, selectedGuests]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  const loadPersonsPage = useCallback(
    async (targetPage: number, query: string, forceRefresh = false) => {
      setIsLoading(true);
      setErrorNotice(null);
      try {
        const res = await searchPersonsCached({
          search: query,
          page: targetPage,
          limit: personsPageLimit || PERSONS_PAGE_SIZE,
          forceRefresh,
        });
        setPersons(res.items);
        setTotalCount(res.totalCount);
        setHasMore(res.hasMore);
        setErrorNotice(res.errorNotice ?? null);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setPersons([]);
        setErrorNotice({
          title: 'Intermitencia de conexión',
          message: `Tus datos están protegidos. No se pudo consultar el catálogo: ${errMsg}.`,
          category: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [personsPageLimit]
  );

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    void (async () => {
      await Promise.resolve();
      if (!isMounted) return;
      await loadPersonsPage(page, debouncedSearch, false);
    })();
    return () => {
      isMounted = false;
    };
  }, [isOpen, page, debouncedSearch, loadPersonsPage]);

  const handleTogglePerson = useCallback(
    (person: PersonItem) => {
      try {
        setLimitNotice(null);
        const isAlreadySelected = tempSelected.some(
          (item) => item.id === person.id
        );
        if (isAlreadySelected) {
          setTempSelected((prev) =>
            prev.filter((item) => item.id !== person.id)
          );
          return;
        }
        if (tempSelected.length >= maxAllowed) {
          setLimitNotice(
            `Solo puedes seleccionar hasta ${maxAllowed} huésped(es) según la cantidad indicada en la estancia.`
          );
          return;
        }
        setTempSelected((prev) => [...prev, person]);
      } catch (err) {
        console.error('Error al seleccionar huésped:', err);
      }
    },
    [maxAllowed, tempSelected]
  );

  const handleConfirm = useCallback(() => {
    try {
      onConfirmSelection(tempSelected);
      onClose();
    } catch (err) {
      console.error('Error al confirmar selección:', err);
    }
  }, [onClose, onConfirmSelection, tempSelected]);

  const selectedIds = useMemo(
    () => new Set(tempSelected.map((t) => t.id)),
    [tempSelected]
  );
  const selectedCount = tempSelected.length;
  const isLimitReached = selectedCount >= maxAllowed;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`fixed inset-0 cursor-pointer bg-stone-950/70 ${enableBackdropBlur ? 'backdrop-blur-xs' : ''}`}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-buscar-huespedes-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="border-line/80 bg-panel relative z-10 my-auto flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl"
          >
            <div className="border-line/60 shrink-0 space-y-3 border-b p-5 pb-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 pr-8">
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl shadow-xs">
                    <FontAwesomeIcon icon={faUsers} className="size-4" />
                  </span>
                  <div>
                    <h3
                      id="modal-buscar-huespedes-title"
                      className="text-ink text-lg font-black tracking-tight sm:text-xl"
                    >
                      Huéspedes Registrados
                    </h3>
                    <p className="text-ink-muted text-xs">
                      Selecciona huéspedes para la Habitación{' '}
                      {roomNumber || 'seleccionada'} · Página {page}
                      {totalCount > 0 ? ` (${totalCount} reg.)` : ''}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      void loadPersonsPage(page, debouncedSearch, true)
                    }
                    title="Actualizar catálogo desde el servidor"
                    aria-label="Actualizar catálogo de huéspedes"
                    className="border-line bg-canvas text-ink-muted hover:text-ink grid size-8 cursor-pointer place-items-center rounded-xl border transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon
                      icon={faRotateRight}
                      className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <div className="border-primary/30 bg-primary/10 text-primary hidden items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-bold sm:inline-flex">
                    <span>Capacidad:</span>
                    <span className="text-ink font-black">
                      {selectedCount} / {maxAllowed}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="border-line bg-canvas/80 text-ink-muted hover:bg-panel hover:text-ink focus-visible:ring-primary absolute top-5 right-5 z-30 grid size-8.5 cursor-pointer place-items-center rounded-full border shadow-2xs transition-colors focus-visible:ring-2"
                title="Cerrar búsqueda (Esc)"
                aria-label="Cerrar modal"
              >
                ×
              </button>

              <div className="relative">
                <div className="text-ink-muted pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="size-3.5" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, documento o correo electrónico…"
                  className="border-line bg-canvas/70 text-ink placeholder:text-ink-muted/70 focus:border-primary focus:bg-canvas focus:ring-primary/20 w-full rounded-xl border py-2.5 pr-8 pl-10 text-xs font-medium transition-colors focus:ring-2 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-ink-muted hover:text-ink absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-xs"
                    title="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>

              {limitNotice && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <span className="mt-0.5 shrink-0 font-bold">⚠️</span>
                  <div>
                    <p className="font-semibold">Límite de selección alcanzado</p>
                    <p className="text-ink-muted text-[11px] leading-relaxed">
                      {limitNotice}
                    </p>
                  </div>
                </div>
              )}

              {errorNotice && (
                <div className="space-y-1 rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-700 dark:text-red-300">
                  <div className="flex items-center gap-2 font-bold">
                    <span>⚠️</span>
                    <span>{errorNotice.title}</span>
                  </div>
                  <p className="text-ink-muted leading-relaxed">
                    {errorNotice.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-14">
                  <div className="border-primary size-8 animate-spin rounded-full border-3 border-t-transparent" />
                  <p className="text-ink-muted animate-pulse text-xs font-medium">
                    Consultando huéspedes registrados…
                  </p>
                </div>
              ) : persons.length === 0 ? (
                <div className="border-line space-y-2 rounded-2xl border border-dashed p-10 text-center">
                  <h4 className="text-ink text-sm font-bold">
                    No se encontraron resultados
                  </h4>
                  <p className="text-ink-muted mx-auto max-w-sm text-xs">
                    {searchTerm
                      ? `No hay huéspedes que coincidan con "${searchTerm}".`
                      : 'Aún no hay personas registradas en el catálogo del sistema.'}
                  </p>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="bg-line/30 h-28 w-full animate-pulse rounded-2xl" />
                  }
                >
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {persons.map((person) => {
                      const isSelected = selectedIds.has(person.id);
                      return (
                        <LazyBuscarHuespedCard
                          key={person.id}
                          person={person}
                          isSelected={isSelected}
                          isDisabled={isLimitReached && !isSelected}
                          onToggle={handleTogglePerson}
                        />
                      );
                    })}
                  </div>
                </Suspense>
              )}

            </div>

            <Suspense fallback={null}>
              <LazyBuscarHuespedesFooter
                page={page}
                hasMore={hasMore}
                isLoading={isLoading}
                selectedCount={selectedCount}
                maxAllowed={maxAllowed}
                onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
                onNextPage={() => setPage((p) => p + 1)}
                onClose={onClose}
                onConfirm={handleConfirm}
              />
            </Suspense>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
});

export default BuscarHuespedesModal;
