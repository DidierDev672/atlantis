import { ForegroundRocks } from '../atoms/ForegroundRocks';
import { LavaRivers } from '../atoms/LavaRivers';
import { RockyTerrain } from '../atoms/RockyTerrain';

type VenusLandscapeProps = {
  animated: boolean;
};

/**
 * Molécula: paisaje volcánico. Se apila de atrás hacia adelante:
 * suelo rocoso → ríos de lava → rocas en primer plano.
 */
export function VenusLandscape({ animated }: VenusLandscapeProps) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <RockyTerrain />
      <LavaRivers animated={animated} />
      <ForegroundRocks />
    </div>
  );
}
