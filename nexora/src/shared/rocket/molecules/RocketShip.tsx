import { RocketBody } from '../atoms/RocketBody';
import { RocketFlame } from '../atoms/RocketFlame';
import type { FlameIntensity } from '../types';

type RocketShipProps = {
  flame: FlameIntensity;
  reduced?: boolean;
};

/** Molécula: cuerpo + llama, alineados para moverse como una sola pieza. */
export function RocketShip({ flame, reduced }: RocketShipProps) {
  return (
    <div className="flex w-full flex-col items-center">
      <RocketBody className="relative z-10" />
      <div className="-mt-px w-[40%]">
        <RocketFlame intensity={flame} reduced={reduced} />
      </div>
    </div>
  );
}
