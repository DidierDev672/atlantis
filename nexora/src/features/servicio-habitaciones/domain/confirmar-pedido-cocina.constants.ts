import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'

/**
 * Opciones por defecto para el selector de Recepción / Habitación en formato: name - floor - number
 */
export const OPCIONES_RECEPCION_DEFAULT: ReadonlyArray<DropdownOption> = [
  { value: 'Edificio A - 1 - 101', label: 'Edificio A - 1 - 101' },
  { value: 'Edificio A - 2 - 204', label: 'Edificio A - 2 - 204' },
  { value: 'Torre B - 3 - 305', label: 'Torre B - 3 - 305' },
]

/**
 * Opciones para compatibilidad retrospectiva
 */
export const OPCIONES_RECEPCION = OPCIONES_RECEPCION_DEFAULT.map((o) => o.value)

/**
 * Opciones para el selector de Canal de solicitud utilizando RecursosDropdown
 */
export const OPCIONES_CANAL: ReadonlyArray<DropdownOption> = [
  { value: 'room_tablet', label: 'Tablet' },
  { value: 'mobile_app', label: 'Movil' },
  { value: 'phone', label: 'Telefono' },
  { value: 'front_desk', label: 'Recepcion' },
  { value: 'qr_code', label: 'Codigo QR' },
]

/**
 * Opciones para el selector de Método de pago utilizando RecursosDropdown
 */
export const OPCIONES_METODO_PAGO: ReadonlyArray<DropdownOption> = [
  { value: 'room_charge', label: 'Cargo a la habitacion' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'bank_transfer', label: 'Transferencia bancaria' },
]

/**
 * Genera un número de orden aleatorio de 2 dígitos (ej. '17', '42', '85')
 */
export function generarNumeroOrdenAleatorio(): string {
  const num = Math.floor(10 + Math.random() * 90)
  return String(num)
}
