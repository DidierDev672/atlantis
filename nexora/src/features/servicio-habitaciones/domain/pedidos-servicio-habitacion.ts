import {
  faCheck,
  faCircleExclamation,
  faClock,
  faFire,
  faTruck,
} from '@fortawesome/free-solid-svg-icons'

export interface ServiceRequestItem {
  item_menu_id: string
  name_snapshot: string
  price_unit: number
  tax_rate?: number
  amount: number
  note?: string
}

export interface ServiceRequestOrder {
  id?: string
  order_number: string
  stay_id: string
  room_id: string
  person_id: string
  channel?: string
  payment_method?: string
  general_notes?: string
  delivery_instructions?: string
  scheduled_for?: string
  currency?: string
  tip?: number
  items: ServiceRequestItem[]
  created_by?: string
  created_at?: string
  status?: string
}

export interface UpdateServiceRequestPayload {
  status: string
  actor_type: string
  actor_id: string
  status_comment: string
}

export interface CreateServiceAssignmentPayload {
  service_request_id: string
  stay_id: string
  person_id: string
  is_active: boolean
}

export type NivelPrioridad = 'urgente' | 'atencion' | 'normal'

export interface PrioridadInfo {
  nivel: NivelPrioridad
  etiqueta: string
  tiempoTexto: string
  bordeClase: string
  bgHeaderClase: string
  textHeaderClase: string
  badgeClase: string
  icon: typeof faFire
}

export type EstadoPedido =
  | 'en_cola'
  | 'en_preparacion'
  | 'en_camino'
  | 'entregado'
  | 'cancelado'

export interface EstadoPedidoConfig {
  id: EstadoPedido
  label: string
  colorBadge: string
  dotColor: string
  icon: typeof faClock
}

export const ESTADOS_PEDIDO_CONFIG: Record<EstadoPedido, EstadoPedidoConfig> = {
  en_cola: {
    id: 'en_cola',
    label: 'EN COLA',
    colorBadge: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30',
    dotColor: 'bg-amber-400',
    icon: faClock,
  },
  en_preparacion: {
    id: 'en_preparacion',
    label: 'EN PREPARACIÓN',
    colorBadge: 'bg-orange-500/20 text-orange-800 dark:text-orange-200 border border-orange-500/30',
    dotColor: 'bg-orange-400',
    icon: faFire,
  },
  en_camino: {
    id: 'en_camino',
    label: 'EN CAMINO',
    colorBadge: 'bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-500/30',
    dotColor: 'bg-sky-400',
    icon: faTruck,
  },
  entregado: {
    id: 'entregado',
    label: 'ENTREGADO',
    colorBadge: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    icon: faCheck,
  },
  cancelado: {
    id: 'cancelado',
    label: 'CANCELADO',
    colorBadge: 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/30',
    dotColor: 'bg-rose-400',
    icon: faCircleExclamation,
  },
}

const BACKEND_STATUS_MAP: Record<string, EstadoPedido> = {
  en_cola: 'en_cola',
  pending: 'en_cola',
  queued: 'en_cola',
  in_queue: 'en_cola',
  en_preparacion: 'en_preparacion',
  confirmed: 'en_preparacion',
  preparing: 'en_preparacion',
  in_preparation: 'en_preparacion',
  en_camino: 'en_camino',
  in_transit: 'en_camino',
  delivering: 'en_camino',
  on_the_way: 'en_camino',
  entregado: 'entregado',
  delivered: 'entregado',
  cancelado: 'cancelado',
  canceled: 'cancelado',
  cancelled: 'cancelado',
  rejected: 'cancelado',
}

export function resolverEstadoPedidoNormalizado(
  status?: string | null,
): EstadoPedido | null {
  try {
    const normalized = String(status ?? '').trim().toLowerCase()
    if (!normalized) return null
    return BACKEND_STATUS_MAP[normalized] ?? null
  } catch (error) {
    console.error('Error al normalizar el estado del pedido:', error)
    return null
  }
}

