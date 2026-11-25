import {
  FALLBACK_CONSERVATIVE_POLICY,
  buildPolicy,
} from '../../domain/resource-policy/policy';
import type { ResourcePolicy } from '../../domain/resource-policy/types';
import {
  detectCapabilities,
  nav,
} from '../../infrastructure/resource-policy/detect';

export interface ResourceMonitor {
  getPolicy: () => ResourcePolicy;
  subscribe: (listener: (policy: ResourcePolicy) => void) => () => void;
  destroy: () => void;
}

/**
 * Monitor reactivo de cambios en red, visibilidad de pestaña y preferencia
 * `prefers-reduced-motion` durante la sesión.
 */
export function createResourceMonitor(): ResourceMonitor {
  let policy: ResourcePolicy = buildPolicy(detectCapabilities());
  const listeners = new Set<(p: ResourcePolicy) => void>();
  const mq =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  const refresh = () => {
    try {
      const next = buildPolicy(detectCapabilities());
      if (JSON.stringify(next) === JSON.stringify(policy)) return;
      policy = next;
      listeners.forEach((listener) => {
        try {
          listener(policy);
        } catch (err) {
          console.error('Error en suscriptor de ResourceMonitor:', err);
        }
      });
    } catch (err) {
      console.error('Error refrescando ResourcePolicy:', err);
      policy = FALLBACK_CONSERVATIVE_POLICY;
    }
  };

  try {
    nav.connection?.addEventListener('change', refresh);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', refresh);
      window.addEventListener('offline', refresh);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', refresh);
    }
    mq?.addEventListener?.('change', refresh);
  } catch {
    /* Entorno restringido sin listeners de navegador */
  }

  return {
    getPolicy: () => policy,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy() {
      try {
        nav.connection?.removeEventListener('change', refresh);
        if (typeof window !== 'undefined') {
          window.removeEventListener('online', refresh);
          window.removeEventListener('offline', refresh);
        }
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', refresh);
        }
        mq?.removeEventListener?.('change', refresh);
      } catch {
        /* Limpieza segura */
      } finally {
        listeners.clear();
      }
    },
  };
}
