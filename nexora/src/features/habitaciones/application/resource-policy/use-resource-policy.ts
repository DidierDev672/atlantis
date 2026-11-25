import { useContext, useMemo } from 'react';
import { restrict } from '../../domain/resource-policy/policy';
import type {
  PolicyLimits,
  ResourcePolicy,
} from '../../domain/resource-policy/types';
import { ResourcePolicyContext } from './resource-policy-context';

/**
 * Hook puro para consumidores y átomos: lee la política heredada del padre y,
 * opcionalmente, aplica restricciones adicionales (nunca puede ampliarla).
 */
export function useResourcePolicy(limits?: PolicyLimits): ResourcePolicy {
  const parent = useContext(ResourcePolicyContext);

  return useMemo(() => {
    try {
      if (!limits) return parent;
      return restrict(parent, limits);
    } catch {
      return parent;
    }
  }, [parent, limits]);
}
