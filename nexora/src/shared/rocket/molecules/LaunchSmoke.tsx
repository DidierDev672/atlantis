import { SmokePuff } from '../atoms/SmokePuff';

type LaunchSmokeProps = {
  active: boolean;
};

const PUFFS = [
  { left: 41, side: -1 },
  { left: 41, side: 1 },
  { left: 41, side: -1 },
  { left: 41, side: 1 },
  { left: 41, side: -1 },
  { left: 41, side: 1 },
  { left: 41, side: -1 },
  { left: 41, side: 1 },
] as const;

/** Molécula: nube de humo en la base mientras los motores están encendidos. */
export function LaunchSmoke({ active }: LaunchSmokeProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-[6%] h-[22%]"
    >
      {PUFFS.map((puff, i) => (
        <SmokePuff
          key={i}
          index={i}
          active={active}
          side={puff.side}
          left={puff.left}
        />
      ))}
    </div>
  );
}
