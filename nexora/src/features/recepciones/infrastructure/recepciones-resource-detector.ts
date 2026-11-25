import {
  detectarCapacidadesHardwareYRed,
  subscribeDeviceResourceProfile,
  type HardwareLevel,
  type ResourceTier,
} from '../../habitaciones/infrastructure/device-resource-profile';
import type { NetworkProfile } from '../../servicio-habitaciones/infrastructure/network-quality';

export interface RecepcionesRamMetrics {
  tier: HardwareLevel;
  deviceMemoryGb: number | null;
  jsHeapLimitMb: number | null;
  cpuCores: number | null;
}

export interface RecepcionesGpuMetrics {
  tier: HardwareLevel;
  renderer: string | null;
  isSoftwareRenderer: boolean;
  prefersReducedMotion: boolean;
}

export interface RecepcionesVramMetrics {
  tier: HardwareLevel;
  estimatedVramMb: number | null;
  maxTextureSize: number | null;
  maxRenderbufferSize: number | null;
  maxViewportWidth: number | null;
  devicePixelRatio: number;
}

export interface RecepcionesAdaptivePolicy {
  tier: ResourceTier;
  enableAnimations: boolean;
  enableBackdropBlur: boolean;
  enableTransitions: boolean;
  batchConcurrency: number;
  serviceRequestsConcurrency: number;
  stayPersonsConcurrency: number;
  tablePageSize: number;
  salidasPageSize: number;
  initialServicePrefetchLimit: number;
  allowBackgroundEnrichment: boolean;
  cacheTtlMs: number;
  maxRetries: number;
  summaryLabel: string;
}

export interface RecepcionesDeviceBudget {
  ram: RecepcionesRamMetrics;
  gpu: RecepcionesGpuMetrics;
  vram: RecepcionesVramMetrics;
  network: NetworkProfile;
  policy: RecepcionesAdaptivePolicy;
}

interface PerformanceMemoryLike {
  jsHeapSizeLimit?: number;
}

interface WebGLVramLimits {
  maxRenderbufferSize: number | null;
  maxViewportWidth: number | null;
}

const INTEGRATED_OR_MOBILE_GPU_REGEX =
  /intel\(r\) (?:hd|uhd|iris)|mali-g|adreno \(tm\) [56]|apple gpu/i;
const HIGH_VRAM_GPU_REGEX =
  /nvidia|geforce rtx|geforce gtx|quadro|radeon rx|radeon pro|apple m[1-9]/i;

let cachedVramLimits: WebGLVramLimits | null = null;
let cachedBudget: RecepcionesDeviceBudget | null = null;
let lastLoggedSignature: string | null = null;

function logDeviceBudgetInDev(budget: RecepcionesDeviceBudget): void {
  try {
    if (!import.meta.env.DEV) return;
    const signature = [
      budget.policy.tier,
      budget.ram.tier,
      budget.gpu.tier,
      budget.vram.tier,
      budget.network.tier,
      budget.network.saveData,
      budget.gpu.prefersReducedMotion,
    ].join('|');

    if (lastLoggedSignature === signature) return;
    lastLoggedSignature = signature;

    console.groupCollapsed(
      `[Recepciones · Recursos Dispositivo] ${budget.policy.summaryLabel} (${budget.policy.tier})`
    );
    console.table({
      RAM: {
        tier: budget.ram.tier,
        detalle:
          budget.ram.deviceMemoryGb != null
            ? `${budget.ram.deviceMemoryGb} GB (CPU ${budget.ram.cpuCores ?? '?'} núcleos, JS Heap ${budget.ram.jsHeapLimitMb ?? '?'} MB)`
            : `CPU ${budget.ram.cpuCores ?? '?'} núcleos, JS Heap ${budget.ram.jsHeapLimitMb ?? '?'} MB`,
      },
      GPU: {
        tier: budget.gpu.tier,
        detalle: `${budget.gpu.renderer || 'No expuesto'}${budget.gpu.isSoftwareRenderer ? ' [Software]' : ''}`,
      },
      VRAM: {
        tier: budget.vram.tier,
        detalle: `~${budget.vram.estimatedVramMb ?? '?'} MB est. (Tex ${budget.vram.maxTextureSize ?? '?'}px, RB ${budget.vram.maxRenderbufferSize ?? '?'}px, DPR ${budget.vram.devicePixelRatio})`,
      },
      Red: {
        tier: budget.network.tier,
        detalle: `${budget.network.label} · ${budget.network.effectiveType}${budget.network.downlinkMbps != null ? ` (${budget.network.downlinkMbps} Mbps)` : ''}${budget.network.saveData ? ' · Save-Data' : ''}`,
      },
    });
    console.info('Política adaptativa aplicada:', budget.policy);
    console.groupEnd();
  } catch {
    // Nunca fallar en telemetría de desarrollo
  }
}

