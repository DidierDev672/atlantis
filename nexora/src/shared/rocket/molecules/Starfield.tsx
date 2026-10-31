import { Star } from '../atoms/Star';

type StarfieldProps = {
  animated: boolean;
};

const STARS = [
  { top: 8, left: 12, size: 0.5, delay: 0 },
  { top: 18, left: 80, size: 0.4, delay: 0.8 },
  { top: 34, left: 24, size: 0.35, delay: 1.5 },
  { top: 46, left: 88, size: 0.45, delay: 0.4 },
  { top: 58, left: 8, size: 0.4, delay: 1.1 },
  { top: 12, left: 52, size: 0.3, delay: 1.9 },
] as const;

/** Molécula: fondo de estrellas que titilan. */
export function Starfield({ animated }: StarfieldProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {STARS.map((star) => (
        <Star key={`${star.top}-${star.left}`} {...star} animated={animated} />
      ))}
    </div>
  );
}
