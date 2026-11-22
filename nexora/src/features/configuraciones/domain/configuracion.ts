import type { NavId } from '../../dashboard/ui/navigation'
import type { DashboardCardDefinition } from '../../dashboard/domain/dashboard-card'

export type ModuloCategoria =
  | 'todas'
  | 'operacion'
  | 'configuracion_hotelera'
  | 'accesos'
  | 'sistema'

export interface CategoriaFiltro {
  id: ModuloCategoria
  label: string
  description: string
}

export const CATEGORIAS_CONFIGURACION: readonly CategoriaFiltro[] = [
  { id: 'todas', label: 'Todos', description: 'Todos los módulos del ecosistema Aloja' },
  { id: 'operacion', label: 'Operación', description: 'Recepción, reservas, habitaciones y servicios de habitaciones' },
  { id: 'configuracion_hotelera', label: 'Configuración hotelera', description: 'Sedes, tipos de camas y tarifas comerciales' },
  { id: 'accesos', label: 'Accesos', description: 'Personas, usuarios y asignación de permisos' },
  { id: 'sistema', label: 'Sistema', description: 'Auditoría integral y personalización visual' },
] as const

export const MODULO_A_CATEGORIA: Record<NavId, ModuloCategoria> = {
  // 1. Operación
  recepcion: 'operacion',
  salidas: 'operacion',
  reservas: 'operacion',
  habitacion: 'operacion',
  servicios: 'operacion',

  // 2. Configuración hotelera
  sedes: 'configuracion_hotelera',
  cama: 'configuracion_hotelera',
  tarifas: 'configuracion_hotelera',

  // 3. Accesos
  personas: 'accesos',
  usuarios: 'accesos',
  recursos: 'accesos',

  // 4. Sistema
  auditoria: 'sistema',
  paletas: 'sistema',

  // Vistas auxiliares
  home: 'operacion',
  configuracion: 'sistema',
  perfil: 'accesos',
}

export interface GrupoModulosConfiguracion {
  categoria: Exclude<ModuloCategoria, 'todas'>
  titulo: string
  descripcion: string
  badge: string
  iconName: string
  modulosIds: readonly NavId[]
}

export const GRUPOS_CONFIGURACION: readonly GrupoModulosConfiguracion[] = [
  {
    categoria: 'operacion',
    titulo: 'Operación',
    descripcion: 'Recepción, reservas, inventario de habitaciones y servicio a la habitación.',
    badge: 'Front Desk & Huéspedes',
    iconName: 'ConciergeBellIcon',
    modulosIds: ['recepcion', 'salidas', 'reservas', 'habitacion', 'servicios'],
  },
  {
    categoria: 'configuracion_hotelera',
    titulo: 'Configuración hotelera',
    descripcion: 'Sedes de la red, catálogo tridimensional de camas y esquemas tarifarios.',
    badge: 'Estructura & Tarifas',
    iconName: 'BuildingIcon',
    modulosIds: ['sedes', 'cama', 'tarifas'],
  },
  {
    categoria: 'accesos',
    titulo: 'Accesos',
    descripcion: 'Directorio de personas, operadores del sistema y políticas de asignación de permisos.',
    badge: 'Seguridad & Permisos',
    iconName: 'ShieldIcon',
    modulosIds: ['personas', 'usuarios', 'recursos'],
  },
  {
    categoria: 'sistema',
    titulo: 'Sistema',
    descripcion: 'Auditoría integral de calidad e invariantes y personalización visual.',
    badge: 'Control & Apariencia',
    iconName: 'SparklesIcon',
    modulosIds: ['auditoria', 'paletas'],
  },
] as const

export interface GrupoModulosFiltrado {
  categoria: Exclude<ModuloCategoria, 'todas'>
  titulo: string
  descripcion: string
  badge: string
  iconName: string
  cards: readonly DashboardCardDefinition[]
}

export interface PreferenciasHotel {
  depositoGarantiaRequerido: boolean
  checkinExpress: boolean
  alertaOcupacionAlta: boolean
  auditoriaSegura: boolean
  modoMantenimiento: boolean
  sedePredeterminadaId: string
  monedaPredeterminada: string
}

export const PREFERENCIAS_HOTEL_DEFAULT: PreferenciasHotel = {
  depositoGarantiaRequerido: true,
  checkinExpress: true,
  alertaOcupacionAlta: true,
  auditoriaSegura: true,
  modoMantenimiento: false,
  sedePredeterminadaId: 'sede-central',
  monedaPredeterminada: 'COP ($)',
}