export function esPedidoEntregado(status?: string | null): boolean {
  return resolverEstadoPedidoNormalizado(status) === 'entregado'
}

/**
 * Convierte una instancia `Date` válida a clave local `YYYY-MM-DD` sin desfases por zona horaria UTC.
 */
export function dateToLocalIsoKey(date: Date | null | undefined): string {
  try {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
      return ''
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error al convertir fecha a clave local:', error)
    return ''
  }
}

function parseOrderSaleDate(orden: ServiceRequestOrder): Date | null {
  try {
    const rawDate = orden.created_at || orden.scheduled_for
    if (!rawDate) return null
    const parsed = new Date(rawDate)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

export function resolverFechaVentaClave(orden: ServiceRequestOrder): string | null {
  const parsed = parseOrderSaleDate(orden)
  if (!parsed) return null
  const key = dateToLocalIsoKey(parsed)
  return key || null
}

export function formatearFechaVenta(orden: ServiceRequestOrder): string {
  try {
    const parsed = parseOrderSaleDate(orden)
    if (!parsed) return 'Sin fecha'

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed)
  } catch (error) {
    console.error('Error al formatear fecha de venta:', error)
    return 'Sin fecha'
  }
}

/**
 * Calcula dinámicamente la prioridad de la comanda de cocina basándose en urgencia,
 * notas críticas y tiempo de espera hasta la entrega programada.
 */
export function calcularPrioridadComanda(orden: ServiceRequestOrder): PrioridadInfo {
  const textoCompleto = `${orden.general_notes || ''} ${orden.delivery_instructions || ''} ${orden.items?.map((i) => i.note || '').join(' ') || ''}`.toLowerCase()

  const esUrgentePorTexto =
    textoCompleto.includes('urgente') ||
    textoCompleto.includes('inmediat') ||
    textoCompleto.includes('alergia') ||
    textoCompleto.includes('alérgico') ||
    textoCompleto.includes('sin gluten') ||
    textoCompleto.includes('rapido') ||
    textoCompleto.includes('rápido')

  let diferenciaMinutos: number | null = null
  if (orden.scheduled_for) {
    try {
      const fecha = new Date(orden.scheduled_for).getTime()
      if (!isNaN(fecha)) {
        const ahora = Date.now()
        diferenciaMinutos = Math.round((fecha - ahora) / (1000 * 60))
      }
    } catch {
      // Silencioso
    }
  }

  // 1. Prioridad Crítica / Urgente (Borde y Alerta en Rojo)
  if (esUrgentePorTexto || (diferenciaMinutos !== null && diferenciaMinutos <= 15)) {
    return {
      nivel: 'urgente',
      etiqueta: 'PRIORIDAD CRÍTICA · RUSH',
      tiempoTexto:
        diferenciaMinutos !== null && diferenciaMinutos < 0
          ? `ENTREGA DEMORADA (+${Math.abs(diferenciaMinutos)} MIN)`
          : diferenciaMinutos !== null
            ? `ENTREGA EN ${diferenciaMinutos} MIN`
            : 'ENTREGA INMEDIATA',
      bordeClase:
        'border-2 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.22)] ring-1 ring-red-500/40 bg-red-500/[0.02]',
      bgHeaderClase: 'bg-red-600 dark:bg-red-700',
      textHeaderClase: 'text-white',
      badgeClase:
        'bg-red-600 text-white font-mono font-black shadow-sm ring-1 ring-red-400/50',
      icon: faFire,
    }
  }

  // 2. Prioridad Media / Atención (Borde y Alerta en Ámbar / Amarillo)
  if (diferenciaMinutos !== null && diferenciaMinutos <= 40) {
    return {
      nivel: 'atencion',
      etiqueta: 'TIEMPO MEDIO · EN PREPARACIÓN',
      tiempoTexto: `ENTREGA EN ~${diferenciaMinutos} MIN`,
      bordeClase:
        'border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.18)] ring-1 ring-amber-500/30 bg-amber-500/[0.02]',
      bgHeaderClase: 'bg-amber-500 dark:bg-amber-600',
      textHeaderClase: 'text-zinc-950 font-black',
      badgeClase:
        'bg-amber-500 text-zinc-950 font-mono font-black shadow-sm',
      icon: faClock,
    }
  }

  // 3. Prioridad Normal / En tiempo (Borde en Verde Esmeralda)
  return {
    nivel: 'normal',
    etiqueta: 'A TIEMPO · COLA REGULAR',
    tiempoTexto:
      diferenciaMinutos !== null
        ? `ENTREGA EN ${diferenciaMinutos} MIN`
        : 'ENTREGA EN COLA',
    bordeClase:
      'border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:border-emerald-500 bg-emerald-500/[0.01]',
    bgHeaderClase: 'bg-emerald-600 dark:bg-emerald-700',
    textHeaderClase: 'text-white font-bold',
    badgeClase:
      'bg-emerald-600 text-white font-mono font-bold shadow-sm',
    icon: faCheck,
  }
}

/**
 * Pedidos demo con diferentes niveles de prioridad para validar visualmente el sistema KDS
 */
export const DEMO_PEDIDOS_CONTINGENCIA: ServiceRequestOrder[] = [
  {
    id: 'sr-1',
    order_number: '71',
    stay_id: 'e8b8abd74ee52a63',
    room_id: '2a45ac749faa2848',
    person_id: '64765b959a658887',
    channel: 'front_desk',
    payment_method: 'room_charge',
    general_notes: 'Sin azucar, por faavor. Alergia a los mariscos.',
    delivery_instructions: 'Tocar el timbre antes de llegar el pedido',
    scheduled_for: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    currency: 'COP',
    tip: 5000,
    items: [
      {
        item_menu_id: '37ff6263dfa31f45',
        name_snapshot: 'Infusión de Frutos Rojos',
        price_unit: 6000,
        tax_rate: 0,
        amount: 1,
        note: 'Sin azúcar, bien caliente',
      },
      {
        item_menu_id: '240ac84df5b8d345',
        name_snapshot: 'Espresso Doble',
        price_unit: 5500,
        tax_rate: 0,
        amount: 2,
        note: '',
      },
    ],
    created_by: 'ariasdev672@gmail.com',
  },
  {
    order_number: '18',
    stay_id: 'stay-2',
    room_id: 'room-2',
    person_id: 'person-3',
    channel: 'room_tablet',
    payment_method: 'room_charge',
    general_notes: 'Huésped VIP. Enviar cubiertos de plata adicionales.',
    delivery_instructions: 'Dejar sobre mesa auxiliar',
    scheduled_for: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    currency: 'COP',
    tip: 10000,
    items: [
      {
        item_menu_id: 'item-89',
        name_snapshot: 'Salmón Grillé con Finas Hierbas',
        price_unit: 42000,
        tax_rate: 0,
        amount: 1,
        note: 'Término medio, salsa por separado',
      },
      {
        item_menu_id: 'item-90',
        name_snapshot: 'Copa de Vino Tinto Reserva',
        price_unit: 24000,
        tax_rate: 0,
        amount: 1,
        note: '',
      },
    ],
    created_by: 'ariasdev672@gmail.com',
  },
  {
    order_number: '05',
    stay_id: 'stay-3',
    room_id: 'room-3',
    person_id: 'person-4',
    channel: 'mobile_app',
    payment_method: 'card',
    general_notes: '',
    delivery_instructions: 'Llamar antes de subir',
    scheduled_for: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
    currency: 'COP',
    tip: 2000,
    items: [
      {
        item_menu_id: 'item-12',
        name_snapshot: 'Club Sándwich Tradicional',
        price_unit: 18000,
        tax_rate: 0,
        amount: 2,
        note: '',
      },
    ],
    created_by: 'ariasdev672@gmail.com',
  },
]
