export type Tier = 'low' | 'medium' | 'high';

export type AnimationLevel = 'none' | 'reduced' | 'full';

export interface GpuInfo {
  renderer: string | null;
  maxTextureSize: number | null;
}

export interface NetworkInfo {
  online: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlinkMbps: number | null;
  rttMs: number | null;
  saveData: boolean;
}

export interface DeviceCapabilities {
  cpuCores: number | null;
  memoryGB: number | null;
  gpu: GpuInfo;
  network: NetworkInfo;
  prefersReducedMotion: boolean;
  pageVisible: boolean;
}

export interface ResourcePolicy {
  deviceTier: Tier;
  networkTier: Tier;
  animation: AnimationLevel;
  effects: boolean;
  image: {
    maxDpr: number;
    quality: number;
    lazy: boolean;
  };
  video: {
    autoplay: boolean;
    preload: 'none' | 'metadata' | 'auto';
  };
  data: {
    prefetch: boolean;
    pageSize: number;
    pollingMs: number | null;
  };
}

/** Lo único que un componente hijo puede pedir: más restricción, nunca ampliación. */
export interface PolicyLimits {
  animation?: AnimationLevel;
  effects?: false;
  maxImageDpr?: number;
  videoAutoplay?: false;
  prefetch?: false;
}
