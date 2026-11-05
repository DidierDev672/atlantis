import { HeatHazeBand } from '../atoms/HeatHazeBand';
import { HAZE_BANDS } from '../lib/scenery';

type HeatHazeProps = {
  bands: number;
  px: number;
  animated: boolean;
};

/** Molécula: bruma provocada por el calor intenso (varias franjas desfasadas). */
export function HeatHaze({ bands, px, animated }: HeatHazeProps) {
  const blurPx = Math.max(1, px * 0.03);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {HAZE_BANDS.slice(0, bands).map((band) => (
        <HeatHazeBand
          key={band.top}
          {...band}
          blurPx={blurPx}
          animated={animated}
        />
      ))}
    </div>
  );
}
