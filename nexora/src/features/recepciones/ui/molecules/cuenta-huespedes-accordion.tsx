import { memo, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faUser,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { SalidaHuespedItem } from '../../domain/salida-huesped'
import {
  fetchStayGuestsOnDemand,
  getInitialStayGuests,
  type StayGuestNameEntry,
} from '../../infrastructure/stay-guests-api'

export interface CuentaHuespedesAccordionProps {
  guest: SalidaHuespedItem
}

interface RemoteGuestLoadState {
  guestKey: string
  entries: StayGuestNameEntry[]
}

/**
 * Molécula: Acordeón con los nombres de los huéspedes vinculados a la estadía.
 * Carga acompañantes bajo demanda con `async / await` + `try / catch` al abrirse.
 */
export const CuentaHuespedesAccordion = memo(function CuentaHuespedesAccordion({
  guest,
}: CuentaHuespedesAccordionProps) {
  const contentId = useId()
  const { network, policy } = useDeviceResourceProfile()
  const [openForKey, setOpenForKey] = useState<string | null>(null)
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [remoteState, setRemoteState] = useState<RemoteGuestLoadState | null>(
    null
  )

  const isOpen = openForKey === guest.internalKey

  const initialGuests = useMemo(() => getInitialStayGuests(guest), [guest])

  const guestsList = useMemo(() => {
    if (remoteState?.guestKey === guest.internalKey) {
      return remoteState.entries
    }
    return initialGuests
  }, [guest.internalKey, initialGuests, remoteState])

  useEffect(() => {
    if (
      !isOpen ||
      network.tier === 'offline' ||
      remoteState?.guestKey === guest.internalKey
    ) {
      return
    }

    let active = true

    const loadGuests = async () => {
      setLoadingRemote(true)
      try {
        const resolved = await fetchStayGuestsOnDemand({
          guest,
          maxConcurrentRequests: network.maxConcurrentRequests,
          isOffline: false,
        })
        if (!active) return
        setRemoteState({
          guestKey: guest.internalKey,
          entries: resolved,
        })
      } catch (err) {
        console.error(
          '[CuentaHuespedesAccordion] Error al cargar huéspedes:',
          err
        )
      } finally {
        if (active) {
          setLoadingRemote(false)
        }
      }
    }

    void loadGuests()

    return () => {
      active = false
    }
  }, [
    guest,
    isOpen,
    network.maxConcurrentRequests,
    network.tier,
    remoteState?.guestKey,
  ])

  const handleToggle = useCallback(() => {
    setOpenForKey((prev) =>
      prev === guest.internalKey ? null : guest.internalKey
    )
  }, [guest.internalKey])

  const totalCount = guestsList.length

  return (
    <section
      aria-label="Huéspedes de la estadía"
      className="border-line/70 bg-canvas/50 overflow-hidden rounded-2xl border"
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="hover:bg-canvas/80 focus-visible:ring-primary/50 flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
            <FontAwesomeIcon
              icon={faUsers}
              className="size-4"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0">
            <span className="text-ink flex items-center gap-2 text-xs font-bold sm:text-sm">
              <span>Huéspedes</span>
              <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums">
                {totalCount}
              </span>
            </span>
            {!isOpen && totalCount > 0 && (
              <span className="text-ink-muted block truncate text-[11px]">
                {guestsList[0].name}
                {totalCount > 1 ? ` y ${totalCount - 1} más` : ''}
              </span>
            )}
          </span>
        </span>

        <FontAwesomeIcon
          icon={faChevronDown}
          aria-hidden="true"
          className={`text-ink-muted size-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'text-primary rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            initial={policy.enableAnimations ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={policy.enableAnimations ? { height: 0, opacity: 0 } : undefined}
            transition={{
              duration: policy.enableAnimations ? 0.2 : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="overflow-hidden"
          >
            <div className="border-line/60 border-t px-3.5 py-3">
              {loadingRemote && guestsList.length === 0 ? (
                <p className="text-ink-muted text-xs">Cargando huéspedes…</p>
              ) : guestsList.length === 0 ? (
                <p className="text-ink-muted text-xs italic">
                  Sin huéspedes registrados
                </p>
              ) : (
                <ul
                  aria-label="Nombres de los huéspedes"
                  className="space-y-2"
                >
                  {guestsList.map((item) => (
                    <li
                      key={item.id}
                      className="border-line/50 bg-panel/70 flex items-center gap-2.5 rounded-xl border px-3 py-2"
                    >
                      <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="size-3"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="text-ink min-w-0 flex-1 truncate text-xs font-semibold">
                        {item.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
})
