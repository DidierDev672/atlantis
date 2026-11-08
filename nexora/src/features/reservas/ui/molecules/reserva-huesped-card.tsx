import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faIdCard,
  faCircleCheck,
  faEnvelope,
  faPhone,
  faBed,
} from '@fortawesome/free-solid-svg-icons'

export interface ReservaHuespedCardProps {
  /** Posición ordinal del huésped (1 para titular, 2..N para acompañantes) */
  index: number
  /** Total de huéspedes asignados a la reserva */
  totalGuests: number
  /** Indica si es el huésped titular principal */
  isTitular: boolean
  /** Nombre completo o descriptivo del huésped */
  name: string
  /** Nombre o identificador legible de la habitación (opcional) */
  roomName?: string
  /** Tipo de documento (ej: CC, Pasaporte, Cédula) */
  documentType?: string
  /** Número de documento si se encuentra disponible */
  documentNumber?: string
  /** Correo de contacto si está disponible */
  email?: string
  /** Teléfono de contacto si está disponible */
  phoneNumber?: string
  /** Etiqueta de estado en la estadía */
  statusLabel?: string
}

/**
 * Tarjeta individual para visualizar la información de cada huésped en el detalle de la reserva.
 * Diseñada según principios de Atomic Design (Molecule) y micro-interacciones suaves.
 */
export function ReservaHuespedCard({
  index,
  isTitular,
  name,
  roomName,
  documentType,
  documentNumber,
  email,
  phoneNumber,
  statusLabel = isTitular ? 'Titular confirmado' : 'Acompañante registrado',
}: ReservaHuespedCardProps) {
  // Iniciales visuales para el avatar
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || (isTitular ? 'HT' : `A${index - 1}`)

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-canvas/60 dark:bg-surface/40 p-4 shadow-2xs hover:border-primary/40 transition-all"
    >
      <div>
        {/* Cabecera de la tarjeta: Avatar, Nombre y Badge de Rol */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-xs font-bold text-primary shadow-2xs"
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink" title={name}>
                {name}
              </p>
              <p className="text-[11px] text-ink-muted">
                {isTitular ? 'Titular de la reserva' : `Acompañante #${index - 1}`}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface/70 px-2 py-0.5 text-[10px] font-bold text-ink-muted">
            <FontAwesomeIcon
              icon={isTitular ? faCircleCheck : faUsers}
              className="size-2.5 text-primary"
            />
            <span>{isTitular ? 'Titular' : 'Acompañante'}</span>
          </span>
        </div>

        {/* Metadatos e Información del Huésped */}
        <div className="mt-3 space-y-1.5 border-t border-line/60 pt-2.5 text-xs">
          {documentNumber ? (
            <div className="flex items-center gap-2 text-ink">
              <FontAwesomeIcon icon={faIdCard} className="size-3 text-ink-muted shrink-0" />
              <span className="truncate">
                {documentType ? `${documentType}: ` : 'Doc: '}
                <strong>{documentNumber}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-ink-muted text-[11px]">
              <FontAwesomeIcon icon={faIdCard} className="size-3 text-neutral/60 shrink-0" />
              <span className="italic">
                {isTitular ? 'Identificación registrada' : 'Registrado con el titular'}
              </span>
            </div>
          )}

          {email && (
            <div className="flex items-center gap-2 text-ink text-[11px]">
              <FontAwesomeIcon icon={faEnvelope} className="size-3 text-ink-muted shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          )}

          {phoneNumber && (
            <div className="flex items-center gap-2 text-ink text-[11px]">
              <FontAwesomeIcon icon={faPhone} className="size-3 text-ink-muted shrink-0" />
              <span>{phoneNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pie de la tarjeta: Estado y Habitación vinculada si existe */}
      <div className="mt-3 flex items-center justify-between border-t border-line/50 pt-2 text-[10px] text-ink-muted">
        {roomName ? (
          <span className="inline-flex items-center gap-1.5 truncate">
            <FontAwesomeIcon icon={faBed} className="size-2.5 text-primary/70 shrink-0" />
            <span className="truncate">{roomName}</span>
          </span>
        ) : (
          <span className="text-[10px] text-ink-muted font-medium">
            Huésped #{index}
          </span>
        )}
        <span className="font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
          {statusLabel}
        </span>
      </div>
    </motion.div>
  )
}
