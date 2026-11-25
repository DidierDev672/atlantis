import { Suspense, lazy, memo } from 'react';
import type { RoomRow } from '../../domain/habitacion-lista';

const LazyEdificioDetalleModal = lazy(() =>
  import('../../../edificios/ui/organisms/edificio-detalle-modal').then((m) => ({
    default: m.EdificioDetalleModal,
  }))
);

const LazyTarifasModal = lazy(() =>
  import('./tarifas-modal').then((m) => ({ default: m.TarifasModal }))
);

const LazyHabitacionDetalleModal = lazy(() =>
  import('./habitacion-detalle-modal').then((m) => ({
    default: m.HabitacionDetalleModal,
  }))
);

const LazyAsignarHuespedDrawer = lazy(
  () => import('./asignar-huesped-drawer')
);

export interface SelectedBuildingState {
  id: string;
  summary?: RoomRow['building'];
  room: { number: string; floor: number | string };
}

export interface SelectedTarifasState {
  id: string;
  number: string;
  floor: number | string;
  hasTariff?: boolean;
  rateId?: string | null;
}

export interface HabitacionesPisosModalsProps {
  selectedBuilding: SelectedBuildingState | null;
  selectedRoomForTarifas: SelectedTarifasState | null;
  selectedRoomForDetail: RoomRow | null;
  assignGuestDrawerRoom: RoomRow | null;
  hasTariff: (roomId: string) => boolean;
  getRateId: (roomId: string) => string | null;
  getTariffPrice: (roomId: string) => number | null;
  getTariffName: (roomId: string) => string | null;
  onCloseBuilding: () => void;
  onCloseTarifas: () => void;
  onCloseDetail: () => void;
  onCloseAssignGuestDrawer: () => void;
  onAssignGuestSuccess: () => Promise<void> | void;
  onTariffApplied: (
    roomId: string,
    rateId?: string,
    price?: number | null,
    name?: string | null
  ) => void;
  onSelectTarifas: (next: SelectedTarifasState) => void;
  onSelectBuilding: (next: SelectedBuildingState) => void;
}

export const HabitacionesPisosModals = memo(function HabitacionesPisosModals({
  selectedBuilding,
  selectedRoomForTarifas,
  selectedRoomForDetail,
  assignGuestDrawerRoom,
  hasTariff,
  getRateId,
  getTariffPrice,
  getTariffName,
  onCloseBuilding,
  onCloseTarifas,
  onCloseDetail,
  onCloseAssignGuestDrawer,
  onAssignGuestSuccess,
  onTariffApplied,
  onSelectTarifas,
  onSelectBuilding,
}: HabitacionesPisosModalsProps) {
  return (
    <Suspense fallback={null}>
      <LazyAsignarHuespedDrawer
        room={assignGuestDrawerRoom}
        onClose={onCloseAssignGuestDrawer}
        onSuccess={onAssignGuestSuccess}
      />

      {selectedBuilding && (
        <LazyEdificioDetalleModal
          isOpen
          buildingId={selectedBuilding.id}
          buildingSummary={selectedBuilding.summary}
          linkedRoom={selectedBuilding.room}
          onClose={onCloseBuilding}
        />
      )}

      {selectedRoomForTarifas && (
        <LazyTarifasModal
          isOpen
          linkedRoom={selectedRoomForTarifas}
          hasTariff={Boolean(
            hasTariff(selectedRoomForTarifas.id) ||
              selectedRoomForTarifas.hasTariff
          )}
          appliedRateId={
            getRateId(selectedRoomForTarifas.id) ||
            selectedRoomForTarifas.rateId
          }
          onTariffApplied={onTariffApplied}
          onClose={onCloseTarifas}
        />
      )}

      {selectedRoomForDetail && (
        <LazyHabitacionDetalleModal
          isOpen
          room={selectedRoomForDetail}
          hasTariff={hasTariff(selectedRoomForDetail.id)}
          tariffPrice={getTariffPrice(selectedRoomForDetail.id)}
          tariffName={getTariffName(selectedRoomForDetail.id)}
          onOpenTarifas={(r) => {
            onCloseDetail();
            if (r.id) {
              onSelectTarifas({
                id: r.id,
                number: r.number,
                floor: r.floor,
                hasTariff: r.hasTariff,
                rateId: r.rateId,
              });
            }
          }}
          onOpenBuilding={(bldgId, summary) => {
            const current = selectedRoomForDetail;
            onCloseDetail();
            onSelectBuilding({
              id: bldgId,
              summary,
              room: current
                ? { number: current.number, floor: current.floor }
                : { number: '', floor: '' },
            });
          }}
          onClose={onCloseDetail}
        />
      )}
    </Suspense>
  );
});
