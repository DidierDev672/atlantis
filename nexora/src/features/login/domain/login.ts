import type { RoleRedirectDecision } from '../../roles/domain/role-router'

export const TOKEN_KEY = 'nexora.auth.token'
export const DEFAULT_HOTEL_NAME = 'Hoteles · Operaciones'

export interface LoginProps {
  /** Se invoca al recibir el token, por si la app quiere redirigir o persistir más allá. */
  onSuccess?: (token: string) => void
  /** Se invoca al pulsar "Continuar a mi hotel", para navegar al dashboard. */
  onContinue?: () => void
}

export interface LoginErrors {
  email?: string
  password?: string
}

export interface RoleIssueModalData {
  isOpen: boolean
  decision: RoleRedirectDecision
  rawRole: string
  userEmail: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Valida formato de correo y presencia de contraseña. */
export function validateLoginCredentials(
  email: string,
  password: string
): LoginErrors {
  const next: LoginErrors = {}
  const value = email.trim()

  if (!value) {
    next.email = 'Escribe tu correo para continuar.'
  } else if (!EMAIL_PATTERN.test(value)) {
    next.email = 'Revisa el formato: usuario@correo.com'
  }

  if (!password) {
    next.password = 'Escribe tu contraseña.'
  }

  return next
}

/** Extrae de forma segura el token JWT desde posibles formas del payload de `/login`. */
export function extractAuthToken(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as Record<string, unknown>
  const nested =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : undefined
  const raw = record.token ?? record.access_token ?? nested?.token
  return typeof raw === 'string' && raw.trim() ? raw : undefined
}

/** Extrae el rol devuelto por `/login` o por el usuario persistido en almacenamiento. */
export function extractRawRole(
  data: unknown,
  fallbackUser?: { role_name?: string; role?: string } | null
): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const user =
      record.user && typeof record.user === 'object'
        ? (record.user as Record<string, unknown>)
        : undefined
    const nested =
      record.data && typeof record.data === 'object'
        ? (record.data as Record<string, unknown>)
        : undefined

    const candidate =
      record.role_name ??
      record.role ??
      user?.role_name ??
      user?.role ??
      nested?.role_name ??
      nested?.role

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return fallbackUser?.role_name ?? fallbackUser?.role ?? ''
}
