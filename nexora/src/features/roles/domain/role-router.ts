import type { NavId } from '../../dashboard/ui/navigation'

/**
 * Estructura de Rol retornada por el endpoint GET /roles.
 */
export interface ApiRole {
  id: string
  name: string
  description: string
}

/**
 * Roles conocidos del sistema hotelero Nexora.
 */
export type KnownRoleName =
  | 'reception'
  | 'recepcionista'
  | 'gerente_sede'
  | 'manager'
  | 'admin'
  | 'super_admin'
  | 'housekeeping'
  | 'huesped'
  | 'guest'
  | 'admin-repro'
  | string

/**
 * Estado de clasificación del rol en el switch.
 */
export type RoleRoutingStatus =
  | 'reception_active' // Rol recepcionista con vista especializada activa
  | 'general_pending_future' // Rol conocido en sistema (admin, gerente, etc.) pendiente de asignación de página propia en el futuro
  | 'unrecognized_role' // Rol no encontrado en el switch
  | 'missing_role' // No se proporcionó el rol

/**
 * Decisión de redirección y metadatos resultantes de evaluar el rol en el switch.
 */
export interface RoleRedirectDecision {
  /** Nombre del rol evaluado (item `name` del switch) */
  roleName: string
  /** ID de navegación en el dashboard de Nexora */
  targetNavId: NavId
  /** Título humano de la página destino */
  pageTitle: string
  /** Descripción del alcance del rol */
  description: string
  /** Indica si corresponde al rol de recepción */
  isReception: boolean
  /** Estado de identificación en el switch */
  status: RoleRoutingStatus
  /** Indica si se presentó un problema al identificar un rol con vista especializada */
  hasRoleIssue: boolean
  /** Mensaje explicativo para el usuario o modal en caso de problema o rol sin vista propia */
  issueMessage?: string | null
}

/**
 * Switch estructurado para identificar roles y determinar la redirección correspondiente.
 * Utiliza estrictamente la propiedad `name` en sus bloques `case`.
 *
 * Reglas de negocio y Reglas de oro:
 * 1. Regla de oro: NO cambiar la condición de recepcionista en el switch de roles
 *    (`case 'reception': case 'recepcionista':` redirige a 'recepcion').
 * 2. Los demás roles cuentan con su estructura preparada para futuras indicaciones del usuario
 *    y avanzan al dashboard normal ('home') con aviso si es necesario.
 * 3. Bloque `default` seguro para roles no reconocidos o faltantes con `hasRoleIssue: true`.
 *
 * @param roleName Valor de la propiedad `name` del rol.
 * @returns `RoleRedirectDecision` con la ruta destino y metadatos del rol.
 */