function readJsHeapLimitMb(): number | null {
  try {
    if (typeof performance === 'undefined') return null;
    const perfWithMem = performance as Performance & {
      memory?: PerformanceMemoryLike;
    };
    const bytes = perfWithMem.memory?.jsHeapSizeLimit;
    if (typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0) {
      return Math.round(bytes / (1024 * 1024));
    }
    return null;
  } catch {
    return null;
  }
}

function readWebGlVramLimits(): WebGLVramLimits {
  if (cachedVramLimits) return cachedVramLimits;
  try {
    if (typeof document === 'undefined') {
      cachedVramLimits = {
        maxRenderbufferSize: null,
        maxViewportWidth: null,
      };
      return cachedVramLimits;
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
      cachedVramLimits = {
        maxRenderbufferSize: null,
        maxViewportWidth: null,
      };
      return cachedVramLimits;
    }

    let maxRenderbufferSize: number | null = null;
    let maxViewportWidth: number | null = null;

    try {
      const rb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      if (typeof rb === 'number' && rb > 0) {
        maxRenderbufferSize = rb;
      }
      const vp = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as
        | Int32Array
        | number[]
        | null;
      if (vp && typeof vp[0] === 'number' && vp[0] > 0) {
        maxViewportWidth = vp[0];
      }
    } catch {
      // Ignorar restricciones de privacidad del navegador
    } finally {
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        // Ignorar si la extensión no existe
      }
    }

    cachedVramLimits = { maxRenderbufferSize, maxViewportWidth };
    return cachedVramLimits;
  } catch {
    cachedVramLimits = {
      maxRenderbufferSize: null,
      maxViewportWidth: null,
    };
    return cachedVramLimits;
  }
}

function resolveVramMetrics(
  gpuTier: HardwareLevel,
  renderer: string | null,
  maxTextureSize: number | null,
  isSoftwareRenderer: boolean
): RecepcionesVramMetrics {
  const limits = readWebGlVramLimits();
  const dpr =
    typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number'
      ? Math.min(3, Math.max(1, window.devicePixelRatio))
      : 1;

  if (
    isSoftwareRenderer ||
    gpuTier === 'low' ||
    (maxTextureSize !== null && maxTextureSize <= 4096) ||
    (limits.maxRenderbufferSize !== null && limits.maxRenderbufferSize <= 4096)
  ) {
    return {
      tier: 'low',
      estimatedVramMb: isSoftwareRenderer ? 256 : 512,
      maxTextureSize,
      maxRenderbufferSize: limits.maxRenderbufferSize,
      maxViewportWidth: limits.maxViewportWidth,
      devicePixelRatio: dpr,
    };
  }

  const isDedicated = Boolean(renderer && HIGH_VRAM_GPU_REGEX.test(renderer));
  const isIntegrated = Boolean(
    renderer && INTEGRATED_OR_MOBILE_GPU_REGEX.test(renderer)
  );

  if (
    isDedicated &&
    gpuTier === 'high' &&
    (maxTextureSize === null || maxTextureSize >= 16384)
  ) {
    return {
      tier: 'high',
      estimatedVramMb: 4096,
      maxTextureSize,
      maxRenderbufferSize: limits.maxRenderbufferSize,
      maxViewportWidth: limits.maxViewportWidth,
      devicePixelRatio: dpr,
    };
  }

  const mediumVram = isIntegrated || gpuTier === 'medium';
  return {
    tier: mediumVram ? 'medium' : 'high',
    estimatedVramMb: mediumVram ? 1536 : 2048,
    maxTextureSize,
    maxRenderbufferSize: limits.maxRenderbufferSize,
    maxViewportWidth: limits.maxViewportWidth,
    devicePixelRatio: dpr,
  };
}

