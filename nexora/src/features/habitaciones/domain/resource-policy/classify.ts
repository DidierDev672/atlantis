import type { DeviceCapabilities, GpuInfo, NetworkInfo, Tier } from './types';

const ORDER: Tier[] = ['low', 'medium', 'high'];

const worst = (...tiers: Tier[]): Tier =>
  ORDER[Math.min(...tiers.map((tier) => ORDER.indexOf(tier)))];

const cpuTier = (cores: number | null): Tier =>
  cores === null ? 'medium' : cores <= 2 ? 'low' : cores <= 4 ? 'medium' : 'high';

const memTier = (memoryGB: number | null): Tier =>
  memoryGB === null
    ? 'medium'
    : memoryGB <= 2
      ? 'low'
      : memoryGB <= 4
        ? 'medium'
        : 'high';

function gpuTier(gpu: GpuInfo): Tier {
  if (
    gpu.renderer &&
    /swiftshader|llvmpipe|software|basic render/i.test(gpu.renderer)
  ) {
    return 'low';
  }
  if (gpu.maxTextureSize !== null && gpu.maxTextureSize < 8192) {
    return 'low';
  }
  // Sin tabla de modelos no se afirma "high"; lo desconocido es conservadoramente "medium"
  return 'medium';
}

/** Clasifica el dispositivo aplicando el criterio del eslabón más débil. */
export function classifyDevice(c: DeviceCapabilities): Tier {
  try {
    return worst(cpuTier(c.cpuCores), memTier(c.memoryGB), gpuTier(c.gpu));
  } catch {
    return 'medium';
  }
}

/** Clasifica la calidad de red actual de forma prudente. */
export function classifyNetwork(n: NetworkInfo): Tier {
  try {
    if (!n.online || n.saveData) return 'low';
    if (n.effectiveType === 'slow-2g' || n.effectiveType === '2g') return 'low';
    if (n.effectiveType === '3g') return 'medium';
    if (n.effectiveType === '4g') return 'high';
    return 'medium';
  } catch {
    return 'medium';
  }
}
