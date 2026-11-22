import {
  detectarPerfilRedDisponible,
  subscribeNetworkProfile,
  type NetworkProfile,
} from '../../servicio-habitaciones/infrastructure/network-quality';

export type ResourceTier = 'ultra-light' | 'balanced' | 'full';
export type HardwareLevel = 'low' | 'medium' | 'high';

export interface HardwareCapabilities {
  ramGb: number | null;
  cpuCores: number | null;
  gpuTier: HardwareLevel;
  gpuRenderer: string | null;
  maxTextureSize: number | null;
  isSoftwareRenderer: boolean;
  prefersReducedMotion: boolean;
  ramTier: HardwareLevel;
}

export interface DeviceResourcePolicy {
  tier: ResourceTier;
  enableAnimations: boolean;
  enableBackdropBlur: boolean;
  batchConcurrency: number;
  personsPageLimit: number;
  tariffCacheTtlMs: number;
  maxRetainedTariffEntries: number;
  defaultViewMode: 'compact' | 'cards';
  allowPreloadAllBuildings: boolean;
  summaryLabel: string;
}

export interface DeviceResourceProfile {
  hardware: HardwareCapabilities;
  network: NetworkProfile;
  policy: DeviceResourcePolicy;
}

const SOFTWARE_RENDERER_REGEX =
  /swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render|google swiftshader/i;

const LOW_GPU_REGEX =
  /mali-4|mali-t|adreno \(tm\) [234]|powervr sgx|intel\(r\) hd graphics [234]/i;

let cachedHardware: HardwareCapabilities | null = null;
let cachedProfile: DeviceResourceProfile | null = null;
const profileListeners = new Set<() => void>();
let isSubscribedToSources = false;

function probeGpuCapabilities(): {
  gpuTier: HardwareLevel;
  gpuRenderer: string | null;
  maxTextureSize: number | null;
  isSoftwareRenderer: boolean;
} {
  try {
    if (typeof document === 'undefined') {
      return {
        gpuTier: 'medium',
        gpuRenderer: null,
        maxTextureSize: null,
        isSoftwareRenderer: false,
      };
    }

    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2', {
      failIfMajorPerformanceCaveat: true,
    }) ||
      canvas.getContext('webgl', {
        failIfMajorPerformanceCaveat: true,
      }) ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      return {
        gpuTier: 'low',
        gpuRenderer: 'Sin aceleración WebGL',
        maxTextureSize: null,
        isSoftwareRenderer: true,
      };
    }

    let gpuRenderer: string | null = null;
    let maxTextureSize: number | null = null;

    try {
      const texParam = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (typeof texParam === 'number') {
        maxTextureSize = texParam;
      }
      const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugExt) {
        const rawRenderer = gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL);
        if (typeof rawRenderer === 'string' && rawRenderer.trim()) {
          gpuRenderer = rawRenderer.trim();
        }
      }
    } catch {
      // Parámetros WebGL restringidos por privacidad del navegador
    } finally {
      // Liberar el contexto WebGL temporal inmediatamente para consumir 0 VRAM en reposo
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        // Ignorar si no está soportado
      }
    }

    const isSoftwareRenderer = Boolean(
      gpuRenderer && SOFTWARE_RENDERER_REGEX.test(gpuRenderer)
    );
    const isLowGpuModel = Boolean(
      gpuRenderer && LOW_GPU_REGEX.test(gpuRenderer)
    );

    const gpuTier: HardwareLevel =
      isSoftwareRenderer ||
      isLowGpuModel ||
      (maxTextureSize !== null && maxTextureSize <= 4096)
        ? 'low'
        : maxTextureSize !== null && maxTextureSize <= 8192
          ? 'medium'
          : 'high';

    return { gpuTier, gpuRenderer, maxTextureSize, isSoftwareRenderer };
  } catch {
    return {
      gpuTier: 'medium',
      gpuRenderer: null,
      maxTextureSize: null,
      isSoftwareRenderer: false,
    };
  }
}

function readHardwareCapabilities(): HardwareCapabilities {
  if (cachedHardware) return cachedHardware;

  let ramGb: number | null = null;
  let cpuCores: number | null = null;
  let prefersReducedMotion = false;

  try {
    if (typeof navigator !== 'undefined') {
      const nav = navigator as Navigator & { deviceMemory?: number };
      if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0) {
        ramGb = nav.deviceMemory;
      }
      if (
        typeof navigator.hardwareConcurrency === 'number' &&
        navigator.hardwareConcurrency > 0
      ) {
        cpuCores = navigator.hardwareConcurrency;
      }
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
    }
  } catch {
    // Fallback conservador si las APIs del navegador están bloqueadas
  }

  const gpu = probeGpuCapabilities();

  const ramTier: HardwareLevel =
    ramGb !== null
      ? ramGb <= 2
        ? 'low'
        : ramGb <= 4
          ? 'medium'
          : 'high'
      : cpuCores !== null && cpuCores <= 2
        ? 'low'
        : cpuCores !== null && cpuCores <= 4
          ? 'medium'
          : 'high';

  cachedHardware = {
    ramGb,
    cpuCores,
    gpuTier: gpu.gpuTier,
    gpuRenderer: gpu.gpuRenderer,
    maxTextureSize: gpu.maxTextureSize,
    isSoftwareRenderer: gpu.isSoftwareRenderer,
    prefersReducedMotion,
    ramTier,
  };
  return cachedHardware;
}