function buildRecepcionesPolicy(
  ram: RecepcionesRamMetrics,
  gpu: RecepcionesGpuMetrics,
  vram: RecepcionesVramMetrics,
  network: NetworkProfile
): RecepcionesAdaptivePolicy {
  const isSlowOrOfflineNet =
    network.tier === 'offline' ||
    network.tier === 'low' ||
    network.saveData;

  const isUltraLight =
    ram.tier === 'low' ||
    gpu.tier === 'low' ||
    vram.tier === 'low' ||
    gpu.isSoftwareRenderer ||
    gpu.prefersReducedMotion ||
    isSlowOrOfflineNet;

  if (isUltraLight) {
    const batchConcurrency =
      network.tier === 'offline'
        ? 1
        : Math.max(1, Math.min(2, network.maxConcurrentRequests));

    return {
      tier: 'ultra-light',
      enableAnimations: false,
      enableBackdropBlur: false,
      enableTransitions: false,
      batchConcurrency,
      serviceRequestsConcurrency: 1,
      stayPersonsConcurrency: 1,
      tablePageSize: 8,
      salidasPageSize: 6,
      initialServicePrefetchLimit:
        network.tier === 'offline' ||
        network.saveData ||
        network.effectiveType === '2g' ||
        network.effectiveType === 'slow-2g'
          ? 0
          : 4,
      allowBackgroundEnrichment:
        network.online && network.enableBackgroundMetadata,
      cacheTtlMs: Math.max(network.cacheTtlMs, 5 * 60 * 1000),
      maxRetries: 0,
      summaryLabel: isSlowOrOfflineNet
        ? 'Ahorro máximo de red y recursos activo'
        : 'Modo ahorro GPU/RAM/VRAM activo',
    };
  }

  const isBalanced =
    ram.tier === 'medium' ||
    gpu.tier === 'medium' ||
    vram.tier === 'medium' ||
    (ram.cpuCores !== null && ram.cpuCores <= 4) ||
    network.tier === 'medium';

  if (isBalanced) {
    const batchConcurrency = Math.max(
      2,
      Math.min(3, network.maxConcurrentRequests)
    );
    return {
      tier: 'balanced',
      enableAnimations: true,
      enableBackdropBlur: false,
      enableTransitions: true,
      batchConcurrency,
      serviceRequestsConcurrency: 2,
      stayPersonsConcurrency: 2,
      tablePageSize: 12,
      salidasPageSize: 6,
      initialServicePrefetchLimit: 6,
      allowBackgroundEnrichment: network.enableBackgroundMetadata,
      cacheTtlMs: Math.max(network.cacheTtlMs, 3 * 60 * 1000),
      maxRetries: 1,
      summaryLabel: 'Modo balanceado (GPU/VRAM/Red)',
    };
  }

  return {
    tier: 'full',
    enableAnimations: true,
    enableBackdropBlur: true,
    enableTransitions: true,
    batchConcurrency: Math.min(5, network.maxConcurrentRequests),
    serviceRequestsConcurrency: 4,
    stayPersonsConcurrency: 4,
    tablePageSize: 15,
    salidasPageSize: 9,
    initialServicePrefetchLimit: 9,
    allowBackgroundEnrichment: true,
    cacheTtlMs: network.cacheTtlMs,
    maxRetries: 1,
    summaryLabel: 'Rendimiento completo',
  };
}

