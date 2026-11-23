import { useSyncExternalStore } from 'react';
import {
  detectarRecursosDispositivoRecepciones,
  subscribeRecepcionesResourceBudget,
  type RecepcionesDeviceBudget,
} from '../infrastructure/recepciones-resource-detector';

/**
 * Hook reactivo que expone en tiempo real las capacidades detectadas
 * (GPU / RAM / VRAM / Red) y la política adaptativa de consumo mínimo.
 */
export function useRecepcionesResourceBudget(): RecepcionesDeviceBudget {
  return useSyncExternalStore(
    subscribeRecepcionesResourceBudget,
    detectarRecursosDispositivoRecepciones,
    detectarRecursosDispositivoRecepciones
  );
}
