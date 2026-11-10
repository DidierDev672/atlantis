import { motion } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
import {
  type RecepcionRoomItem,
  getRoomStatusConfig,
} from '../../domain/recepcion-room'
import { RandomPlanet } from '../../../../shared/planets'

export interface RecepcionRoomCardProps {
  room: RecepcionRoomItem
  onClick?: (room: RecepcionRoomItem) => void
}

/**
 * Tarjeta individual de habitación para el Dashboard de Recepcionista.
 * Presenta número, piso, tipo, edificio, precio, estado y recepción activa.
 * Cumple estrictamente con la Regla de Oro nº 1: NO visualiza identificadores UUID crudos.
 */
export function RecepcionRoomCard({ room, onClick }: RecepcionRoomCardProps) {
  const statusCfg = getRoomStatusConfig(room.status)

  return (
    <motion.article
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={() => onClick?.(room)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-panel p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md"
    >
      {/* 1. Cabecera: Número de Habitación, Piso y Badge de Estado */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3">
            {/* Planeta aleatorio cósmico de /shared */}
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-2xs group-hover:bg-primary/20 transition-colors">
              <RandomPlanet size={26} seed={room.id || room.number} interactive />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink group-hover:text-primary transition-colors">
                  Hab. {room.number}
                </h3>
                <span className="rounded-md border border-line bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                  Piso {room.floor}
                </span>
              </div>
              <p className="text-xs font-medium text-ink-muted mt-0.5">
                {room.roomTypeName}
              </p>
            </div>
          </div>

          {/* Badge de Estado de la Habitación */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0 shadow-2xs ${statusCfg.badgeClass}`}
          >
            <span
              className={`size-1.5 rounded-full ${statusCfg.dotClass}`}
              aria-hidden="true"
            />
            {statusCfg.label}
          </span>
        </div>

        {/* 2. Cuerpo: Ubicación en Edificio y Precio a Pagar */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-line/60 bg-canvas/60 p-3 text-xs">
          {/* Edificio */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-ink-muted flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3 text-ink-muted/80"
                aria-hidden="true"
              >
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
              </svg>
              Edificio
            </span>
            <p className="font-semibold text-ink truncate" title={room.buildingName}>
              {room.buildingName}
            </p>
          </div>

          {/* Precio a Pagar */}
          <div className="space-y-0.5 text-right">
            <span className="text-[11px] font-medium text-ink-muted">
              Precio a pagar
            </span>
            <p className="font-bold text-primary truncate">
              {room.formattedPrice}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Pie de la tarjeta: Estado de Recepción / Reserva activa */}
      <div className="mt-4 pt-3 border-t border-line/70 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-ink-muted">
          Recepción / Reserva
        </span>

        {room.has_reception ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary shadow-2xs">
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-0.5 text-xs font-medium text-ink-muted">
            <span className="size-1.5 rounded-full bg-ink-muted/60" aria-hidden="true" />
            Sin recepción
          </span>
        )}
      </div>
    </motion.article>
  )
}

