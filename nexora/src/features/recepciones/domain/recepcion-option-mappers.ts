import {
  type CamaInfo,
  type EdificioInfo,
  type HabitacionInfo,
  type HuespedInfo,
  type ReservaInfo,
  type SedeInfo,
} from './recepcion'

const CLOSED_RESERVA_STATES = new Set([
  'completed',
  'completada',
  'completado',
  'finished',
  'finalizada',
  'finalizado',
  'checked_out',
  'checkout',
  'cancelled',
  'canceled',
  'cancelada',
  'cancelado',
  'expired',
  'expirada',
  'no_show',
])

export function formatReservaDateShort(dateStr?: string): string {
  if (!dateStr) return 'Por definir'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      return dateStr.split('T')[0] || dateStr
    }
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

export function sanitizeHabitacionOptionLabel(label: string): string {
  const parts = label.split(' - ')
  if (parts.length > 2) {
    return `${parts[0].trim()} - ${parts[1].trim()}`
  }
  return label.trim()
}

export function sanitizeCamaOptionLabel(label: string): string {
  return label.replace(/\s*\((Disponible|disponible)\)/gi, '').trim()
}

export function mapSedeOptions(sedes: SedeInfo[]) {
  return sedes.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.city})`,
  }))
}

export function mapEdificioOptions(edificios: EdificioInfo[], sedeId?: string) {
  const list = sedeId
    ? edificios.filter((e) => e.headquarters_id === sedeId)
    : edificios
  return list.map((e) => ({
    value: e.id,
    label: `${e.name} · ${e.floor_number ?? 5} pisos`,
  }))
}

export function mapHabitacionOptions(
  habitaciones: HabitacionInfo[],
  edificioId?: string
) {
  const list = edificioId
    ? habitaciones.filter((h) => h.building_id === edificioId)
    : habitaciones
  return list.map((h) => {
    const num = h.number ? String(h.number) : h.name || 'Habitación'
    const piso = h.floor ? `Piso ${h.floor}` : 'Piso 1'
    return {
      value: h.id,
      label: sanitizeHabitacionOptionLabel(`${num} - ${piso}`),
    }
  })
}

export function mapCamaOptions(camas: CamaInfo[], habitacionId?: string) {
  const list = habitacionId
    ? camas.filter((c) => c.room_id === habitacionId)
    : camas
  return list.map((c) => ({
    value: c.id,
    label: sanitizeCamaOptionLabel(c.etiquette),
  }))
}

export function mapHuespedOptions(huespedes: HuespedInfo[]) {
  return huespedes.map((p) => ({
    value: p.id,
    label: p.label,
  }))
}

/**
 * Filtra reservas cerradas, completadas o canceladas para reducir memoria y ruido visual en check-in.
 */
export function filterActiveReservasForCheckIn(
  reservas: ReservaInfo[]
): ReservaInfo[] {
  return reservas.filter((r) => {
    if (!r.state) return true
    const normalized = r.state.trim().toLowerCase().replace(/[\s-]+/g, '_')
    return !CLOSED_RESERVA_STATES.has(normalized)
  })
}

export function buildReservaOptionDescriptor(r: ReservaInfo) {
  const guestCount =
    r.numberOfGuests ??
    (r.personIds && r.personIds.length > 0 ? r.personIds.length : 1)
  const extraGuests = guestCount > 1 ? guestCount - 1 : 0
  const phone =
    r.guestPhone && r.guestPhone !== 'Sin teléfono' ? r.guestPhone : null
  const inDate = formatReservaDateShort(r.checkInDate)
  const outDate = formatReservaDateShort(r.checkOutDate)
  const dateSummary =
    r.checkInDate || r.checkOutDate ? ` · ${inDate} → ${outDate}` : ''

  return {
    value: r.id,
    label: `${r.guestName}${phone ? ` · ${phone}` : ''}${dateSummary}${
      extraGuests > 0 ? ` (+${extraGuests})` : ''
    }`,
    guestName: r.guestName,
    phone,
    inDate,
    outDate,
    guestCount,
    extraGuests,
  }
}

export function mapReservaDropdownOptions(reservas: ReservaInfo[]) {
  return filterActiveReservasForCheckIn(reservas).map((r) => {
    const desc = buildReservaOptionDescriptor(r)
    return {
      value: desc.value,
      label: desc.label,
    }
  })
}