export function resolveRoleRedirect(roleName: string): RoleRedirectDecision {
  // Normalizamos el valor de `name` para comparación predecible
  const normalizedName = (roleName || '').trim().toLowerCase()

  switch (normalizedName) {
    // =========================================================================
    // 1. ROL RECEPCIONISTA (Validación requerida por defecto)
    // Redirige al recepcionista a la página del dashboard de recepcionista ('recepcion')
    // REGLA DE ORO: No cambiar la condición de recepcionista en este switch de roles.
    // =========================================================================
    case 'reception':
    case 'recepcionista':
      return {
        roleName: 'reception',
        targetNavId: 'recepcion',
        pageTitle: 'Dashboard de Recepcionista',
        description: 'Recepcionista operativo para check-in, check-out y atención de huéspedes',
        isReception: true,
        status: 'reception_active',
        hasRoleIssue: false,
        issueMessage: null,
      }

    // =========================================================================
    // 2. DEMÁS ROLES (Estructurados para futuras indicaciones del usuario)
    // Avanzan a la página que normalmente se utiliza al iniciar sesión ('home')
    // =========================================================================
    case 'gerente_sede':
      return {
        roleName: 'gerente_sede',
        targetNavId: 'sedes',
        pageTitle: 'Gestión de Sedes y Sub-sedes',
        description: 'Administra una sede y sus sub-sedes',
        isReception: false,
        status: 'general_pending_future',
        hasRoleIssue: true,
        issueMessage:
          'El rol de Gerente de Sede aún no cuenta con una vista especializada activada. Avanzarás al panel principal del hotel.',
      }

    case 'manager':
      return {
        roleName: 'manager',
        targetNavId: 'home',
        pageTitle: 'Supervisión Operativa',
        description: 'Supervisor o gerente operativo de sede',
        isReception: false,
        status: 'general_pending_future',
        hasRoleIssue: true,
        issueMessage:
          'El rol de Manager aún no cuenta con una vista especializada activada. Avanzarás al panel principal del hotel.',
      }

    case 'admin':
      return {
        roleName: 'admin',
        targetNavId: 'home',
        pageTitle: 'Panel de Administración',
        description: 'Administrador / Dueño del Hotel con control de infraestructura y personal',
        isReception: false,
        status: 'general_pending_future',
        hasRoleIssue: true,
        issueMessage:
          'El rol de Administrador aún no cuenta con una vista especializada asignada. Avanzarás a la página que normalmente se utiliza al iniciar sesión.',
      }

    case 'super_admin':
      return {
        roleName: 'super_admin',
        targetNavId: 'home',
        pageTitle: 'Panel de Control Total',
        description: 'Control total del sistema',
        isReception: false,
        status: 'general_pending_future',
        hasRoleIssue: true,
        issueMessage:
          'El rol de Super Admin aún no cuenta con una vista especializada asignada. Avanzarás a la página que normalmente se utiliza al iniciar sesión.',
      }

    case 'housekeeping':
      return {
        roleName: 'housekeeping',
        targetNavId: 'servicios',
        pageTitle: 'Servicios de Limpieza y Habitaciones',
        description: 'Personal de limpieza y camarería',
        isReception: false,
        status: 'general_pending_future',
        hasRoleIssue: true,
        issueMessage:
          'El rol de Personal de Limpieza aún no cuenta con una vista especializada activada. Avanzarás al panel del hotel.',
      }

    case 'huesped':
    case 'guest':
      return {
        roleName: normalizedName,
        targetNavId: 'home',
        pageTitle: 'Portal del Huésped',
        description: 'Persona que ocupa habitaciones con acceso al portal de servicios',
        isReception: false,
        status: 'general_pending_future',
        hasRoleIssue: true,
        issueMessage:
          'El rol de Huésped aún no cuenta con una vista especializada asignada. Avanzarás a la página principal del hotel.',
      }

    case 'admin-repro':
      return {
        roleName: 'admin-repro',
        targetNavId: 'home',
        pageTitle: 'Panel de Reproducción',
        description: 'Rol operativo del sistema',
        isReception: false,
        status: 'general_pending_future',
        hasRoleIssue: true,
        issueMessage:
          'El rol admin-repro avanzará a la página habitual de inicio de sesión.',
      }

    // =========================================================================
    // 3. CASO POR DEFECTO (Roles futuros o no clasificados / problemas)
    // =========================================================================
    default: {
      const isMissing = !normalizedName
      return {
        roleName: normalizedName || 'desconocido',
        targetNavId: 'home',
        pageTitle: 'Inicio',
        description: 'Acceso general al sistema Nexora',
        isReception: false,
        status: isMissing ? 'missing_role' : 'unrecognized_role',
        hasRoleIssue: true,
        issueMessage: isMissing
          ? 'No se pudo identificar el rol del usuario en la respuesta de inicio de sesión. Avanzarás al panel principal del hotel.'
          : `Se presentó un inconveniente para identificar el rol "${normalizedName}" en el sistema. Avanzarás a la página habitual de inicio de sesión.`,
      }
    }
  }
}

