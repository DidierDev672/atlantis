import { useSyncExternalStore } from 'react'
import {
  detectarPerfilRedDisponible,
  subscribeNetworkProfile,
  type NetworkProfile,
} from '../infrastructure/network-quality'

/**
 * Hook reactivo que expone la calidad de red detectada en tiempo real
 * para adaptar descargas, caché y concurrencia sin re-renders innecesarios.
 */
export function useNetworkProfile(): NetworkProfile {
  return useSyncExternalStore(
    subscribeNetworkProfile,
    detectarPerfilRedDisponible,
    detectarPerfilRedDisponible
  )
}
