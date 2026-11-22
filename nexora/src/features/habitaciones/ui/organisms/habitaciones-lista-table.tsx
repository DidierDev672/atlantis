import { memo } from 'react';
import {
  HabitacionesPisosList,
  type HabitacionesPisosListProps,
} from './habitaciones-pisos-list';

export type HabitacionesListaTableProps = HabitacionesPisosListProps;

export const HabitacionesListaTable = memo(function HabitacionesListaTable(
  props: HabitacionesListaTableProps
) {
  return <HabitacionesPisosList {...props} />;
});
