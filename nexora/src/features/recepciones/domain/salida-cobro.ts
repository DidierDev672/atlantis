import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import type { SalidaHuespedItem } from './salida-huesped'

export type CobroPaymentMethod =
  | 'tarjeta'
  | 'efectivo'
  | 'transferencia'
  | 'nequi'

export interface CobroPaymentMethodOption {
  id: CobroPaymentMethod
  label: string
  subtitle: string
}

export const COBRO_PAYMENT_METHOD_OPTIONS: ReadonlyArray<CobroPaymentMethodOption> =
  [
    { id: 'tarjeta', label: 'Tarjeta', subtitle: 'Débito / Crédito' },
    { id: 'efectivo', label: 'Efectivo', subtitle: 'Pago en caja' },
    { id: 'transferencia', label: 'Transferencia', subtitle: 'Cuenta bancaria' },
    { id: 'nequi', label: 'Nequi', subtitle: 'Billetera digital' },
  ]

export interface CobroRoomDetails {
  roomId: string
  roomNumber: string
  roomStatusRaw: string
  roomStatusLabel: string
  roomStatusToneClass: string
  nightlyRate: number
}

export interface CobroDurationInfo {
  nights: number
  weeks: number
  label: string
}

export interface CobroPaymentSubmissionResult {
  ok: boolean
  receiptCode: string
  folioId?: string
  paidAmount: number
  method: CobroPaymentMethod
  methodLabel: string
  message: string
  validation?: StatusCodeValidationResult
}

/**
 * Filtra cualquier carácter no numérico para garantizar entradas de solo dígitos.
 */
export function sanitizeDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, '')
}

/**
 * Traduce el estado técnico de una habitación a una etiqueta y estilo de badge legible.
 */
export function formatRoomStatusBadge(status?: string | null): {
  label: string
  toneClass: string
} {
  const norm = (status ?? 'occupied').trim().toLowerCase()
  switch (norm) {
    case 'available':
    case 'disponible':
    case 'free':
      return {
        label: 'Disponible',
        toneClass:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      }
    case 'cleaning':
    case 'limpieza':
    case 'dirty':
      return {
        label: 'Limpieza',
        toneClass:
          'border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300',
      }
    case 'maintenance':
    case 'mantenimiento':
      return {
        label: 'Mantenimiento',
        toneClass:
          'border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300',
      }
    case 'reserved':
    case 'reservada':
      return {
        label: 'Reservada',
        toneClass:
          'border-indigo-500/30 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
      }
    default:
      return {
        label: 'Ocupada',
        toneClass:
          'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300',
      }
  }
}

/**
 * Calcula la duración de la estadía en noches y semanas con formato legible.
 */
export function computeStayDurationInfo(
  checkIn?: string | null,
  checkOut?: string | null
): CobroDurationInfo {
  try {
    if (!checkIn || !checkOut) {
      return { nights: 1, weeks: 0, label: '1 noche' }
    }
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { nights: 1, weeks: 0, label: '1 noche' }
    }
    const diffMs = Math.max(0, end.getTime() - start.getTime())
    const nights = Math.max(1, Math.round(diffMs / 86_400_000))
    const weeks = Math.floor(nights / 7)
    const remNights = nights % 7

    if (weeks > 0 && remNights === 0) {
      return {
        nights,
        weeks,
        label: `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} · ${nights} noches`,
      }
    }
    if (weeks > 0) {
      return {
        nights,
        weeks,
        label: `${weeks} ${weeks === 1 ? 'sem.' : 'sem.'} · ${nights} noches`,
      }
    }
    return {
      nights,
      weeks: 0,
      label: `${nights} ${nights === 1 ? 'noche' : 'noches'}`,
    }
  } catch {
    return { nights: 1, weeks: 0, label: '1 noche' }
  }
}

/**
 * Formatea fechas cortas de entrada o salida para el encabezado del drawer.
 */
export function formatShortStayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Por definir'
  try {
    const parsed = new Date(dateStr)
    if (Number.isNaN(parsed.getTime())) return 'Por definir'
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
    }).format(parsed)
  } catch {
    return 'Por definir'
  }
}

/**
 * Construye la frase de método aplicado al depósito en check-in.
 */
export function formatDepositAppliedPhrase(method?: string | null): string {
  const norm = (method ?? '').trim().toLowerCase()
  if (norm === 'cash' || norm === 'efectivo') {
    return 'Depósito aplicado · Efectivo'
  }
  if (norm === 'transfer' || norm === 'transferencia') {
    return 'Depósito aplicado · Transferencia'
  }
  if (norm === 'nequi') {
    return 'Depósito aplicado · Nequi'
  }
  return 'Depósito aplicado · Tarjeta'
}

/**
 * Calcula los montos de alojamiento, servicio a la habitación entregado y total a pagar.
 */
export function computeCobroTotals(
  guest: SalidaHuespedItem,
  nights: number,
  nightlyRateFallback = 0
): {
  accommodationAmount: number
  deliveredOrdersCount: number
  roomServiceAmount: number
  totalToPay: number
  securityDeposit: number
} {
  const baseStayCharge =
    guest.receptionsTotal > 0
      ? guest.receptionsTotal
      : guest.reservesTotal > 0
        ? guest.reservesTotal
        : nightlyRateFallback > 0
          ? nightlyRateFallback * Math.max(1, nights)
          : 0

  const deliveredOrdersCount =
    guest.deliveredServiceOrdersCount ?? guest.serviceRequestCount ?? 0
  const roomServiceAmount =
    (guest.deliveredServiceRequestsTotal ?? 0) > 0
      ? guest.deliveredServiceRequestsTotal!
      : guest.serviceRequestsTotal

  return {
    accommodationAmount: baseStayCharge,
    deliveredOrdersCount,
    roomServiceAmount,
    totalToPay: baseStayCharge + roomServiceAmount,
    securityDeposit: guest.securityDeposit ?? 0,
  }
}
