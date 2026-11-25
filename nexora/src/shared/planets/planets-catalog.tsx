import type { ReactNode } from 'react';
import { LazyPlanetGlobe } from './LazyPlanetGlobe';

export type PlanetName =
  | 'Tierra'
  | 'Marte'
  | 'Júpiter'
  | 'Saturno'
  | 'Urano'
  | 'Neptuno'
  | 'Plutón'
  | 'Venus';

export interface PlanetOption {
  name: PlanetName;
  gradient: string;
  hasRing?: boolean;
  ringColor?: string;
  render: (sizePx: number, animated?: boolean) => ReactNode;
}

export const SHARED_PLANETS: PlanetOption[] = [
  {
    name: 'Tierra',
    gradient:
      'radial-gradient(circle at 35% 30%, #7fb3d5 0%, #3d6b99 55%, #1d3557 100%)',
    render: (px, animated = true) => (
      <LazyPlanetGlobe name="Tierra" sizePx={px} animated={animated} />
    ),
  },
  {
    name: 'Marte',
    gradient:
      'radial-gradient(circle at 35% 30%, #e07a5f 0%, #c1440e 58%, #6d2107 100%)',
    render: (px, animated = true) => (
      <LazyPlanetGlobe name="Marte" sizePx={px} animated={animated} />
    ),
  },
  {
    name: 'Júpiter',
    gradient:
      'radial-gradient(circle at 35% 30%, #f2d3ab 0%, #c88b5a 55%, #7c4d2b 100%)',
    render: (px, animated = true) => (
      <LazyPlanetGlobe name="Júpiter" sizePx={px} animated={animated} />
    ),
  },
  {
    name: 'Saturno',
    gradient:
      'radial-gradient(circle at 35% 30%, #f4e3b2 0%, #c9a76a 58%, #735a36 100%)',
    hasRing: true,
    ringColor: 'rgba(212, 185, 130, 0.7)',
    render: (px, animated = true) => (
      <LazyPlanetGlobe name="Saturno" sizePx={px} animated={animated} />
    ),
  },
  {
    name: 'Urano',
    gradient:
      'radial-gradient(circle at 35% 30%, #b8ecee 0%, #6ac2c9 58%, #2e7780 100%)',
    hasRing: true,
    ringColor: 'rgba(155, 224, 230, 0.65)',
    render: (px, animated = true) => (
      <LazyPlanetGlobe name="Urano" sizePx={px} animated={animated} />
    ),
  },
  {
    name: 'Neptuno',
    gradient:
      'radial-gradient(circle at 35% 30%, #6f9ceb 0%, #2c52b3 58%, #152866 100%)',
    render: (px, animated = true) => (
      <LazyPlanetGlobe name="Neptuno" sizePx={px} animated={animated} />
    ),
  },
  {
    name: 'Plutón',
    gradient:
      'radial-gradient(circle at 35% 30%, #dfd5cb 0%, #9b8879 58%, #4d4138 100%)',
    render: (px, animated = true) => (
      <LazyPlanetGlobe name="Plutón" sizePx={px} animated={animated} />
    ),
  },
  {
    name: 'Venus',
    gradient:
      'radial-gradient(circle at 35% 30%, #f7d59c 0%, #d48942 58%, #7a3e14 100%)',
    render: (px, animated = true) => (
      <LazyPlanetGlobe name="Venus" sizePx={px} animated={animated} />
    ),
  },
];
