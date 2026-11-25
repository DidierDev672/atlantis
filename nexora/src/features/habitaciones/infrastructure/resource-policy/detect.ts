import type {
  DeviceCapabilities,
  GpuInfo,
  NetworkInfo,
} from '../../domain/resource-policy/types';

interface NavigatorExtras extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    addEventListener(type: 'change', cb: () => void): void;
    removeEventListener(type: 'change', cb: () => void): void;
  };
}

/** Único módulo autorizado para consultar `navigator` y APIs de navegador. */
export const nav = (
  typeof navigator !== 'undefined' ? navigator : {}
) as NavigatorExtras;

let gpuCache: GpuInfo | null = null;

export function detectGpu(): GpuInfo {
  if (gpuCache) return gpuCache;

  let info: GpuInfo = { renderer: null, maxTextureSize: null };
  let gl: WebGLRenderingContext | null = null;

  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      gl = (canvas.getContext('webgl2') ??
        canvas.getContext('webgl')) as WebGLRenderingContext | null;

      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const rawRenderer = ext
          ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          : null;
        const rawMaxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);

        info = {
          renderer:
            typeof rawRenderer === 'string' && rawRenderer.trim()
              ? rawRenderer.trim()
              : null,
          maxTextureSize:
            typeof rawMaxTex === 'number' && Number.isFinite(rawMaxTex)
              ? rawMaxTex
              : null,
        };
      }
    }
  } catch {
    /* Sin WebGL o bloqueado por privacidad: se deja conservador en null */
  } finally {
    try {
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      /* Ignorar si la extensión de liberación no está disponible */
    }
  }

  gpuCache = info;
  return gpuCache;
}

export function detectNetwork(): NetworkInfo {
  try {
    const c = nav.connection;
    const rawType = c?.effectiveType;
    const effectiveType: NetworkInfo['effectiveType'] =
      rawType === 'slow-2g' ||
      rawType === '2g' ||
      rawType === '3g' ||
      rawType === '4g'
        ? rawType
        : 'unknown';

    return {
      online: typeof nav.onLine === 'boolean' ? nav.onLine : true,
      effectiveType,
      downlinkMbps: typeof c?.downlink === 'number' ? c.downlink : null,
      rttMs: typeof c?.rtt === 'number' ? c.rtt : null,
      saveData: Boolean(c?.saveData),
    };
  } catch {
    return {
      online: true,
      effectiveType: 'unknown',
      downlinkMbps: null,
      rttMs: null,
      saveData: false,
    };
  }
}

export function detectCapabilities(): DeviceCapabilities {
  try {
    const prefersReducedMotion =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    const pageVisible =
      typeof document !== 'undefined'
        ? document.visibilityState === 'visible'
        : true;

    return {
      cpuCores:
        typeof nav.hardwareConcurrency === 'number' &&
        nav.hardwareConcurrency > 0
          ? nav.hardwareConcurrency
          : null,
      memoryGB:
        typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0
          ? nav.deviceMemory
          : null,
      gpu: detectGpu(),
      network: detectNetwork(),
      prefersReducedMotion,
      pageVisible,
    };
  } catch {
    return {
      cpuCores: null,
      memoryGB: null,
      gpu: { renderer: null, maxTextureSize: null },
      network: {
        online: true,
        effectiveType: 'unknown',
        downlinkMbps: null,
        rttMs: null,
        saveData: false,
      },
      prefersReducedMotion: false,
      pageVisible: true,
    };
  }
}
