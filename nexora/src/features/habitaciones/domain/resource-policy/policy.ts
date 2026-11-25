import { classifyDevice, classifyNetwork } from './classify';
import type {
  AnimationLevel,
  DeviceCapabilities,
  PolicyLimits,
  ResourcePolicy,
  Tier,
} from './types';

const BY_DEVICE: Record<Tier, { animation: AnimationLevel; effects: boolean }> =
  {
    low: { animation: 'reduced', effects: false },
    medium: { animation: 'reduced', effects: true },
    high: { animation: 'full', effects: true },
  };

const BY_NETWORK: Record<Tier, Pick<ResourcePolicy, 'image' | 'video' | 'data'>> =
  {
    low: {
      image: { maxDpr: 1, quality: 50, lazy: true },
      video: { autoplay: false, preload: 'none' },
      data: { prefetch: false, pageSize: 10, pollingMs: null },
    },
    medium: {
      image: { maxDpr: 2, quality: 70, lazy: true },
      video: { autoplay: false, preload: 'metadata' },
      data: { prefetch: false, pageSize: 20, pollingMs: 60_000 },
    },
    high: {
      image: { maxDpr: 3, quality: 85, lazy: true },
      video: { autoplay: true, preload: 'auto' },
      data: { prefetch: true, pageSize: 40, pollingMs: 30_000 },
    },
  };

const ANIM_RANK: Record<AnimationLevel, number> = {
  none: 0,
  reduced: 1,
  full: 2,
};

export const FALLBACK_CONSERVATIVE_POLICY: ResourcePolicy = {
  deviceTier: 'medium',
  networkTier: 'medium',
  animation: 'reduced',
  effects: true,
  image: BY_NETWORK.medium.image,
  video: BY_NETWORK.medium.video,
  data: BY_NETWORK.medium.data,
};

export function buildPolicy(c: DeviceCapabilities): ResourcePolicy {
  try {
    const deviceTier = classifyDevice(c);
    const networkTier = classifyNetwork(c.network);
    const deviceConfig = BY_DEVICE[deviceTier];
    const networkConfig = BY_NETWORK[networkTier];
    const mustCalm = c.prefersReducedMotion || !c.pageVisible;

    return {
      deviceTier,
      networkTier,
      animation: mustCalm ? 'none' : deviceConfig.animation,
      effects: deviceConfig.effects,
      image: {
        ...networkConfig.image,
        maxDpr: deviceTier === 'low' ? 1 : networkConfig.image.maxDpr,
      },
      video: networkConfig.video,
      data: networkConfig.data,
    };
  } catch {
    return FALLBACK_CONSERVATIVE_POLICY;
  }
}

/** Un componente hijo solo puede restringir lo que heredó, nunca ampliarlo. */
export function restrict(
  parent: ResourcePolicy,
  limits: PolicyLimits = {},
): ResourcePolicy {
  try {
    const requestedAnim = limits.animation;
    const animation =
      requestedAnim && ANIM_RANK[requestedAnim] < ANIM_RANK[parent.animation]
        ? requestedAnim
        : parent.animation;

    const maxDprLimit =
      typeof limits.maxImageDpr === 'number' && limits.maxImageDpr > 0
        ? limits.maxImageDpr
        : Infinity;

    return {
      ...parent,
      animation,
      effects: limits.effects === false ? false : parent.effects,
      image: {
        ...parent.image,
        maxDpr: Math.min(parent.image.maxDpr, maxDprLimit),
      },
      video: {
        ...parent.video,
        autoplay:
          limits.videoAutoplay === false ? false : parent.video.autoplay,
      },
      data: {
        ...parent.data,
        prefetch: limits.prefetch === false ? false : parent.data.prefetch,
      },
    };
  } catch {
    return parent;
  }
}
