import {
  formatCurrencyAmount,
  getGuestInitials,
  type SalidaHuespedItem,
} from '../../recepciones/domain/salida-huesped'

/**
 * Contrato de registro de huésped consumido por la capa UI de `personas`,
 * desacoplado de la ubicación interna de otros slices.
 */
export type RegistroHuespedItem = SalidaHuespedItem

export { formatCurrencyAmount, getGuestInitials }

export function isRegistroCheckedOut(
  guest: RegistroHuespedItem,
  checkedOutKeys: ReadonlySet<string>
): boolean {
  if (checkedOutKeys.has(guest.internalKey)) return true
  const stayNorm = (guest.stayStatus ?? '').trim().toLowerCase()
  return (
    stayNorm === 'completed' ||
    stayNorm === 'checked_out' ||
    stayNorm === 'finalizada'
  )
}
