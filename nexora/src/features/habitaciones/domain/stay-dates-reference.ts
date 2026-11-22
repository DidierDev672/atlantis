export type CheckoutBadgeTone = 'danger' | 'warning' | 'info' | 'neutral';

export interface CheckoutReferenceBadge {
  label: string;
  tone: CheckoutBadgeTone;
}

export function formatStayDateTimeEs(isoDate?: string | null): string {
  if (!isoDate) return 'No registrada';
  try {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return 'No registrada';
    return parsed.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'No registrada';
  }
}

export function getCheckoutReferenceBadge(
  checkOutIso?: string | null
): CheckoutReferenceBadge {
  if (!checkOutIso) {
    return { label: 'Sin fecha de salida', tone: 'neutral' };
  }

  try {
    const checkOutDate = new Date(checkOutIso);
    if (Number.isNaN(checkOutDate.getTime())) {
      return { label: 'Sin fecha de salida', tone: 'neutral' };
    }

    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const outMidnight = new Date(
      checkOutDate.getFullYear(),
      checkOutDate.getMonth(),
      checkOutDate.getDate()
    );

    const diffDays = Math.round(
      (outMidnight.getTime() - todayMidnight.getTime()) / 86400000
    );

    if (diffDays < 0) {
      const overdue = Math.abs(diffDays);
      return {
        label: `Salida vencida (${overdue} ${overdue === 1 ? 'día' : 'días'})`,
        tone: 'danger',
      };
    }
    if (diffDays === 0) {
      return { label: 'Sale hoy', tone: 'warning' };
    }
    if (diffDays === 1) {
      return { label: 'Sale mañana', tone: 'info' };
    }
    if (diffDays > 7 && diffDays <= 14) {
      return { label: 'Sale la próxima semana', tone: 'neutral' };
    }
    return { label: `Sale en ${diffDays} días`, tone: 'neutral' };
  } catch {
    return { label: 'Sin fecha de salida', tone: 'neutral' };
  }
}
