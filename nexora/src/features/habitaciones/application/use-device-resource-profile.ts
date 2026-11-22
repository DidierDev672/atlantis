import { useSyncExternalStore } from 'react';
import {
  detectarCapacidadesHardwareYRed,
  subscribeDeviceResourceProfile,
  type DeviceResourceProfile,
} from '../infrastructure/device-resource-profile';

/**
 * Hook reactivo que expone las capacidades de hardware (GPU/RAM/VRAM) y red
 * junto con las políticas adaptativas para optimizar el rendimiento.
 */
export function useDeviceResourceProfile(): DeviceResourceProfile {
  return useSyncExternalStore(
    subscribeDeviceResourceProfile,
    detectarCapacidadesHardwareYRed,
    detectarCapacidadesHardwareYRed
  );
}
