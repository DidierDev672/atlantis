import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'

export interface LoginApiResponse {
  status: number
  data: unknown
}

/**
 * Envía las credenciales al endpoint `POST /login` pasando por el balanceador
 * de peticiones y propagando errores HTTP hacia la capa de aplicación.
 */
export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginApiResponse> {
  const response = await executeBalancedRequest(() =>
    api.post('/login', {
      email: email.trim(),
      password,
    })
  )

  return {
    status: response.status,
    data: response.data,
  }
}
