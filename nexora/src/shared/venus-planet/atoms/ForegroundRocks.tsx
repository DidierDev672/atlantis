import { FOREGROUND_ROCKS } from '../lib/scenery';

/**
 * Átomo: rocas oscuras en primer plano; tapan los bordes de la lava para dar profundidad
 */

export function ForegroundRocks() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="absolute inset-0 size-full"
    >
      {FOREGROUND_ROCKS.map((d) => (
        <path
          key={d}
          d={d}
          fill="#120503"
          stroke="#7a3314"
          strokeOpacity="0.45"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
