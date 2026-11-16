import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faCalendarDays,
  faDoorOpen,
  faEnvelope,
  faHotel,
  faPhone,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import {
  type RecepcionSeleccionada,
  formatBuilding,
  formatDocType,
  formatGender,
  formatReserveState,
  formatRoomStatus,
  formatRoomType,
  formatearFecha,
  formatearFechaHora,
  getReserveStateBadge,
  getRoomStatusColor,
} from '../../domain/estadias-recepcion'

export interface RecepcionEstanciaCardProps {
  recepcion: RecepcionSeleccionada
  isSelected: boolean
  onSelect: (recepcion: RecepcionSeleccionada) => void
}

/**
 * Molécula: Tarjeta de estancia/recepción en cascada (Huésped, Habitación, Reserva)
 * sin exponer IDs crudos al usuario.
 */
export function RecepcionEstanciaCard({
  recepcion: r,
  isSelected,
  onSelect,
}: RecepcionEstanciaCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(r)}
      title={`Seleccionar ${r.person?.name || r.huespedNombre} (Habitación ${r.room?.number || r.habitacionNumero})`}
      className={`group w-full cursor-pointer rounded-2xl border p-4 text-left transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 ring-primary/20 shadow-xs ring-2'
          : 'border-line bg-panel hover:border-primary/40 hover:bg-canvas'
      }`}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* 1. Datos del Huésped */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-ink group-hover:text-primary text-sm font-bold transition-colors">
                  {r.person?.name || r.huespedNombre}
                </h4>
                <div className="text-ink-muted mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <span>
                    {formatDocType(r.person?.document_type)}:{' '}
                    <strong className="text-ink font-medium">
                      {r.person?.document_number || '12345678'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>Género: {formatGender(r.person?.gender)}</span>
                  <span>·</span>
                  <span>Nac.: {formatearFecha(r.person?.date_of_birth)}</span>
                </div>
              </div>

              {r.reserve ? (
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getReserveStateBadge(
                    r.reserve.state
                  )}`}
                >
                  {formatReserveState(r.reserve.state)}
                </span>
              ) : (
                <span className="border-line bg-canvas text-ink-muted inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium">
                  Sin reserva
                </span>
              )}
            </div>

            <div className="text-ink-soft mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faPhone} className="size-2.5 text-primary" />
                <span>{r.person?.phone_number || '999888777'}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faEnvelope} className="size-2.5 text-primary" />
                <span>{r.person?.email || 'contacto@nexora.com'}</span>
              </span>
            </div>
          </div>

          {/* 2. Datos de la Habitación (/room) */}
          <div className="border-line/60 bg-canvas/70 rounded-xl border p-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-primary flex items-center gap-1.5 font-semibold">
                <FontAwesomeIcon icon={faDoorOpen} className="size-3" />
                <span>Habitación {r.room?.number || r.habitacionNumero}</span>
                <span className="text-ink-soft">·</span>
                <span className="text-ink font-medium">
                  Piso {r.room?.floor ?? 1}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-panel border-line text-ink-muted rounded-md border px-2 py-0.5 text-[10px] font-medium">
                  {formatRoomType(r.room?.room_types_id)}
                </span>
                <span className={`text-[10px] font-bold ${getRoomStatusColor(r.room?.status)}`}>
                  ● {formatRoomStatus(r.room?.status)}
                </span>
              </div>
            </div>

            <div className="text-ink-muted mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faBuilding} className="size-2.5 text-primary" />
                <span>{formatBuilding(r.room?.building_id)}</span>
              </span>
              <span className="text-ink-soft inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faHotel} className="size-2.5 text-primary" />
                <span>
                  {r.room?.has_reception ? 'Con recepción propia' : 'Recepción central'}
                </span>
              </span>
            </div>
          </div>

          {/* 3. Datos de la Reserva (/reserve) */}
          {r.reserve ? (
            <div className="border-line/40 text-ink-soft flex flex-wrap items-center justify-between gap-y-1 border-t pt-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendarDays} className="size-2.5 text-primary" />
                <span className="text-ink-muted font-medium">Entrada:</span>
                <span>{formatearFechaHora(r.reserve.check_in_date)}</span>
                <span>·</span>
                <span className="text-ink-muted font-medium">Salida:</span>
                <span>{formatearFechaHora(r.reserve.check_out_date)}</span>
              </div>

              <span className="bg-line/60 text-ink-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                <FontAwesomeIcon icon={faUsers} className="size-2.5 text-primary" />
                <span>
                  {r.reserve.number_of_guests}{' '}
                  {r.reserve.number_of_guests === 1 ? 'huésped' : 'huéspedes'}
                </span>
              </span>
            </div>
          ) : (
            <div className="border-line/40 text-ink-soft flex items-center justify-between border-t pt-2 text-[11px]">
              <span>Ingreso directo (Walk-in sin reserva previa)</span>
            </div>
          )}
        </div>

        {/* Check animado de selección */}
        <div className="flex shrink-0 items-center justify-center gap-2.5 pl-1 sm:pl-2">
          <span className="bg-primary/10 text-primary group-hover:bg-primary hidden items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all group-hover:text-white sm:inline-flex">
            Seleccionar
          </span>
          <div
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`Seleccionar recepción para ${r.person?.name || r.huespedNombre} en habitación ${r.room?.number || r.habitacionNumero}`}
            className={`grid size-6 cursor-pointer place-items-center rounded-lg border transition-all duration-200 sm:size-7 sm:rounded-xl ${
              isSelected
                ? 'border-primary bg-primary ring-primary/20 scale-105 text-white shadow-xs ring-2'
                : 'border-line/80 bg-canvas/80 hover:border-primary/60 group-hover:border-primary/50 text-transparent'
            }`}
          >
            <AnimatePresence mode="wait">
              {isSelected && (
                <motion.svg
                  key="check-svg"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5 sm:size-4"
                >
                  <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </button>
  )
}
