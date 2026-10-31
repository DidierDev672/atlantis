import { SpeedLine } from '../atoms/SpeedLine';

type SpeedLinesProps = {
  active: boolean;
};

const LINES = [
  { left: 16, height: 28, delay: 0 },
  { left: 28, height: 36, delay: 0.15 },
  { left: 45, height: 22, delay: 0.3 },
  { left: 62, height: 32, delay: 0.08 },
  { left: 74, height: 26, delay: 0.22 },
  { left: 86, height: 34, delay: 0.12 },
] as const;

/** Molécula: conjunto de estelas verticales que simulan velocidad durante el ascenso. */
export function SpeedLines({ active }: SpeedLinesProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {LINES.map((line, i) => (
        <SpeedLine key={i} {...line} active={active} />
      ))}
    </div>
  );
}

