import {
  memo,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { restrict } from '../../domain/resource-policy/policy';
import type { PolicyLimits } from '../../domain/resource-policy/types';
import { createResourceMonitor } from './monitor';
import { ResourcePolicyContext } from './resource-policy-context';
import { useResourcePolicy } from './use-resource-policy';

export interface ResourcePolicyProviderProps {
  children: ReactNode;
  limits?: PolicyLimits;
}

/**
 * Proveedor raíz de política de recursos para el árbol de componentes.
 * Escucha cambios dinámicos (red, visibilidad, reduced-motion) y los propaga
 * permitiendo a los hijos únicamente restringir límites heredados.
 */
export const ResourcePolicyProvider = memo(function ResourcePolicyProvider({
  children,
  limits,
}: ResourcePolicyProviderProps) {
  const [monitor] = useState(() => createResourceMonitor());

  useEffect(() => {
    return () => {
      monitor.destroy();
    };
  }, [monitor]);

  const basePolicy = useSyncExternalStore(
    monitor.subscribe,
    monitor.getPolicy,
    monitor.getPolicy
  );

  const effectivePolicy = useMemo(
    () => (limits ? restrict(basePolicy, limits) : basePolicy),
    [basePolicy, limits]
  );

  return (
    <ResourcePolicyContext.Provider value={effectivePolicy}>
      {children}
    </ResourcePolicyContext.Provider>
  );
});

export interface RestrictResourcePolicyProps {
  limits: PolicyLimits;
  children: ReactNode;
}

/**
 * Contenedor declarativo para imponer mayores restricciones de consumo a un subárbol.
 */
export const RestrictResourcePolicy = memo(function RestrictResourcePolicy({
  limits,
  children,
}: RestrictResourcePolicyProps) {
  const restricted = useResourcePolicy(limits);
  return (
    <ResourcePolicyContext.Provider value={restricted}>
      {children}
    </ResourcePolicyContext.Provider>
  );
});
