/**
 * Modelo de Dominio para Estancias / Recepciones (Stays)
 * Representa el contrato exacto devuelto por GET /stays
 */

export interface StayItem {
  id: string
  room_id: string
  reservation_id?: string
  person_ids: string[]
  check_in_date: string
  check_out_date: string
  payment_method: string
  security_deposit: number
  remarks?: string
  status: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export type RecepcionesViewMode = 'card' | 'table'

/**
 * Traduce y formatea métodos de pago a español con etiqueta visual.
 */
export function formatPaymentMethod(method?: string | null): {
  label: string
  type: 'cash' | 'card' | 'transfer' | 'other'
} {
  if (!method) return { label: 'Efectivo', type: 'cash' }
  const normalized = method.trim().toLowerCase()

  if (normalized === 'cash' || normalized === 'efectivo') {
    return { label: 'Efectivo', type: 'cash' }
  }
  if (
    normalized === 'card' ||
    normalized === 'tarjeta' ||
    normalized === 'credit_card' ||
    normalized === 'debit_card'
  ) {
    return { label: 'Tarjeta (Débito / Crédito)', type: 'card' }
  }
  if (
    normalized === 'transfer' ||
    normalized === 'transferencia' ||
    normalized === 'bank_transfer'
  ) {
    return { label: 'Transferencia bancaria', type: 'transfer' }
  }

  return { label: method, type: 'other' }
}

/**
 * Formatea el depósito de garantía en formato de moneda colombiano (COP),
 * respetando las convenciones regionales oficiales (ej. $ 50.000).
 */
export function formatSecurityDeposit(amount?: number | string | null): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0
  if (isNaN(num)) return '$ 0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Formato comprensible para fechas y horas (ISO -> legible).
 */
export function formatStayDate(dateString?: string | null): {
  date: string
  time: string
  full: string
} {
  if (!dateString) return { date: 'Fecha no registrada', time: '', full: 'Fecha no registrada' }

  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) {
      return { date: dateString, time: '', full: dateString }
    }

    const date = d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    const time = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    return {
      date,
      time,
      full: `${date} · ${time}`,
    }
  } catch {
    return { date: dateString, time: '', full: dateString }
  }
}

/**
 * Calcula la cantidad de noches entre check-in y check-out.
 */
export function calculateStayNights(checkInStr?: string, checkOutStr?: string): number {
  if (!checkInStr || !checkOutStr) return 1
  try {
    const start = new Date(checkInStr).getTime()
    const end = new Date(checkOutStr).getTime()
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 1
  } catch {
    return 1
  }
}

/**
 * Mapeo de estado para feedback visual y accesibilidad.
 * Sincronizado con los colores oficiales de recepción:
 * - Progreso:   #EDCD44
 * - Cancelada:  #DC3E26
 * - Finalizada: #daf6a6
 */
export function getStayStatusConfig(status?: string | null): {
  label: string
  colorClasses: string
  dotClass: string
} {
  const norm = (status || '').toLowerCase().trim()

  switch (norm) {
    case 'progress':
    case 'progreso':
    case 'active':
    case 'activa':
      return {
        label: 'En progreso',
        colorClasses: 'bg-[#EDCD44]/15 text-[#755d00] dark:text-[#f7e38a] border-[#EDCD44]/45',
        dotClass: 'bg-[#EDCD44] animate-pulse',
      }
    case 'completed':
    case 'finalizada':
    case 'checked_out':
      return {
        label: 'Finalizada',
        colorClasses: 'bg-[#daf6a6]/30 text-[#355403] dark:text-[#d3f595] border-[#9ad645]/50',
        dotClass: 'bg-[#7cb518]',
      }
    case 'canceled':
    case 'cancelled':
    case 'cancelada':
      return {
        label: 'Cancelada',
        colorClasses: 'bg-[#DC3E26]/15 text-[#9c1f0b] dark:text-[#ff7861] border-[#DC3E26]/40',
        dotClass: 'bg-[#DC3E26]',
      }
    default:
      return {
        label: status || 'Registrada',
        colorClasses: 'bg-neutral/10 text-ink-muted border-line',
        dotClass: 'bg-neutral',
      }
  }
}

/**
 * Modelo de Persona / Huésped retornado por GET /person/{id}
 */
export interface PersonDetail {
  id: string
  document_type: string
  document_number: string
  name: string
  phone_number: string
  email: string
  date_of_birth?: string
  gender: string
  nationality?: string
  roles?: string[]
  created_by?: string
  created_at?: string
  updated_at?: string
}

/**
 * Formato comprensible para el tipo de documento en español.
 */
export function formatDocumentType(docType?: string | null): string {
  if (!docType) return 'Documento de identidad'
  const norm = docType.toLowerCase().trim()

  if (norm === 'id_card' || norm.includes('tarjeta')) {
    return 'Tarjeta de identidad'
  }
  if (norm === 'national_id' || norm === 'dni' || norm.includes('nacional')) {
    return 'Documento Nacional (DNI)'
  }
  if (norm === 'passport' || norm.includes('pasaporte')) {
    return 'Pasaporte internacional'
  }
  if (norm === 'foreign_id' || norm.includes('extranjer')) {
    return 'Cédula de extranjería'
  }

  return docType.replace(/_/g, ' ')
}

/**
 * Formato formal para el género del huésped.
 */
export function formatGender(gender?: string | null): string {
  if (!gender) return 'No especificado'
  const norm = gender.trim().toUpperCase()

  if (norm === 'M' || norm === 'MASC' || norm === 'MASCULINO') {
    return 'Masculino'
  }
  if (norm === 'F' || norm === 'FEM' || norm === 'FEMENINO') {
    return 'Femenino'
  }

  return gender
}

/**
 * Formato legible para fecha de nacimiento (ej. "15 de mayo de 1990").
 */
export function formatDateOfBirth(dateStr?: string | null): string {
  if (!dateStr) return 'No registrada'

  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr

    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Extrae las iniciales del nombre de un huésped para su representación en avatars.
 * Ejemplos:
 * - "Juan Pérez" -> "JP"
 * - "María Camila Rodríguez" -> "MC"
 * - "Carlos" -> "CA"
 * - "Huésped 1" -> "H1"
 */
export function formatGuestInitials(name?: string | null, fallbackIndex?: number): string {
  if (!name || !name.trim()) {
    return typeof fallbackIndex === 'number' ? `H${fallbackIndex}` : 'H'
  }
  const cleanName = name.trim()

  // Manejar nombres genéricos o temporales como "Huésped 1", "Huésped 2"
  const matchHuesped = cleanName.match(/^huésped\s*(\d+)$/i)
  if (matchHuesped) {
    return `H${matchHuesped[1]}`
  }

  const words = cleanName.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return typeof fallbackIndex === 'number' ? `H${fallbackIndex}` : 'H'
  }
  if (words.length === 1) {
    return words[0].slice(0, Math.min(2, words[0].length)).toUpperCase()
  }
  const first = words[0][0] || ''
  const second = words[1][0] || ''
  return (first + second).toUpperCase()
}

