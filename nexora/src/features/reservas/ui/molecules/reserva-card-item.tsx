import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDays,
  faArrowRight,
  faDollarSign,
  faEye,
} from '@fortawesome/free-solid-svg-icons'
import { motion } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
import type { ReservaViewItem } from '../../domain/reserva-list-types'
import { ReservaStateBadge } from '../atoms/reserva-state-badge'
import { ReservaCardPlanet } from '../atoms/reserva-card-planet'

interface ReservaCardItemProps {
  item: ReservaViewItem
  onSelect?: (id: string) => void
  onSelectHuesped?: (personId: string) => void
}

/**
 * Tokens de color definidos en src/agent.md:
 * - primary:   #5a311f (Botones principales, encabezados, huésped titular)
 * - secondary: #67543e (Acentos, estados hover, acompañante 1)
 * - neutral:   #6d6e76 (Texto secundario, bordes, acompañante 2)
 * - surface:   #d4c7b7 (Fondos de panel/tarjetas, acompañante 3 o contador)
 */
const AGENT_GUEST_PALETTE = [
  {
    token: 'primary',
    bg: 'bg-primary/15',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  {
    token: 'secondary',
    bg: 'bg-secondary/20',
    text: 'text-secondary',
    border: 'border-secondary/35',
  },
  {
    token: 'neutral',
    bg: 'bg-neutral/15',
    text: 'text-neutral',
    border: 'border-neutral/30',
  },
  {
    token: 'surface',
    bg: 'bg-surface/80',
    text: 'text-ink',
    border: 'border-surface',
  },
] as const

export function ReservaCardItem({ item, onSelect, onSelectHuesped }: ReservaCardItemProps) {
  // Iniciales visuales del huésped principal
  const initials =
    item.personDisplayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'HT'

  // Lista de huéspedes con sus iniciales
  const guestsList =
    item.guests && item.guests.length > 0
      ? item.guests
      : [
          {
            name: item.personDisplayName,
            initials,
          },
        ]

  return (
    <motion.article
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-panel p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {/* Encabezado de la card: Planeta aleatorio en esquina superior izquierda, Huésped principal y Estado */}
      <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Planeta en la esquina superior izquierda de la card */}
          <ReservaCardPlanet id={item.id} size={30} />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const targetId = item.personId || item.personIds?.[0]
              if (targetId && onSelectHuesped) {
                onSelectHuesped(targetId)
              }
            }}
            title="Ver información del huésped"
            aria-label={`Ver información del huésped: ${item.personDisplayName}`}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary border border-primary/25 shadow-2xs select-none hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          >
            {initials}
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-ink text-sm sm:text-base leading-snug" title={item.personDisplayName}>
              {item.personDisplayName}
            </h3>
            <p className="text-[11px] text-neutral">Huésped principal</p>
          </div>
          {item.numberOfGuests > 1 && (
            <span
              className="shrink-0 rounded-md border border-neutral/20 bg-surface/80 px-1.5 py-0.5 text-[10px] font-semibold text-secondary"
              title={`${item.numberOfGuests} huéspedes en total`}
            >
              +{item.numberOfGuests - 1}
            </span>
          )}
        </div>

        <ReservaStateBadge label={item.stateLabel} tone={item.stateTone} status={item.state} />
      </div>

      {/* Fechas de entrada y salida con noches */}
      <div className="mt-3.5 space-y-2 rounded-xl border border-line/50 p-3 text-xs">
        <div className="flex items-center justify-between text-neutral">
          <span className="flex items-center gap-1.5 font-medium">
            <FontAwesomeIcon icon={faCalendarDays} className="size-3 text-neutral" />
            <span>Entrada</span>
          </span>
          <span className="font-semibold text-ink">{item.checkInFormatted}</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-neutral/70">
          <div className="h-px flex-1 bg-line/60" />
          <span className="flex items-center gap-1 font-medium text-primary">
            <FontAwesomeIcon icon={faArrowRight} className="size-2.5" />
            <span>{item.nights} {item.nights === 1 ? 'noche' : 'noches'}</span>
          </span>
          <div className="h-px flex-1 bg-line/60" />
        </div>

        <div className="flex items-center justify-between text-neutral">
          <span className="flex items-center gap-1.5 font-medium">
            <FontAwesomeIcon icon={faCalendarDays} className="size-3 text-neutral" />
            <span>Salida</span>
          </span>
          <span className="font-semibold text-ink">{item.checkOutFormatted}</span>
        </div>
      </div>

      {/* Pie de la card: Huéspedes con iniciales al lado izquierdo del Total */}
      <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
        {/* Apartado huésped: Iniciales de los huéspedes al lado izquierdo del Total con paleta agent.md */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex -space-x-1.5 overflow-hidden items-center"
            title={guestsList.map((g) => g.name).join(', ')}
            aria-label={`Huéspedes: ${guestsList.map((g) => g.name).join(', ')}`}
          >
            {guestsList.slice(0, 3).map((guest, idx) => {
              const pal = AGENT_GUEST_PALETTE[idx % AGENT_GUEST_PALETTE.length]
              const guestId = guest.id || (idx === 0 ? item.personId : undefined)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (guestId && onSelectHuesped) {
                      onSelectHuesped(guestId)
                    }
                  }}
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-2xs ring-2 ring-panel select-none border ${pal.bg} ${pal.text} ${pal.border} hover:scale-110 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-primary`}
                  title={`Ver información de ${guest.name}`}
                  aria-label={`Ver información de ${guest.name}`}
                >
                  {guest.initials}
                </button>
              )
            })}
            {item.numberOfGuests > 3 && (
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-secondary border border-surface/80 ring-2 ring-panel select-none shadow-2xs"
                title={`+${item.numberOfGuests - 3} huéspedes adicionales`}
              >
                +{item.numberOfGuests - 3}
              </div>
            )}
          </div>

          <div className="flex flex-col text-xs leading-tight">
            <span className="text-[10px] font-medium text-neutral tracking-wide">
              {item.numberOfGuests === 1 ? 'Huésped' : 'Huéspedes'}
            </span>
            <span className="font-semibold text-ink">
              {item.numberOfGuests} {item.numberOfGuests === 1 ? 'huésped' : 'huéspedes'}
            </span>
          </div>
        </div>

        {/* Sección Total al lado derecho */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-neutral font-medium">Total</p>
            <p className="flex items-center justify-end gap-1 text-sm sm:text-base font-bold text-primary">
              <FontAwesomeIcon icon={faDollarSign} className="size-3" />
              <span>{item.totalPriceFormatted.replace('$', '').trim()}</span>
            </p>
          </div>

          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-label="Visualizar detalle de la reserva"
              title="Visualizar detalle"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-line bg-surface/60 text-secondary hover:border-primary/40 hover:bg-primary hover:text-white transition-all active:scale-95"
            >
              <FontAwesomeIcon icon={faEye} className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
