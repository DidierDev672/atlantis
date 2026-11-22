import { memo } from 'react';

export interface FloorMiniProgressBarProps {
  occupiedCount: number;
  availableCount: number;
  cleaningCount: number;
  totalCount: number;
}

/**
 * Átomo: Micro-barra apilada de ocupación y estado por piso.
 */
export const FloorMiniProgressBar = memo(function FloorMiniProgressBar({
  occupiedCount,
  availableCount,
  cleaningCount,
  totalCount,
}: FloorMiniProgressBarProps) {
  const safeTotal = totalCount > 0 ? totalCount : 1;
  const occPct = Math.min(100, Math.round((occupiedCount / safeTotal) * 100));
  const availPct = Math.min(100, Math.round((availableCount / safeTotal) * 100));
  const cleanPct = Math.min(100, Math.round((cleaningCount / safeTotal) * 100));

  return (
    <div
      className="bg-line/50 flex h-1.5 w-full overflow-hidden rounded-full"
      aria-hidden="true"
    >
      {occPct > 0 && (
        <div
          style={{ width: `${occPct}%` }}
          className="h-full bg-indigo-500 transition-all duration-300"
          title={`Ocupadas: ${occupiedCount}`}
        />
      )}
      {availPct > 0 && (
        <div
          style={{ width: `${availPct}%` }}
          className="h-full bg-emerald-500 transition-all duration-300"
          title={`Disponibles: ${availableCount}`}
        />
      )}
      {cleanPct > 0 && (
        <div
          style={{ width: `${cleanPct}%` }}
          className="h-full bg-amber-400 transition-all duration-300"
          title={`Por limpiar: ${cleaningCount}`}
        />
      )}
    </div>
  );
});

export default FloorMiniProgressBar;
