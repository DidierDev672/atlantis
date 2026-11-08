import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faCalendarDays,
  faUsers,
  faCircleDot,
  faDollarSign,
  faEye,
} from '@fortawesome/free-solid-svg-icons'
import { motion } from 'motion/react'
import { staggerContainer, staggerItem } from '../../../../design-tokens/motion'
import type { ReservaViewItem } from '../../domain/reserva-list-types'
import { ReservaStateBadge } from '../atoms/reserva-state-badge'
import { ReservaCardItem } from './reserva-card-item'

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

interface ReservasTablaViewProps {
  items: ReservaViewItem[]
  onSelect?: (id: string) => void
  onSelectHuesped?: (personId: string) => void
}

export function ReservasTablaView({ items, onSelect, onSelectHuesped }: ReservasTablaViewProps) {
  return (
    <>
      {/* Visualización adaptable en tarjetas para dispositivos móviles */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        className="grid grid-cols-1 gap-4 md:hidden"
      >
        {items.map((item) => (
          <ReservaCardItem
            key={`responsive-card-${item.id}`}
            item={item}
            onSelect={onSelect}
            onSelectHuesped={onSelectHuesped}
          />
        ))}
      </motion.div>

      {/* Visualización en tabla para pantallas medianas y de escritorio */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-panel shadow-xs">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-line bg-surface/40 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} className="size-3 text-neutral" />
                  <span>Huésped</span>
                </span>
              </th>
              <th scope="col" className="px-5 py-3.5">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendarDays} className="size-3 text-neutral" />
                  <span>Entrada</span>
                </span>
              </th>
              <th scope="col" className="px-5 py-3.5">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendarDays} className="size-3 text-neutral" />
                  <span>Salida</span>
                </span>
              </th>
              <th scope="col" className="px-5 py-3.5 text-center">
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUsers} className="size-3 text-neutral" />
                  <span>Huéspedes</span>
                </span>
              </th>
              <th scope="col" className="px-5 py-3.5">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCircleDot} className="size-3 text-neutral" />
                  <span>Estado</span>
                </span>
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <FontAwesomeIcon icon={faDollarSign} className="size-3 text-neutral" />
                  <span>Precio Total</span>
                </span>
              </th>
              <th scope="col" className="px-5 py-3.5 text-center w-14">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            className="divide-y divide-line/60"
          >
            {items.map((item) => (
              <motion.tr
                key={item.id}
                variants={staggerItem}
                className="transition-colors hover:bg-canvas/50"
              >
                {/* Huésped */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
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
                      className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary border border-primary/25 shadow-2xs select-none hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {item.personDisplayName
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join('') || 'HT'}
                    </button>
                    <span className="font-medium text-ink truncate">{item.personDisplayName}</span>
                  </div>
                </td>

                {/* Entrada */}
                <td className="px-5 py-4 text-xs text-ink whitespace-nowrap">
                  {item.checkInFormatted}
                </td>

                {/* Salida */}
                <td className="px-5 py-4 text-xs text-ink whitespace-nowrap">
                  <div>
                    <span>{item.checkOutFormatted}</span>
                    <span className="block text-[11px] text-primary font-medium">
                      ({item.nights} {item.nights === 1 ? 'noche' : 'noches'})
                    </span>
                  </div>
                </td>

                {/* Huéspedes */}
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden items-center justify-center">
                      {(item.guests && item.guests.length > 0
                        ? item.guests
                        : [
                            {
                              id: item.personId,
                              name: item.personDisplayName,
                              initials:
                                item.personDisplayName
                                  .split(' ')
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((w) => w[0]?.toUpperCase())
                                  .join('') || 'HT',
                            },
                          ]
                      )
                        .slice(0, 3)
                        .map((g, idx) => {
                          const pal = AGENT_GUEST_PALETTE[idx % AGENT_GUEST_PALETTE.length]
                          const targetId = g.id || (idx === 0 ? item.personId : undefined)
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (targetId && onSelectHuesped) {
                                  onSelectHuesped(targetId)
                                }
                              }}
                              title={`Ver información de ${g.name}`}
                              aria-label={`Ver información de ${g.name}`}
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold shadow-2xs ring-2 ring-panel select-none border ${pal.bg} ${pal.text} ${pal.border} hover:scale-110 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-primary`}
                            >
                              {g.initials}
                            </button>
                          )
                        })}
                      {item.numberOfGuests > 3 && (
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-[9px] font-bold text-secondary border border-surface/80 ring-2 ring-panel select-none shadow-2xs"
                          title={`+${item.numberOfGuests - 3} huéspedes adicionales`}
                        >
                          +{item.numberOfGuests - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Estado */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <ReservaStateBadge label={item.stateLabel} tone={item.stateTone} status={item.state} />
                </td>

                {/* Precio */}
                <td className="px-5 py-4 text-right font-bold text-primary whitespace-nowrap">
                  {item.totalPriceFormatted}
                </td>

                {/* Acción de visualización de detalle */}
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  {onSelect && (
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      aria-label="Visualizar detalle de la reserva"
                      title="Visualizar detalle"
                      className="inline-flex size-8 items-center justify-center rounded-xl border border-line bg-surface/60 text-ink-muted hover:border-primary/40 hover:bg-primary hover:text-white transition-all active:scale-95"
                    >
                      <FontAwesomeIcon icon={faEye} className="size-3.5" />
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
    </>
  )
}
