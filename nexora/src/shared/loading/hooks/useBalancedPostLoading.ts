import { useCallback, useEffect, useRef, useState } from 'react';
import type { PostStage } from '../type';

export interface UseBalancedPostLoadingOptions {
  /** Si se pasa, el hook responde a este booleano pasivo (ej: submitting) */
  active?: boolean;
  /** Duración de la fase de construcción/empaquetado del payload (ms). Default: 650ms */
  preparingDuration?: number;
  /** Duración mínima de la fase de despegue y transmisión (ms). Default: 600ms */
  transmittingMinDuration?: number;
  /** Duración de confirmación tras recibir respuesta (ms). Default: 450ms */
  confirmingDuration?: number;
  /** Deprecado por backward compatibility, se calcula a partir de las etapas */
  totalMinDuration?: number;
}

export interface UseBalancedPostLoadingReturn {
  /** Indica si el componente loader debe estar montado/visible */
  isBalancedVisible: boolean;
  /** Fase actual de la operación */
  stage: PostStage;
  /** Porcentaje estimado de avance (0 a 100) */
  progress: number;
  /** Ejecuta una promesa asegurando el ciclo completo de carga balanceada */
  execute: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export function useBalancedPostLoading({
  active = false,
  preparingDuration = 650,
  transmittingMinDuration = 600,
  confirmingDuration = 450,
}: UseBalancedPostLoadingOptions = {}): UseBalancedPostLoadingReturn {
  const [internalActive, setInternalActive] = useState(false);
  const effectiveActive = active || internalActive;

  const [isBalancedVisible, setIsBalancedVisible] = useState(effectiveActive);
  const [stage, setStage] = useState<PostStage>('preparing');

  const startTimeRef = useRef<number | null>(null);
  const transmittingStartRef = useRef<number | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    if (effectiveActive) {
      clearAllTimeouts();
      startTimeRef.current = Date.now();
      transmittingStartRef.current = null;
      setIsBalancedVisible(true);
      setStage('preparing');

      // Transición a despegue / transmisión una vez finalizado el tiempo de construcción del payload
      addTimeout(() => {
        transmittingStartRef.current = Date.now();
        setStage('transmitting');
      }, preparingDuration);
    } else {
      // Cuando la petición HTTP finaliza (active pasa a false)
      if (startTimeRef.current !== null) {
        const now = Date.now();
        const elapsedSinceStart = now - startTimeRef.current;

        if (elapsedSinceStart < preparingDuration) {
          // Si el endpoint respondió antes de terminar de preparar el payload:
          // garantizamos que el usuario visualice la fase de preparación y luego despegue
          const remainingPrepare = preparingDuration - elapsedSinceStart;

          addTimeout(() => {
            transmittingStartRef.current = Date.now();
            setStage('transmitting');

            addTimeout(() => {
              setStage('confirming');

              addTimeout(() => {
                setIsBalancedVisible(false);
                startTimeRef.current = null;
                transmittingStartRef.current = null;
              }, confirmingDuration);
            }, transmittingMinDuration);
          }, remainingPrepare);
        } else {
          // Ya estamos en transmisión o más allá
          const elapsedTransmitting = transmittingStartRef.current
            ? now - transmittingStartRef.current
            : transmittingMinDuration;
          const remainingTransmitting = Math.max(
            0,
            transmittingMinDuration - elapsedTransmitting
          );

          addTimeout(() => {
            setStage('confirming');

            addTimeout(() => {
              setIsBalancedVisible(false);
              startTimeRef.current = null;
              transmittingStartRef.current = null;
            }, confirmingDuration);
          }, remainingTransmitting);
        }
      } else {
        setIsBalancedVisible(false);
      }
    }

    return () => {
      clearAllTimeouts();
    };
  }, [
    effectiveActive,
    preparingDuration,
    transmittingMinDuration,
    confirmingDuration,
    clearAllTimeouts,
    addTimeout,
  ]);

  // Ejecutor imperativo para cualquier endpoint POST
  const execute = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
      setInternalActive(true);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        setInternalActive(false);
      }
    },
    []
  );

  const progress =
    stage === 'preparing' ? 30 : stage === 'transmitting' ? 75 : 100;

  return {
    isBalancedVisible,
    stage,
    progress,
    execute,
  };
}
