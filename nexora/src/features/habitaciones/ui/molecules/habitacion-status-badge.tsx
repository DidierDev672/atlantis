import type { HabitacionEstadoKey } from '../../domain/habitacion-lista'

interface HabitacionStatusBadgeProps {
  status: HabitacionEstadoKey
  className?: string
}

export interface HabitacionStatusVisualConfig {
  label: string
  bg: string
  text: string
  dot: string
  border: string
}

const STATUS_CONFIG: Record<string, HabitacionStatusVisualConfig> = {
  // Disponible
  available: {
    label: 'Disponible',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },
  disponible: {
    label: 'Disponible',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },
  free: {
    label: 'Disponible',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },
  libre: {
    label: 'Disponible',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },

  // Ocupada (incluye el estado nativo de base de datos 'busy' de Nexora)
  busy: {
    label: 'Ocupada',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
  },
  occupied: {
    label: 'Ocupada',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
  },
  ocupada: {
    label: 'Ocupada',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
  },
  ocupado: {
    label: 'Ocupada',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
  },
  in_use: {
    label: 'Ocupada',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
  },

  // Mantenimiento
  maintenance: {
    label: 'Mantenimiento',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-500/25',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-500/25',
  },
  repair: {
    label: 'Mantenimiento',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-500/25',
  },

  // Limpieza
  cleaning: {
    label: 'Limpieza',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    border: 'border-sky-500/25',
  },
  limpieza: {
    label: 'Limpieza',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    border: 'border-sky-500/25',
  },
  dirty: {
    label: 'Limpieza',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    border: 'border-sky-500/25',
  },
  sucia: {
    label: 'Limpieza',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    border: 'border-sky-500/25',
  },

  // Inactiva
  inactive: {
    label: 'Inactiva',
    bg: 'bg-neutral/10 dark:bg-neutral/20',
    text: 'text-ink-muted',
    dot: 'bg-neutral',
    border: 'border-line',
  },
  inactiva: {
    label: 'Inactiva',
    bg: 'bg-neutral/10 dark:bg-neutral/20',
    text: 'text-ink-muted',
    dot: 'bg-neutral',
    border: 'border-line',
  },
  inactivo: {
    label: 'Inactiva',
    bg: 'bg-neutral/10 dark:bg-neutral/20',
    text: 'text-ink-muted',
    dot: 'bg-neutral',
    border: 'border-line',
  },
  disabled: {
    label: 'Inactiva',
    bg: 'bg-neutral/10 dark:bg-neutral/20',
    text: 'text-ink-muted',
    dot: 'bg-neutral',
    border: 'border-line',
  },

  // Reservada
  reserved: {
    label: 'Reservada',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    border: 'border-purple-500/25',
  },
  reservada: {
    label: 'Reservada',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    border: 'border-purple-500/25',
  },
}

/**
 * Traduce y resuelve la configuración visual de cualquier estado de habitación
 * asegurando textos 100% en español y colores contrastantes accesibles.
 */
export function getHabitacionStatusConfig(status?: string | null): HabitacionStatusVisualConfig {
  const norm = (status || '').toLowerCase().trim().replace(/[-_]/g, '')

  if (STATUS_CONFIG[norm]) {
    return STATUS_CONFIG[norm]
  }

  if (norm.includes('avail') || norm.includes('dispon') || norm.includes('libre')) {
    return STATUS_CONFIG.available
  }
  if (norm.includes('busy') || norm.includes('ocup') || norm.includes('use')) {
    return STATUS_CONFIG.busy
  }
  if (norm.includes('maint') || norm.includes('manten')) {
    return STATUS_CONFIG.maintenance
  }
  if (norm.includes('clean') || norm.includes('limp') || norm.includes('suci')) {
    return STATUS_CONFIG.cleaning
  }
  if (norm.includes('reserv')) {
    return STATUS_CONFIG.reserved
  }
  if (norm.includes('inact') || norm.includes('desact') || norm.includes('disab')) {
    return STATUS_CONFIG.inactive
  }

  return {
    label: 'Disponible',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  }
}

/**
 * Badge de Estado de Habitación 100% en español con microinteracción visual.
 */
export function HabitacionStatusBadge({ status, className = '' }: HabitacionStatusBadgeProps) {
  const config = getHabitacionStatusConfig(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${config.bg} ${config.text} ${config.border} ${className}`}
      role="status"
      aria-label={`Estado de la habitación: ${config.label}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  )
}
