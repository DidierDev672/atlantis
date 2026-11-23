export interface PriceDeltaResult {
  text: string;
  toneClass: string;
}

/**
 * Calcula la diferencia porcentual entre la tarifa especial y el precio base.
 */
export function computePriceDeltaLabel(
  priceOverride: number | null | undefined,
  basePrice: number | null | undefined
): PriceDeltaResult | null {
  try {
    if (
      priceOverride == null ||
      basePrice == null ||
      Number.isNaN(priceOverride) ||
      Number.isNaN(basePrice) ||
      basePrice <= 0
    ) {
      return null;
    }

    const diff = basePrice - priceOverride;
    if (diff === 0) return null;

    const pct = Math.round((Math.abs(diff) / basePrice) * 100);
    if (pct <= 0) return null;

    if (diff > 0) {
      return {
        text: `${pct} % menos que la base`,
        toneClass: 'text-emerald-700 dark:text-emerald-400',
      };
    }

    return {
      text: `${pct} % sobre la base`,
      toneClass: 'text-amber-700 dark:text-amber-400',
    };
  } catch (err) {
    console.error('Error al calcular diferencia porcentual de tarifa:', err);
    return null;
  }
}

export function formatCapacityLabel(capacity?: number | null): string {
  const num = typeof capacity === 'number' && capacity > 0 ? capacity : 2;
  return `${num} ${num === 1 ? 'huésped' : 'huéspedes'}`;
}

export function isRoomAvailableStatus(status?: string | null): boolean {
  const norm = (status || '').trim().toLowerCase();
  return norm === 'available' || norm === 'disponible' || norm === 'active' || norm === 'activo';
}
