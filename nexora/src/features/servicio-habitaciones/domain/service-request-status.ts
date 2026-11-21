import {
  faBan,
  faBellConcierge,
  faCircleCheck,
  faCircleXmark,
  faClock,
  faFire,
  faHandshake,
  faRoute,
  faTriangleExclamation,
  faTruckFast,
  faUtensils,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'

export const SERVICE_REQUEST_ALLOWED_STATUSES = [
  'pending',
  'confirmed',
  'in_preparation',
  'in_transit',
  'delivering',
  'on_the_way',
  'delivered',
  'canceled',
  'cancelled',
  'rejected',
] as const

export type ServiceRequestBackendStatus =
  (typeof SERVICE_REQUEST_ALLOWED_STATUSES)[number]

export interface ServiceRequestStatusConfig {
  value: ServiceRequestBackendStatus
  label: string
  statusComment: string
  colorBadge: string
  dotColor: string
  categoryContainerClass: string
  textClass: string
  icon: IconDefinition
}

export interface CategoryBadgeVisual {
  containerClass: string
  textClass: string
  icon: IconDefinition
  title?: string
  srSuffix?: string
}

const LEGACY_TO_BACKEND_STATUS: Record<string, ServiceRequestBackendStatus> = {
  en_cola: 'pending',
  queued: 'pending',
  in_queue: 'pending',
  confirmado: 'confirmed',
  en_preparacion: 'in_preparation',
  preparing: 'in_preparation',
  entregando: 'delivering',
  en_camino: 'on_the_way',
  entregado: 'delivered',
  cancelado: 'canceled',
  anulado: 'cancelled',
  rechazado: 'rejected',
}

const ALLOWED_STATUS_SET = new Set<string>(SERVICE_REQUEST_ALLOWED_STATUSES)

export const DEFAULT_CATEGORY_BADGE_VISUAL: CategoryBadgeVisual = {
  containerClass: 'border-primary/20 bg-primary/10 text-primary',
  textClass: 'text-primary',
  icon: faUtensils,
}

export const SERVICE_REQUEST_STATUS_CONFIG: Record<
  ServiceRequestBackendStatus,
  ServiceRequestStatusConfig
> = {
  pending: {
    value: 'pending',
    label: 'En cola',
    statusComment: 'Pedido en cola de espera',
    colorBadge:
      'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30',
    dotColor: 'bg-[#1E3A8A]',
    categoryContainerClass:
      'border-[#1E3A8A]/30 bg-[#1E3A8A]/10 text-[#1E3A8A] dark:bg-[#dbeafe]',
    textClass: 'text-[#1E3A8A]',
    icon: faClock,
  },
  confirmed: {
    value: 'confirmed',
    label: 'Confirmado',
    statusComment: 'Pedido recibido en cocina',
    colorBadge:
      'bg-orange-500/20 text-orange-800 dark:text-orange-200 border border-orange-500/30',
    dotColor: 'bg-[#A7C957]',
    categoryContainerClass:
      'border-[#A7C957]/40 bg-[#A7C957]/15 text-[#A7C957] dark:bg-[#232b16]',
    textClass: 'text-[#A7C957]',
    icon: faCircleCheck,
  },
  in_preparation: {
    value: 'in_preparation',
    label: 'En preparación',
    statusComment: 'Pedido en preparación en cocina',
    colorBadge:
      'bg-orange-500/20 text-orange-800 dark:text-orange-200 border border-orange-500/30',
    dotColor: 'bg-[#0B132B]',
    categoryContainerClass:
      'border-[#0B132B]/30 bg-[#0B132B]/10 text-[#0B132B] dark:bg-[#dbe2f2]',
    textClass: 'text-[#0B132B]',
    icon: faFire,
  },
  in_transit: {
    value: 'in_transit',
    label: 'En tránsito',
    statusComment: 'Pedido en tránsito hacia la habitación',
    colorBadge:
      'bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-500/30',
    dotColor: 'bg-[#006D77]',
    categoryContainerClass:
      'border-[#006D77]/30 bg-[#006D77]/10 text-[#006D77] dark:bg-[#d6eff1]',
    textClass: 'text-[#006D77]',
    icon: faTruckFast,
  },
  delivering: {
    value: 'delivering',
    label: 'Entregando',
    statusComment: 'Pedido siendo entregado al huésped',
    colorBadge:
      'bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-500/30',
    dotColor: 'bg-[#1B4332]',
    categoryContainerClass:
      'border-[#1B4332]/30 bg-[#1B4332]/10 text-[#1B4332] dark:bg-[#d8f3dc]',
    textClass: 'text-[#1B4332]',
    icon: faBellConcierge,
  },
  on_the_way: {
    value: 'on_the_way',
    label: 'En camino',
    statusComment: 'Pedido en camino a la habitación',
    colorBadge:
      'bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-500/30',
    dotColor: 'bg-[#4B0082]',
    categoryContainerClass:
      'border-[#4B0082]/30 bg-[#4B0082]/10 text-[#4B0082] dark:bg-[#ede9fe]',
    textClass: 'text-[#4B0082]',
    icon: faRoute,
  },
  delivered: {
    value: 'delivered',
    label: 'Entregado',
    statusComment: 'Pedido entregado al huésped',
    colorBadge:
      'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30',
    dotColor: 'bg-[#3D4D22]',
    categoryContainerClass:
      'border-[#3D4D22]/30 bg-[#3D4D22]/10 text-[#3D4D22] dark:bg-[#e8efd9]',
    textClass: 'text-[#3D4D22]',
    icon: faHandshake,
  },
  canceled: {
    value: 'canceled',
    label: 'Cancelado',
    statusComment: 'Pedido cancelado',
    colorBadge:
      'bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/30',
    dotColor: 'bg-[#FF6B6B]',
    categoryContainerClass:
      'border-[#FF6B6B]/35 bg-[#FF6B6B]/10 text-[#FF6B6B] dark:bg-[#2f1618]',
    textClass: 'text-[#FF6B6B]',
    icon: faCircleXmark,
  },
  cancelled: {
    value: 'cancelled',
    label: 'Anulado',
    statusComment: 'Pedido anulado',
    colorBadge:
      'bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/30',
    dotColor: 'bg-[#FF8C00]',
    categoryContainerClass:
      'border-[#FF8C00]/35 bg-[#FF8C00]/10 text-[#FF8C00] dark:bg-[#2f1f0c]',
    textClass: 'text-[#FF8C00]',
    icon: faTriangleExclamation,
  },
  rejected: {
    value: 'rejected',
    label: 'Rechazado',
    statusComment: 'Pedido rechazado',
    colorBadge:
      'bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/30',
    dotColor: 'bg-[#B20000]',
    categoryContainerClass:
      'border-[#B20000]/30 bg-[#B20000]/10 text-[#B20000] dark:bg-[#fee2e2]',
    textClass: 'text-[#B20000]',
    icon: faBan,
  },
}

/**
 * Resuelve y valida un estado entrante (en formato dominio o backend) garantizando
 * que el valor enviado en `PUT /service-requests/{id}` pertenezca al catálogo permitido.
 */
export function resolveBackendUpdateStatus(
  rawStatus?: string | null,
): ServiceRequestBackendStatus {
  try {
    const normalized = String(rawStatus ?? '').trim().toLowerCase()
    if (!normalized) return 'confirmed'
    if (ALLOWED_STATUS_SET.has(normalized)) {
      return normalized as ServiceRequestBackendStatus
    }
    return LEGACY_TO_BACKEND_STATUS[normalized] ?? 'confirmed'
  } catch (error) {
    console.error('Error resolving backend update status:', error)
    return 'confirmed'
  }
}

/**
 * Resuelve la configuración visual (ícono FontAwesome, colores y etiquetas accesibles)
 * para el badge de categoría en la tabla de historial de ventas.
 */
export function resolveCategoryBadgeVisual(
  rawStatus?: string | null,
): CategoryBadgeVisual {
  try {
    const normalized = String(rawStatus ?? '').trim().toLowerCase()
    if (!normalized) return DEFAULT_CATEGORY_BADGE_VISUAL

    const matchedKey = ALLOWED_STATUS_SET.has(normalized)
      ? (normalized as ServiceRequestBackendStatus)
      : LEGACY_TO_BACKEND_STATUS[normalized]

    if (!matchedKey) return DEFAULT_CATEGORY_BADGE_VISUAL

    const cfg = SERVICE_REQUEST_STATUS_CONFIG[matchedKey]
    return {
      containerClass: cfg.categoryContainerClass,
      textClass: cfg.textClass,
      icon: cfg.icon,
      title: cfg.label,
      srSuffix: ` (${cfg.label})`,
    }
  } catch (error) {
    console.error('Error resolving category badge visual:', error)
    return DEFAULT_CATEGORY_BADGE_VISUAL
  }
}
