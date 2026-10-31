import type { TargetAndTransition } from 'framer-motion';
import type { RocketPhase } from '../types';

/**
 * Distancia que recorre el cohete al despegar, en % de su propia altura.
 * Al ser relativa al elemento, funciona igual en cualquier tamaño de escenario.
 */

const EXIT_Y = '-220%';

/** Qué hace el cohete (cuerpo + llama) en cada fase. */
export function shipAnimation(
  phase: RocketPhase,
  reduced: boolean,
  ascentMs: number
): TargetAndTransition {
  switch (phase) {
    case 'idle':
    case 'countdown':
      // Flota suavemente sobre la plataforma.
      return reduced
        ? { x: 0, y: 0, opacity: 1 }
        : {
            x: 0,
            y: [0, -5, 0],
            opacity: 1,
            transition: {
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            },
          };

    case 'ignition':
      // Los motores rugen: vibración corta y rápida.
      return reduced
        ? { x: 0, y: 0, opacity: 1 }
        : {
            y: 0,
            x: [0, -1.5, 1.5, -1, 1, 0],
            opacity: 1,
            transition: {
              x: { duration: 0.22, repeat: Infinity },
              y: { duration: 0.3 },
            },
          };
    case 'ascent':
      // Acelera de a poco (ease-in) hasta salir del cuadro.
      return reduced
        ? { opacity: 0, transition: { duration: 0.6 } }
        : {
            x: 0,
            y: EXIT_Y,
            opacity: 1,
            transition: {
              y: { duration: ascentMs / 1000, ease: [0.6, 0, 0.9, 0.5] },
              x: { duration: 0.2 },
            },
          };

    case 'done':
      // Se queda fuera del cuadro (sin saltos) hasta el reinicio.
      return reduced
        ? { opacity: 0, transition: { duration: 0 } }
        : { y: EXIT_Y, x: 0, opacity: 1, transition: { duration: 0 } };
  }
}
