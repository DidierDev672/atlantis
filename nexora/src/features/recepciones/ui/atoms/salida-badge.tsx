import { useState } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDay,
  faConciergeBell,
  faDoorOpen,
  faMars,
  faSpoon,
  faUtensils,
  faVenus,
  faVenusMars,
} from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../../../../shared/ui/Tooltip'
import type { DepartureWindow, GuestSourceKind } from '../../domain/salida-huesped'

export interface SalidaGenderBadgeProps {
  label: string
  tone: 'indigo' | 'rose' | 'amber'
}

export function SalidaGenderBadge({ label, tone }: SalidaGenderBadgeProps) {
  const toneClasses =
    tone === 'indigo'
      ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
      : tone === 'rose'
        ? 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300'
        : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'

  const icon =
    tone === 'indigo' ? faMars : tone === 'rose' ? faVenus : faVenusMars

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses}`}
    >
      <FontAwesomeIcon icon={icon} className="size-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

export interface SalidaWindowBadgeProps {
  window: DepartureWindow
  label: string
}

export function SalidaWindowBadge({ window, label }: SalidaWindowBadgeProps) {
  const classes =
    window === 'hoy'
      ? 'border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-200'
      : window === 'manana'
        ? 'border-sky-500/35 bg-sky-500/15 text-sky-800 dark:text-sky-200'
        : 'border-line bg-canvas text-ink-muted'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${classes}`}
    >
      <FontAwesomeIcon
        icon={faCalendarDay}
        className="size-3"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  )
}

export interface SalidaSourceBadgeProps {
  kind: GuestSourceKind
  label: string
}

export function SalidaSourceBadge({ kind, label }: SalidaSourceBadgeProps) {
  const classes =
    kind === 'recepcion' || kind === 'ambos'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : kind === 'reserva'
        ? 'border-primary/25 bg-primary/10 text-primary'
        : 'border-line bg-canvas text-ink-muted'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${classes}`}
    >
      <FontAwesomeIcon
        icon={faConciergeBell}
        className="size-3"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  )
}

export interface SalidaReceptionCountBadgeProps {
  count: number
}

export function SalidaReceptionCountBadge({
  count,
}: SalidaReceptionCountBadgeProps) {
  const tooltipText =
    count === 1
      ? 'Recepciones: este huésped tiene 1 recepción registrada'
      : `Recepciones: este huésped tiene ${count} recepciones registradas`

  return (
    <Tooltip content={tooltipText}>
      <button
        type="button"
        aria-label={tooltipText}
        className="border-primary/25 bg-primary/10 text-primary hover:bg-primary/15 focus-visible:ring-primary/40 inline-flex shrink-0 cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors outline-none focus-visible:ring-2"
      >
        <FontAwesomeIcon
          icon={faDoorOpen}
          className="size-3"
          aria-hidden="true"
        />
        <span>{count}</span>
      </button>
    </Tooltip>
  )
}

export interface SalidaServiceRequestCountBadgeProps {
  count: number
  isLoading?: boolean
}

export function SalidaServiceRequestCountBadge({
  count,
  isLoading = false,
}: SalidaServiceRequestCountBadgeProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Regla de negocio: huéspedes con cero solicitudes no visualizan indicador alguno
  if (isLoading || count <= 0) {
    return null
  }

  const tooltipText =
    count === 1
      ? 'Servicio a la habitación: este huésped tiene 1 solicitud registrada'
      : `Servicio a la habitación: este huésped tiene ${count} solicitudes registradas`

  return (
    <Tooltip content={tooltipText}>
      <button
        type="button"
        aria-label={tooltipText}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className="border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/15 focus-visible:ring-secondary/40 inline-flex shrink-0 cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors outline-none focus-visible:ring-2"
      >
        <span className="relative inline-flex size-3.5 items-center justify-center">
          <motion.span
            aria-hidden="true"
            animate={
              isHovered
                ? {
                    rotate: [0, -14, 14, -10, 8, 0],
                    x: [0, -1.5, 1.5, -1, 0.5, 0],
                  }
                : { rotate: 0, x: 0 }
            }
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faUtensils} className="size-3" />
          </motion.span>
          <motion.span
            aria-hidden="true"
            animate={
              isHovered
                ? {
                    opacity: [0, 0.9, 0.9, 0.7, 0],
                    rotate: [18, -14, 14, -10, 12],
                    x: [1.5, -1.5, 1.5, -0.5, 1],
                  }
                : { opacity: 0, rotate: 18, x: 0 }
            }
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 inline-flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faSpoon} className="size-2.5" />
          </motion.span>
        </span>
        <span>{count}</span>
      </button>
    </Tooltip>
  )
}
