import { motion } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
import {
  type RecepcionRoomItem,
  getRoomStatusConfig,
} from '../../domain/recepcion-room'
import { RecepcionRoomCard } from './recepcion-room-card'

export interface RecepcionRoomTableProps {
  rooms: RecepcionRoomItem[]
  onSelectRoom?: (room: RecepcionRoomItem) => void
}

/**
 * Tabla interactiva de habitaciones para el Dashboard de Recepcionista.
 * En pantallas de escritorio (≥ md) se visualiza en formato tabular completo.
 * En pantallas móviles / responsivas (< md) se transforma fluidamente en tarjetas (cards).
 * Cumple estrictamente con la Regla de Oro nº 1: Cero visualización de IDs en la interfaz.
 */
export function RecepcionRoomTable({
  rooms,
  onSelectRoom,
}: RecepcionRoomTableProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-4"
    >
      {/* 1. Vista adaptable en tarjetas para dispositivos móviles (< md) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:hidden">
        {rooms.map((room, index) => (
          <RecepcionRoomCard
            key={`room-card-${room.id}-${index}`}
            room={room}
            onClick={onSelectRoom}
          />
        ))}
      </div>

      {/* 2. Vista tabular estructurada para pantallas medianas y grandes (≥ md) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-panel shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-line bg-canvas/80 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              <tr>
                <th scope="col" className="px-5 py-3.5 sm:px-6">
                  Habitación
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Piso
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Tipo de habitación
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Edificio
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Precio a pagar
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Estado
                </th>
                <th scope="col" className="px-5 py-3.5 text-right sm:px-6">
                  Recepción / Reserva
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line/70">
              {rooms.map((room, index) => {
                const statusCfg = getRoomStatusConfig(room.status)
                return (
                  <tr
                    key={`room-table-row-${room.id}-${index}`}
                    onClick={() => onSelectRoom?.(room)}
                    className="group hover:bg-canvas/50 transition-colors cursor-pointer"
                  >
                    {/* 1. Número de Habitación */}
                    <td className="px-5 py-3.5 whitespace-nowrap sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary shadow-2xs group-hover:bg-primary group-hover:text-white transition-colors">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-4"
                            aria-hidden="true"
                          >
                            <path d="M2 4v16" />
                            <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                            <path d="M2 17h20" />
                            <path d="M6 8v9" />
                          </svg>
                        </span>
                        <div>
                          <span className="font-bold text-ink group-hover:text-primary transition-colors block">
                            Habitación {room.number}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Piso */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-muted">
                        Piso {room.floor}
                      </span>
                    </td>

                    {/* 3. Tipo de Habitación (Resuelto, SIN ID) */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-ink">
                      {room.roomTypeName}
                    </td>

                    {/* 4. Edificio (Resuelto, SIN ID) */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-ink-muted">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-3.5 text-ink-muted/80"
                          aria-hidden="true"
                        >
                          <rect x="4" y="2" width="16" height="20" rx="2" />
                          <path d="M9 22v-4h6v4" />
                        </svg>
                        {room.buildingName}
                      </span>
                    </td>

                    {/* 5. Precio a pagar */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-primary">
                        {room.formattedPrice}
                      </span>
                    </td>

                    {/* 6. Estado */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-2xs ${statusCfg.badgeClass}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${statusCfg.dotClass}`}
                          aria-hidden="true"
                        />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* 7. Recepción / Reserva */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right sm:px-6">
                      {room.has_reception ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shadow-2xs">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-3.5"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Recepción activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted">
                          <span className="size-1.5 rounded-full bg-ink-muted/60" aria-hidden="true" />
                          Sin recepción
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

