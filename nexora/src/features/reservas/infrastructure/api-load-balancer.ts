/**
 * Utilidades de balanceo de carga, control de concurrencia y tolerancia a fallos
 * para el envío coordinado y casi simultáneo de endpoints críticos.
 */

export interface LoadBalancerOptions {
  /** Milisegundos de micro-jitter para dispersar picos de peticiones simultáneas */
  jitterMs?: number;
  /** Número máximo de reintentos en caso de congestión de red (429, 503, 504) */
  maxRetries?: number;
  /** Multiplicador de retroceso exponencial (exponential backoff) */
  backoffMultiplier?: number;
}

/**
 * Función que introduce una pequeña pausa no bloqueante.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ejecuta una petición HTTP envuelta en un balanceador de carga preventivo:
 * - Aplica micro-jitter adaptativo para evitar saturar el pool de conexiones del backend.
 * - Detecta códigos transitorios de saturación (429 Too Many Requests, 503 Service Unavailable, 504 Gateway Timeout).
 * - Aplica retroceso exponencial con variación aleatoria para nivelar la carga del servidor.
 */
export async function executeBalancedRequest<T>(
  requestFn: () => Promise<T>,
  options: LoadBalancerOptions = {}
): Promise<T> {
  const {
    jitterMs = Math.floor(Math.random() * 12) + 4,
    maxRetries = 2,
    backoffMultiplier = 1.5,
  } = options;

  if (jitterMs > 0) {
    await sleep(jitterMs);
  }

  let attempt = 0;
  let delay = 120;

  while (attempt <= maxRetries) {
    try {
      const result = await requestFn();

      // Si el resultado es una respuesta Axios con status code de saturación transitoria
      const status =
        result && typeof result === 'object' && 'status' in result
          ? Number((result as { status?: unknown }).status)
          : null;

      if (status === 429 || status === 503 || status === 504) {
        if (attempt < maxRetries) {
          attempt++;
          await sleep(delay);
          delay = Math.round(delay * backoffMultiplier);
          continue;
        }
      }

      return result;
    } catch (error) {
      if (attempt < maxRetries) {
        attempt++;
        await sleep(delay);
        delay = Math.round(delay * backoffMultiplier);
        continue;
      }
      throw error;
    }
  }

  // Fallback de seguridad
  return requestFn();
}

/**
 * Coordina la ejecución balanceada de dos peticiones dependientes para que
 * se transmitan de forma casi simultánea con latencia mínima, garantizando
 * que la segunda petición inicie inmediatamente con el resultado de la primera.
 */
export async function dispatchPipelinedEndpoints<T1, T2>(
  firstTask: () => Promise<T1>,
  nextTaskBuilder: (result1: T1) => Promise<T2>,
  options?: LoadBalancerOptions
): Promise<{ first: T1; second: T2 }> {
  // 1. Despachar la primera petición balanceada (/stay)
  const first = await executeBalancedRequest(firstTask, options);

  // 2. Transmisión inmediata con micro-balanceo de la segunda petición (/guest-attendant)
  const second = await executeBalancedRequest(
    () => nextTaskBuilder(first),
    options
  );

  return { first, second };
}
