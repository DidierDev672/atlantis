import { memo, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faCalendarCheck,
  faClock,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons'
import { catalogApi } from '../../../../shared/catalog'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import {
  formatStayDateAndTime,
  type SalidaHuespedItem,
} from '../../domain/salida-huesped'

export interface CuentaHuespedEstadiaMetaProps {
  guest: SalidaHuespedItem
}

interface ResolvedRoomMeta {
  roomId: string
  number: string
  floor: string
}

function cleanRoomNumber(raw?: string | null): string {
  const value = (raw ?? '').replace(/^Hab\.?\s*/i, '').trim()
  return value
}

function cleanFloorNumber(raw?: string | number | null): string {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw)
  }
  const value = String(raw ?? '')
    .replace(/^Piso\s*/i, '')
    .trim()
  return value
}

/**
 * Molécula: Muestra la sección de habitación (número de habitación + número de piso)
 * y, debajo, la fecha de entrada del huésped.
 */
export const CuentaHuespedEstadiaMeta = memo(function CuentaHuespedEstadiaMeta({
  guest,
}: CuentaHuespedEstadiaMetaProps) {
  const { network } = useDeviceResourceProfile()
  const resolvedRoomId = (guest.primaryRoomId || guest.roomId || '').trim()
  const initialNumber = cleanRoomNumber(guest.roomNumber)
  const initialFloor = cleanFloorNumber(guest.roomFloor)

  const [fetchedRoom, setFetchedRoom] = useState<ResolvedRoomMeta | null>(null)

  useEffect(() => {
    if (
      !resolvedRoomId ||
      (initialNumber && initialFloor) ||
      network.tier === 'offline'
    ) {
      return
    }

    let active = true

    const loadRoomDetails = async () => {
      try {
        const res = await catalogApi.getRoom(resolvedRoomId)
        if (!active || !res.data) return
        setFetchedRoom({
          roomId: resolvedRoomId,
          number: cleanRoomNumber(res.data.number),
          floor: cleanFloorNumber(res.data.floor),
        })
      } catch (err) {
        console.warn(
          '[CuentaHuespedEstadiaMeta] Error al resolver habitación:',
          err
        )
      }
    }

    void loadRoomDetails()

    return () => {
      active = false
    }
  }, [initialFloor, initialNumber, network.tier, resolvedRoomId])

  const activeFetchedRoom =
    fetchedRoom?.roomId === resolvedRoomId ? fetchedRoom : null

  const roomNumberDisplay =
    initialNumber || activeFetchedRoom?.number || 'Sin asignar'
  const roomFloorDisplay =
    initialFloor || activeFetchedRoom?.floor || 'Sin piso'

  const { checkInDateDisplay, checkInTimeDisplay } = useMemo(() => {
    const fallback = formatStayDateAndTime(guest.checkInDateRaw)
    const dateDisplay = guest.checkInDateFormatted?.trim() || fallback.dateText
    const rawTime = guest.checkInTimeFormatted?.trim() || fallback.timeText
    const timeDisplay = rawTime && rawTime !== '—' ? rawTime : ''
    return {
      checkInDateDisplay: dateDisplay,
      checkInTimeDisplay: timeDisplay,
    }
  }, [
    guest.checkInDateFormatted,
    guest.checkInDateRaw,
    guest.checkInTimeFormatted,
  ])

  return (
    <div className="space-y-3">
      {/* 1. Sección de habitación: Número de habitación + Número de piso */}
      <section
        aria-label="Información de habitación"
        className="border-line/70 bg-canvas/50 rounded-2xl border p-3.5"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
              <FontAwesomeIcon
                icon={faBed}
                className="size-4"
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0">
              <p className="text-ink-muted text-[11px] font-medium">
                Número de habitación
              </p>
              <p className="text-ink truncate text-sm font-bold tabular-nums">
                {roomNumberDisplay}
              </p>
            </div>
          </div>

          <div className="border-line/50 flex items-center gap-3 border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
            <span className="bg-secondary/15 text-secondary grid size-9 shrink-0 place-items-center rounded-xl">
              <FontAwesomeIcon
                icon={faLayerGroup}
                className="size-4"
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0">
              <p className="text-ink-muted text-[11px] font-medium">
                Número de piso
              </p>
              <p className="text-ink truncate text-sm font-bold tabular-nums">
                {roomFloorDisplay}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Fecha de entrada del huésped */}
      <section
        aria-label="Fecha de entrada del huésped"
        className="border-line/70 bg-canvas/50 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3.5 py-3"
      >
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
            <FontAwesomeIcon
              icon={faCalendarCheck}
              className="size-4"
              aria-hidden="true"
            />
          </span>
          <div>
            <p className="text-ink-muted text-[11px] font-medium">
              Fecha de entrada del huésped
            </p>
            <p className="text-ink text-sm font-semibold">
              {checkInDateDisplay}
            </p>
          </div>
        </div>

        {checkInTimeDisplay && (
          <span className="border-line bg-panel text-ink-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium">
            <FontAwesomeIcon
              icon={faClock}
              className="text-primary size-3"
              aria-hidden="true"
            />
            <span>{checkInTimeDisplay}</span>
          </span>
        )}
      </section>
    </div>
  )
})
