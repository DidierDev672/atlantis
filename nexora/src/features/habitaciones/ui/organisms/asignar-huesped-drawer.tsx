import { Suspense, lazy, memo, useCallback } from 'react';
import { matchesHabitacionStatus, type RoomRow } from '../../domain/habitacion-lista';
import { Loader } from '../atoms/loader';

const LazyAsignarHuespedModalFormulario = lazy(() =>
  import('../molecules/asignar-huesped-modal-formulario').then((m) => ({
    default: m.AsignarHuespedModalFormulario,
  }))
);

export interface AsignarHuespedDrawerProps {
  room: RoomRow | null;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

/**
 * Organismo: Drawer deslizable para asignar huésped únicamente a habitaciones disponibles.
 */
export const AsignarHuespedDrawer = memo(function AsignarHuespedDrawer({
  room,
  onClose,
  onSuccess,
}: AsignarHuespedDrawerProps) {
  const isAvailableRoom = Boolean(
    room && matchesHabitacionStatus(room.status, 'available')
  );

  const handleSuccess = useCallback(async () => {
    try {
      await onSuccess?.();
    } catch (err) {
      console.error('Error al actualizar inventario tras asignar huésped:', err);
    }
  }, [onSuccess]);

  if (!room || !isAvailableRoom) return null;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs">
          <Loader label="Abriendo formulario de asignación…" />
        </div>
      }
    >
      <LazyAsignarHuespedModalFormulario
        isOpen
        presentation="drawer"
        room={room}
        onClose={onClose}
        onSuccess={() => {
          void handleSuccess();
        }}
      />
    </Suspense>
  );
});

export default AsignarHuespedDrawer;