function buildResourcePolicy(
  hardware: HardwareCapabilities,
  network: NetworkProfile
): DeviceResourcePolicy {
  const isUltraLight =
    hardware.ramTier === 'low' ||
    hardware.gpuTier === 'low' ||
    hardware.isSoftwareRenderer ||
    hardware.prefersReducedMotion ||
    network.tier === 'offline' ||
    network.tier === 'low';

  if (isUltraLight) {
    return {
      tier: 'ultra-light',
      enableAnimations: false,
      enableBackdropBlur: false,
      batchConcurrency: 2,
      personsPageLimit: 10,
      tariffCacheTtlMs: 6 * 60 * 1000,
      maxRetainedTariffEntries: 60,
      defaultViewMode: 'compact',
      allowPreloadAllBuildings:
        network.tier !== 'offline' && network.tier !== 'low',
      summaryLabel: 'Modo ahorro activo (GPU/RAM/Red optimizado)',
    };
  }

  const isBalanced =
    hardware.ramTier === 'medium' ||
    hardware.gpuTier === 'medium' ||
    (hardware.cpuCores !== null && hardware.cpuCores <= 4) ||
    network.tier === 'medium';

  if (isBalanced) {
    return {
      tier: 'balanced',
      enableAnimations: true,
      enableBackdropBlur: false,
      batchConcurrency: 4,
      personsPageLimit: 15,
      tariffCacheTtlMs: 4 * 60 * 1000,
      maxRetainedTariffEntries: 90,
      defaultViewMode: 'cards',
      allowPreloadAllBuildings: true,
      summaryLabel: 'Modo balanceado',
    };
  }

  return {
    tier: 'full',
    enableAnimations: true,
    enableBackdropBlur: true,
    batchConcurrency: 6,
    personsPageLimit: 20,
    tariffCacheTtlMs: 3 * 60 * 1000,
    maxRetainedTariffEntries: 120,
    defaultViewMode: 'cards',
    allowPreloadAllBuildings: true,
    summaryLabel: 'Rendimiento completo',
  };
}

function refreshCachedProfile(): DeviceResourceProfile {
  const hardware = readHardwareCapabilities();
  const network = detectarPerfilRedDisponible();
  const policy = buildResourcePolicy(hardware, network);

  if (
    cachedProfile &&
    cachedProfile.policy.tier === policy.tier &&
    cachedProfile.network.tier === network.tier &&
    cachedProfile.hardware.prefersReducedMotion === hardware.prefersReducedMotion
  ) {
    return cachedProfile;
  }

  cachedProfile = { hardware, network, policy };
  return cachedProfile;
}

function ensureProfileListeners(): void {
  if (isSubscribedToSources || typeof window === 'undefined') return;
  try {
    isSubscribedToSources = true;
    subscribeNetworkProfile(() => {
      const prevTier = cachedProfile?.policy.tier;
      const prevNet = cachedProfile?.network.tier;
      const next = refreshCachedProfile();
      if (next.policy.tier !== prevTier || next.network.tier !== prevNet) {
        profileListeners.forEach((fn) => fn());
      }
    });

    if (typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener?.('change', () => {
        cachedHardware = null;
        refreshCachedProfile();
        profileListeners.forEach((fn) => fn());
      });
    }
  } catch {
    // Fallback seguro si el entorno restringe listeners
  }
}

/**
 * Detecta capacidades reales de hardware (RAM, núcleos CPU, GPU/VRAM vía WebGL)
 * y calidad de red (`navigator.connection`), retornando políticas adaptativas
 * para proteger dispositivos de bajos recursos.
 */
export function detectarCapacidadesHardwareYRed(): DeviceResourceProfile {
  try {
    ensureProfileListeners();
    return refreshCachedProfile();
  } catch {
    return {
      hardware: {
        ramGb: null,
        cpuCores: null,
        gpuTier: 'medium',
        gpuRenderer: null,
        maxTextureSize: null,
        isSoftwareRenderer: false,
        prefersReducedMotion: false,
        ramTier: 'medium',
      },
      network: detectarPerfilRedDisponible(),
      policy: {
        tier: 'balanced',
        enableAnimations: true,
        enableBackdropBlur: false,
        batchConcurrency: 4,
        personsPageLimit: 15,
        tariffCacheTtlMs: 4 * 60 * 1000,
        maxRetainedTariffEntries: 90,
        defaultViewMode: 'cards',
        allowPreloadAllBuildings: true,
        summaryLabel: 'Modo balanceado',
      },
    };
  }
}

export function subscribeDeviceResourceProfile(
  listener: () => void
): () => void {
  ensureProfileListeners();
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}
