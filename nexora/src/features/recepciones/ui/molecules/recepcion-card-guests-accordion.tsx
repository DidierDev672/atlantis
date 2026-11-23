import { memo, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faUsers } from '@fortawesome/free-solid-svg-icons';
import { detectarRecursosDispositivoRecepciones } from '../../infrastructure/recepciones-resource-detector';
import { catalogApi } from '../../../../shared/catalog';
import type { Recepcion } from '../../domain/recepcion';
import { formatGuestInitials } from '../../domain/stay';

export interface LinkedGuestItem {
  id: string;
  name: string;
  secondary?: string;
}

export interface RecepcionCardGuestsAccordionProps {
  primaryGuest?: Recepcion['huesped'];
  guestLabel?: string;
  personIds?: string[];
  onSelectGuest?: (guestId: string) => void;
}

/**
 * Molécula: Acordeón con la lista de huéspedes vinculados a la recepción.
 * Realiza carga perezosa con async/await y try/catch al desplegarse.
 */
export const RecepcionCardGuestsAccordion = memo(
  function RecepcionCardGuestsAccordion({
    primaryGuest,
    guestLabel,
    personIds,
    onSelectGuest,
  }: RecepcionCardGuestsAccordionProps) {
    const contentId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [resolvedMap, setResolvedMap] = useState<
      Record<string, LinkedGuestItem>
    >({});
    const [loadingGuests, setLoadingGuests] = useState(false);

    const uniqueIds = useMemo(() => {
      try {
        const ids = new Set<string>();
        if (Array.isArray(personIds)) {
          for (const rawId of personIds) {
            const clean = String(rawId ?? '').trim();
            if (clean) ids.add(clean);
          }
        }
        if (primaryGuest?.id) {
          ids.add(primaryGuest.id);
        }
        return Array.from(ids);
      } catch (err) {
        console.error('Error al normalizar IDs de huéspedes:', err);
        return [];
      }
    }, [personIds, primaryGuest?.id]);

    const guestsList: LinkedGuestItem[] = useMemo(() => {
      if (uniqueIds.length === 0) {
        const fallbackName = primaryGuest?.name || guestLabel;
        if (!fallbackName) return [];
        const secondaryParts = [
          primaryGuest?.documentNumber
            ? `Doc. ${primaryGuest.documentNumber}`
            : null,
          primaryGuest?.phoneNumber ?? null,
        ].filter(Boolean);
        return [
          {
            id: primaryGuest?.id || 'primary-guest',
            name: fallbackName,
            secondary: secondaryParts.join(' · ') || undefined,
          },
        ];
      }

      return uniqueIds.map((id, idx) => {
        if (primaryGuest && primaryGuest.id === id) {
          const secondaryParts = [
            primaryGuest.documentNumber
              ? `Doc. ${primaryGuest.documentNumber}`
              : null,
            primaryGuest.phoneNumber ?? null,
          ].filter(Boolean);
          return {
            id,
            name: primaryGuest.name || guestLabel || `Huésped ${idx + 1}`,
            secondary: secondaryParts.join(' · ') || undefined,
          };
        }

        if (resolvedMap[id]) {
          return resolvedMap[id];
        }

        return {
          id,
          name: idx === 0 && guestLabel ? guestLabel : `Huésped ${idx + 1}`,
        };
      });
    }, [guestLabel, primaryGuest, resolvedMap, uniqueIds]);

    useEffect(() => {
      if (!isOpen || uniqueIds.length === 0) return;

      const missingIds = uniqueIds.filter(
        (id) => !(primaryGuest?.id === id && primaryGuest.name) && !resolvedMap[id]
      );
      if (missingIds.length === 0) return;

      let active = true;

      const fetchGuests = async () => {
        setLoadingGuests(true);
        try {
          const batchSize =
            detectarRecursosDispositivoRecepciones().policy.batchConcurrency;
          const allSettled: PromiseSettledResult<{
            id: string;
            person: Awaited<ReturnType<typeof catalogApi.getPerson>>['data'];
          }>[] = [];

          for (let i = 0; i < missingIds.length; i += batchSize) {
            if (!active) return;
            const chunk = missingIds.slice(i, i + batchSize);
            const chunkRes = await Promise.allSettled(
              chunk.map(async (id) => {
                const res = await catalogApi.getPerson(id);
                return { id, person: res.data };
              })
            );
            allSettled.push(...chunkRes);
          }

          if (!active) return;

          setResolvedMap((prev) => {
            const next = { ...prev };
            for (const entry of allSettled) {
              if (entry.status === 'fulfilled' && entry.value.person) {
                const { id, person } = entry.value;
                const secondaryParts = [
                  person.document_number
                    ? `Doc. ${person.document_number}`
                    : null,
                  person.phone_number ?? null,
                ].filter(Boolean);
                next[id] = {
                  id,
                  name: person.name || 'Huésped registrado',
                  secondary: secondaryParts.join(' · ') || undefined,
                };
              }
            }
            return next;
          });
        } catch (err) {
          console.error('Error al cargar huéspedes vinculados:', err);
        } finally {
          if (active) setLoadingGuests(false);
        }
      };

      void fetchGuests();

      return () => {
        active = false;
      };
    }, [isOpen, primaryGuest?.id, primaryGuest?.name, resolvedMap, uniqueIds]);

    const handleToggle = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        setIsOpen((prev) => !prev);
      } catch (err) {
        console.error('Error al alternar acordeón de huéspedes:', err);
      }
    }, []);

    const totalCount = guestsList.length;

    return (
      <div className="border-line/70 bg-canvas/50 overflow-hidden rounded-xl border">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="hover:bg-canvas focus-visible:ring-primary/40 flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-ink">
            <span className="bg-primary/10 text-primary grid size-6 shrink-0 place-items-center rounded-lg">
              <FontAwesomeIcon
                icon={faUsers}
                className="size-3"
                aria-hidden="true"
              />
            </span>
            <span className="truncate">
              Huéspedes vinculados ({totalCount})
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {!isOpen && totalCount > 0 && (
              <span className="text-ink-muted hidden max-w-[120px] truncate text-[11px] font-medium sm:inline">
                {guestsList[0].name}
                {totalCount > 1 ? ` +${totalCount - 1}` : ''}
              </span>
            )}
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-ink-muted size-3 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={contentId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-line/60 space-y-1.5 border-t px-3 py-2.5">
                {loadingGuests && guestsList.length === 0 ? (
                  <div className="bg-line/40 h-8 w-full animate-pulse rounded-lg" />
                ) : guestsList.length === 0 ? (
                  <p className="text-ink-muted text-xs italic">
                    Sin huéspedes vinculados
                  </p>
                ) : (
                  guestsList.map((guest, index) => {
                    const initials = formatGuestInitials(guest.name, index + 1);
                    const interactive = Boolean(onSelectGuest);

                    return (
                      <div
                        key={guest.id}
                        onClick={
                          interactive
                            ? (e) => {
                                e.stopPropagation();
                                try {
                                  onSelectGuest?.(guest.id);
                                } catch (err) {
                                  console.error(
                                    'Error al seleccionar huésped:',
                                    err
                                  );
                                }
                              }
                            : undefined
                        }
                        role={interactive ? 'button' : undefined}
                        tabIndex={interactive ? 0 : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors ${
                          interactive
                            ? 'hover:bg-primary/5 cursor-pointer'
                            : ''
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="border-primary/25 bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full border text-[11px] font-bold tracking-wider shadow-2xs"
                        >
                          {initials}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-ink truncate text-xs font-semibold">
                            {guest.name}
                          </p>
                          {guest.secondary && (
                            <p className="text-ink-muted truncate text-[11px]">
                              {guest.secondary}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

export default RecepcionCardGuestsAccordion;