/**
 * Función dedicada para detectar capacidades reales de GPU, RAM, VRAM y calidad de red
 * del dispositivo en el módulo de Recepciones, devolviendo límites adaptativos
 * para minimizar consumo de hardware y ancho de banda.
 */
export function detectarRecursosDispositivoRecepciones(): RecepcionesDeviceBudget {
  try {
    const base = detectarCapacidadesHardwareYRed();
    const jsHeapLimitMb = readJsHeapLimitMb();

    const effectiveRamTier: HardwareLevel =
      base.hardware.ramTier === 'low' ||
      (jsHeapLimitMb !== null && jsHeapLimitMb <= 1024)
        ? 'low'
        : base.hardware.ramTier;

    const ram: RecepcionesRamMetrics = {
      tier: effectiveRamTier,
      deviceMemoryGb: base.hardware.ramGb,
      jsHeapLimitMb,
      cpuCores: base.hardware.cpuCores,
    };

    const gpu: RecepcionesGpuMetrics = {
      tier: base.hardware.gpuTier,
      renderer: base.hardware.gpuRenderer,
      isSoftwareRenderer: base.hardware.isSoftwareRenderer,
      prefersReducedMotion: base.hardware.prefersReducedMotion,
    };

    const vram = resolveVramMetrics(
      base.hardware.gpuTier,
      base.hardware.gpuRenderer,
      base.hardware.maxTextureSize,
      base.hardware.isSoftwareRenderer
    );

    const policy = buildRecepcionesPolicy(ram, gpu, vram, base.network);

    if (
      cachedBudget &&
      cachedBudget.policy.tier === policy.tier &&
      cachedBudget.network.tier === base.network.tier &&
      cachedBudget.network.saveData === base.network.saveData &&
      cachedBudget.gpu.prefersReducedMotion === gpu.prefersReducedMotion
    ) {
      return cachedBudget;
    }

    cachedBudget = {
      ram,
      gpu,
      vram,
      network: base.network,
      policy,
    };
    logDeviceBudgetInDev(cachedBudget);
    return cachedBudget;
  } catch (err) {
    console.warn(
      '[detectarRecursosDispositivoRecepciones] Usando perfil seguro por defecto:',
      err
    );
    const fallbackBase = detectarCapacidadesHardwareYRed();
    return {
      ram: {
        tier: 'medium',
        deviceMemoryGb: null,
        jsHeapLimitMb: null,
        cpuCores: null,
      },
      gpu: {
        tier: 'medium',
        renderer: null,
        isSoftwareRenderer: false,
        prefersReducedMotion: false,
      },
      vram: {
        tier: 'medium',
        estimatedVramMb: null,
        maxTextureSize: null,
        maxRenderbufferSize: null,
        maxViewportWidth: null,
        devicePixelRatio: 1,
      },
      network: fallbackBase.network,
      policy: {
        tier: 'balanced',
        enableAnimations: true,
        enableBackdropBlur: false,
        enableTransitions: true,
        batchConcurrency: 2,
        serviceRequestsConcurrency: 2,
        stayPersonsConcurrency: 2,
        tablePageSize: 10,
        salidasPageSize: 6,
        initialServicePrefetchLimit: 4,
        allowBackgroundEnrichment: fallbackBase.network.enableBackgroundMetadata,
        cacheTtlMs: 3 * 60 * 1000,
        maxRetries: 0,
        summaryLabel: 'Modo seguro balanceado',
      },
    };
  }
}

export function subscribeRecepcionesResourceBudget(
  listener: () => void
): () => void {
  return subscribeDeviceResourceProfile(listener);
}
