import axios from 'axios'
import { getActiveHeadquarterId, getRawJwtToken } from '../shared/auth-storage'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean
  }
}

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_REST as string | undefined) || 'http://localhost:8080',
})

// Interceptor global para inyectar automáticamente el token JWT y la sede activa (X-Headquarter-ID)
api.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config
  }
  const token = getRawJwtToken()
  const activeHeadquarterId = getActiveHeadquarterId()

  if (config.headers && typeof (config.headers as unknown as { set?: unknown }).set === 'function') {
    const h = config.headers as unknown as {
      has: (key: string) => boolean
      set: (key: string, value: string) => void
    }
    if (token) {
      if (!h.has('Authorization') && !h.has('authorization')) {
        h.set('Authorization', `Bearer ${token}`)
      }
      if (!h.has('auth-token')) {
        h.set('auth-token', token)
      }
    }
    if (activeHeadquarterId && !h.has('X-Headquarter-ID')) {
      h.set('X-Headquarter-ID', activeHeadquarterId)
    }
  } else {
    config.headers = config.headers || {}
    if (token) {
      if (!config.headers.Authorization && !config.headers.authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
      if (!config.headers['auth-token']) {
        config.headers['auth-token'] = token
      }
    }
    if (activeHeadquarterId && !config.headers['X-Headquarter-ID']) {
      config.headers['X-Headquarter-ID'] = activeHeadquarterId
    }
  }
  return config
})