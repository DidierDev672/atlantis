import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import { calculateAge, formatAgeText } from './calculate-age'

export type PersonViewMode = 'cards' | 'table'

export interface PersonListItem {
  id: string
  document_type: string
  document_number: string
  name: string
  phone_number: string
  email: string
  date_of_birth: string
  gender: string
  nationality?: string
  roles: string[]
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface PersonaRepository {
  getPersons(): Promise<{
    data: PersonListItem[]
    validation: StatusCodeValidationResult
    fromFallback: boolean
  }>
}

/**
 * Traduce el código de tipo de documento a una etiqueta humana amigable.
 */
export function formatDocumentType(documentType?: string): string {
  if (!documentType) return 'Sin documento'
  const normalized = documentType.toLowerCase().trim()
  switch (normalized) {
    case 'national_id':
    case 'cedula':
      return 'Cédula de Ciudadanía'
    case 'id_card':
    case 'tarjeta_identidad':
      return 'Tarjeta de Identidad'
    case 'foreign_id':
    case 'tarjeta_extranjera':
      return 'Cédula de Extranjería'
    case 'passport':
    case 'pasaporte':
      return 'Pasaporte'
    default:
      return documentType
  }
}

/**
 * Normaliza el género a una etiqueta en español y tono de badge.
 */
export function formatGender(gender?: string): {
  label: string
  short: string
  tone: 'indigo' | 'rose' | 'amber'
} {
  if (!gender) {
    return { label: 'No especificado', short: '—', tone: 'amber' }
  }
  const g = gender.trim().toUpperCase()
  if (g === 'M' || g === 'MASCULINO' || g === 'MALE') {
    return { label: 'Masculino', short: 'M', tone: 'indigo' }
  }
  if (g === 'F' || g === 'FEMENINO' || g === 'FEMALE') {
    return { label: 'Femenino', short: 'F', tone: 'rose' }
  }
  return { label: gender, short: gender.slice(0, 1).toUpperCase(), tone: 'amber' }
}

/**
 * Formatea la fecha de nacimiento y calcula la edad estimada.
 */
export function formatBirthDate(dateStr?: string): {
  formatted: string
  ageText: string
} {
  if (!dateStr) {
    return { formatted: 'Fecha no registrada', ageText: '' }
  }

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return { formatted: dateStr, ageText: '' }
    }

    const formatted = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date)

    // Cálculo de edad usando la función de dominio reutilizable
    const age = calculateAge(date)
    const ageText = formatAgeText(age)

    return { formatted, ageText }
  } catch {
    return { formatted: dateStr, ageText: '' }
  }
}

/**
 * Formatea un rol técnico a su nombre en español legible.
 */
export function formatRoleName(role: string): string {
  const normalized = role.toLowerCase().trim()
  switch (normalized) {
    case 'admin':
    case 'administrador':
      return 'Administrador'
    case 'recepcion':
    case 'recepcionista':
      return 'Recepción'
    case 'operaciones':
      return 'Operaciones'
    case 'atencion_cliente':
      return 'Atención al Cliente'
    case 'huesped':
      return 'Huésped'
    case 'mantenimiento':
      return 'Mantenimiento'
    default:
      return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')
  }
}

/**
 * Extrae las iniciales de una persona para el avatar visual.
 */
export function getPersonInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'PE'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'PE'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
