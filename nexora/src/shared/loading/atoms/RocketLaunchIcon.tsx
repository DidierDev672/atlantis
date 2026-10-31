import { faRocket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, useReducedMotion, type TargetAndTransition, type Transition } from 'motion/react';
import type { PostStage } from '../type';
import { LaunchParticles } from './LaunchParticles';

export interface RocketLaunchIconProps {
  stage?: PostStage;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Átomo: Cohete animado con FontAwesome (faRocket) y motor de propulsión.
 * Modela física y visualmente las 3 fases de un POST (preparar, despegar/transmitir, confirmar).
 * Soporta tamaños:
 * - `sm`: Para botones, píldoras y badges en línea (hereda text-current).
 * - `md`: Tamaño estándar para modales y tarjetas de formulario.
 * - `lg`: Tamaño destacado para pantallas completas.
 */
export function RocketLaunchIcon({
  stage = 'transmitting',
  size = 'md',
  className = '',
}: RocketLaunchIconProps) {
  const shouldReduceMotion = useReducedMotion();
  const isSmall = size === 'sm';

  const isPreparing = stage === 'preparing';
  const isTransmitting = stage === 'transmitting';
  const isConfirming = stage === 'confirming';

  // Variantes de vibración y despegue según la fase y tamaño
  const rocketMotionProps: {
    animate?: TargetAndTransition;
    transition?: Transition;
  } = shouldReduceMotion
    ? {
        animate: { scale: 1, y: 0 },
      }
    : isPreparing
    ? {
        // Vibración sutil en la rampa de lanzamiento previa a la ignición
        animate: {
          x: isSmall ? [-0.3, 0.4, -0.4, 0.3, 0] : [-0.6, 0.8, -0.8, 0.6, 0],
          y: isSmall ? [0, -0.3, 0.2, 0] : [0, -0.6, 0.4, 0],
          rotate: [-12, -11.5, -12.5, -12],
        },
        transition: {
          duration: 0.18,
          repeat: Infinity,
          ease: 'linear',
        },
      }
    : isTransmitting
    ? {
        // Impulso vertical y aceleración con bamboleo aerodinámico suave
        animate: {
          x: isSmall ? [-0.5, 0.6, -0.4, 0.5, 0] : [-1, 1.2, -0.8, 1, 0],
          y: isSmall ? [-1, -4, -2, -5, -3] : [-2, -14, -8, -16, -10],
          rotate: [-12, -10, -14, -11, -12],
          scale: isSmall ? [1, 1.05, 1.01] : [1, 1.04, 1.01, 1.05, 1.02],
        },
        transition: {
          duration: isSmall ? 0.55 : 0.65,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }
    : {
        // Fase de confirmación: vuelo orbital suave y estabilizado
        animate: {
          x: 0,
          y: isSmall ? [-1, -3, -1] : [-6, -10, -6],
          rotate: [-12, -10, -12],
          scale: 1,
        },
        transition: {
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const iconClasses = isSmall
    ? 'text-base sm:text-lg text-current drop-shadow-xs'
    : size === 'lg'
    ? 'text-6xl text-primary dark:text-ink drop-shadow-lg'
    : 'text-4xl sm:text-5xl text-primary dark:text-ink drop-shadow-md';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        isSmall ? 'w-auto h-auto' : ''
      } ${className}`}
    >
      {/* Halo de resplandor / atmósfera en la tobera */}
      <motion.div
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full ${
          isSmall ? 'size-6 blur-xs' : 'size-28 blur-xl'
        }`}
        animate={{
          backgroundColor: isTransmitting
            ? 'rgba(249, 115, 22, 0.32)'
            : isConfirming
            ? 'rgba(74, 222, 128, 0.25)'
            : 'rgba(245, 158, 11, 0.18)',
          scale: isTransmitting ? [1, 1.2, 1.05] : [0.9, 1.05, 0.9],
        }}
        transition={{
          duration: isTransmitting ? 0.4 : 1.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Contenedor del Cohete */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center"
        {...rocketMotionProps}
      >
        <div className={`relative ${iconClasses}`}>
          <span className="inline-block transform -rotate-45 leading-none">
            <FontAwesomeIcon icon={faRocket} />
          </span>

          {/* Destello de cabina / ventana */}
          <motion.span
            aria-hidden="true"
            className={`absolute rounded-full bg-cream/90 shadow-[0_0_4px_#fff] ${
              isSmall ? 'top-1 right-1 size-1' : 'top-3.5 right-3.5 size-1.5'
            }`}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: isTransmitting ? [1, 1.3, 1] : 1,
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </div>

        {/* Llama de propulsión (Thruster Flame) */}
        {!shouldReduceMotion && (
          <div
            aria-hidden="true"
            className={`pointer-events-none relative flex flex-col items-center ${
              isSmall ? '-mt-0.5' : '-mt-1'
            }`}
          >
            {/* Pluma exterior de fuego */}
            <motion.div
              className={`rounded-b-full origin-top filter drop-shadow-[0_0_6px_rgba(249,115,22,0.85)] ${
                isSmall ? 'w-2.5' : 'w-4'
              }`}
              style={{
                background:
                  'linear-gradient(to bottom, #fef08a 0%, #f97316 45%, #ef4444 85%, transparent 100%)',
              }}
              animate={
                isTransmitting
                  ? {
                      height: isSmall ? [10, 16, 9, 17, 12] : [22, 34, 20, 36, 26],
                      scaleX: [0.95, 1.15, 0.9, 1.1, 1],
                      opacity: [0.9, 1, 0.85, 1],
                    }
                  : isPreparing
                  ? {
                      height: isSmall ? [6, 9, 7] : [10, 16, 12],
                      scaleX: [0.8, 1, 0.85],
                      opacity: [0.6, 0.9, 0.7],
                    }
                  : {
                      height: isSmall ? [4, 6, 4] : [8, 12, 8],
                      scaleX: [0.7, 0.85, 0.7],
                      opacity: [0.35, 0.5, 0.35],
                    }
              }
              transition={{
                duration: isTransmitting ? 0.16 : 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Núcleo de llama incandescente blanco/amarillo */}
            <motion.div
              className={`absolute top-0 rounded-b-full bg-white/95 shadow-[0_0_4px_#fff] ${
                isSmall ? 'w-1 h-1.5' : 'w-2 h-3'
              }`}
              animate={
                isTransmitting
                  ? {
                      height: isSmall ? [4, 7, 5, 8, 5] : [8, 14, 9, 15, 10],
                      opacity: [0.85, 1, 0.9],
                    }
                  : {
                      height: isSmall ? [2, 3, 2] : [4, 6, 4],
                      opacity: [0.5, 0.7, 0.5],
                    }
              }
              transition={{
                duration: isTransmitting ? 0.12 : 0.7,
                repeat: Infinity,
              }}
            />
          </div>
        )}

        {/* Partículas de escape descendentes (solo en tamaños md y lg) */}
        {!isSmall && <LaunchParticles stage={stage} />}
      </motion.div>
    </div>
  );
}
