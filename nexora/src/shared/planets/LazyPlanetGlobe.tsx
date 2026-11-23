import { lazy, memo } from 'react';
import type { PlanetName } from './planets-catalog';

const LazyEarthGlobe = lazy(() =>
  import('../earth-planet').then((m) => ({ default: m.EarthGlobe }))
);
const LazyMarsGlobe = lazy(() =>
  import('../mars-planet').then((m) => ({ default: m.MarsGlobe }))
);
const LazyJupiterGlobe = lazy(() =>
  import('../jupiter-planet').then((m) => ({ default: m.JupiterGlobe }))
);
const LazySaturnGlobe = lazy(() =>
  import('../saturn-planet').then((m) => ({ default: m.SaturnGlobe }))
);
const LazyUranusGlobe = lazy(() =>
  import('../uranus-planet').then((m) => ({ default: m.UranusGlobe }))
);
const LazyNeptuneGlobe = lazy(() =>
  import('../neptune-planet').then((m) => ({ default: m.NeptuneGlobe }))
);
const LazyPlutoGlobe = lazy(() =>
  import('../pluto-planet').then((m) => ({ default: m.PlutoGlobe }))
);
const LazyVenusGlobe = lazy(() =>
  import('../venus-planet').then((m) => ({ default: m.VenusGlobe }))
);

interface LazyPlanetGlobeProps {
  name: PlanetName;
  sizePx: number;
  animated?: boolean;
}

export const LazyPlanetGlobe = memo(function LazyPlanetGlobe({
  name,
  sizePx,
  animated = true,
}: LazyPlanetGlobeProps) {
  switch (name) {
    case 'Tierra':
      return <LazyEarthGlobe customPx={sizePx} animated={animated} />;
    case 'Marte':
      return <LazyMarsGlobe customPx={sizePx} animated={animated} />;
    case 'Júpiter':
      return <LazyJupiterGlobe customPx={sizePx} animated={animated} />;
    case 'Saturno':
      return <LazySaturnGlobe customPx={sizePx} animated={animated} />;
    case 'Urano':
      return <LazyUranusGlobe customPx={sizePx} animated={animated} />;
    case 'Neptuno':
      return <LazyNeptuneGlobe customPx={sizePx} animated={animated} />;
    case 'Plutón':
      return <LazyPlutoGlobe customPx={sizePx} animated={animated} />;
    case 'Venus':
      return (
        <div
          className="flex items-center justify-center overflow-visible"
          style={{ width: sizePx, height: sizePx }}
        >
          <div
            style={{
              transform: `scale(${sizePx / 32})`,
              transformOrigin: 'center',
            }}
          >
            <LazyVenusGlobe size="tiny" animated={animated} />
          </div>
        </div>
      );
  }
});
