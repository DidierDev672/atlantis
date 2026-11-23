export interface DrawerShortDateParts {
  weekdayDate: string;
  time: string;
}

export interface DepositStatusBadgeConfig {
  label: string;
  classes: string;
}

/**
 * Formatea una fecha ISO en el estilo compacto de estadía:
 * Ej: weekdayDate -> "Lun 9 nov", time -> "10:00 a. m."
 */
export function formatDrawerShortDate(
  dateString?: string | null
): DrawerShortDateParts {
  if (!dateString) {
    return { weekdayDate: 'No registrada', time: '—' };
  }

  try {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return { weekdayDate: dateString, time: '' };
    }

    const rawWeekday = parsed
      .toLocaleDateString('es-CO', { weekday: 'short' })
      .replace('.', '')
      .trim();
    const weekday = rawWeekday
      ? rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1)
      : '';

    const day = parsed.getDate();
    const month = parsed
      .toLocaleDateString('es-CO', { month: 'short' })
      .replace('.', '')
      .trim();

    const time = parsed.toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      weekdayDate: `${weekday} ${day} ${month}`.trim(),
      time,
    };
  } catch (err) {
    console.error('Error al formatear fecha del drawer:', err);
    return { weekdayDate: 'No registrada', time: '' };
  }
}

/**
 * Resuelve la insignia del depósito de garantía según el estado de la recepción.
 */
export function resolveDepositStatusConfig(
  stayStatus?: string | null,
  depositAmount?: number
): DepositStatusBadgeConfig | null {
  try {
    const amount = Number(depositAmount ?? 0);
    if (Number.isNaN(amount) || amount <= 0) return null;

    const norm = (stayStatus || '').trim().toLowerCase();

    if (
      norm === 'finalizada' ||
      norm === 'completed' ||
      norm === 'checked_out' ||
      norm === 'completada'
    ) {
      return {
        label: 'Devuelto',
        classes:
          'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300',
      };
    }

    if (norm === 'cancelada' || norm === 'canceled' || norm === 'cancelled') {
      return {
        label: 'Reembolsado',
        classes: 'border-line bg-canvas text-ink-muted',
      };
    }

    if (
      norm === 'progreso' ||
      norm === 'progress' ||
      norm === 'active' ||
      norm === 'activa'
    ) {
      return {
        label: 'Retenido',
        classes:
          'border-amber-500/30 bg-amber-500/15 text-amber-800 dark:border-amber-400/30 dark:text-amber-300',
      };
    }

    return {
      label: 'Registrado',
      classes: 'border-line bg-canvas text-ink-muted',
    };
  } catch (err) {
    console.error('Error al resolver estado de depósito:', err);
    return null;
  }
}
