import { Suspense, lazy, memo, useCallback, useMemo, useState } from 'react';
import { type Variants } from 'motion/react';
import { staggerItem } from '../../../../design-tokens/motion';
import { catalogApi } from '../../../../shared/catalog';
import { mapStayToRecepcion } from '../../domain/recepcion-floor';
import { type StayItem } from '../../domain/stay';

const LazyRecepcionCard = lazy(() => import('./recepcion-card'));
const LazyHuespedDetalleModal = lazy(() =>
  import('./huesped-detalle-modal').then((m) => ({
    default: m.HuespedDetalleModal,
  }))
);
const LazyRoomDetailModal = lazy(() => import('./room-detail-modal'));

export interface RecepcionStayCardProps {
  stay: StayItem;
  preResolvedRoomNumber?: string;
  onClick?: (stay: StayItem) => void;
  variants?: Variants;
}

/**
 * Adaptador memoizado que reutiliza datos ya cacheados en `catalogApi` / tabla
 * y carga de forma perezosa tarjeta y modales evitando doble petición en móviles.
 */
export const RecepcionStayCard = memo(function RecepcionStayCard({
  stay,
  preResolvedRoomNumber,
  onClick,
  variants,
}: RecepcionStayCardProps) {
  const [inspectPersonId, setInspectPersonId] = useState<string | null>(null);
  const [inspectRoomId, setInspectRoomId] = useState<string | null>(null);

  const recepcion = useMemo(() => {
    const cachedRoom = catalogApi.getCachedRoom(stay.room_id);
    const resolvedNumber =
      preResolvedRoomNumber ||
      (cachedRoom?.number ? String(cachedRoom.number) : '');

    if (cachedRoom || resolvedNumber) {
      return mapStayToRecepcion(stay, {
        number: resolvedNumber || '—',
        floor: cachedRoom?.floor || 1,
        status:
          cachedRoom?.status ||
          (stay.status === 'progress' ? 'occupied' : 'available'),
        roomTypeName: 'Estándar',
      });
    }

    return mapStayToRecepcion(stay);
  }, [preResolvedRoomNumber, stay]);

  const handleOpenRoom = useCallback((roomId: string) => {
    try {
      setInspectRoomId(roomId);
    } catch (err) {
      console.error('Error al abrir detalle de habitación:', err);
    }
  }, []);

  const handleSelectGuest = useCallback((personId: string) => {
    try {
      setInspectPersonId(personId);
    } catch (err) {
      console.error('Error al abrir ficha de huésped:', err);
    }
  }, []);

  const handleAction = useCallback(() => {
    try {
      onClick?.(stay);
    } catch (err) {
      console.error('Error al abrir detalle de estancia:', err);
    }
  }, [onClick, stay]);

  return (
    <>
      <Suspense
        fallback={
          <div className="border-line bg-panel h-80 w-full animate-pulse rounded-2xl border p-5" />
        }
      >
        <LazyRecepcionCard
          recepcion={recepcion}
          variants={variants ?? staggerItem}
          onOpenHabitacion={handleOpenRoom}
          onSelectGuest={handleSelectGuest}
          onViewDetail={handleAction}
          onCheckIn={handleAction}
        />
      </Suspense>

      {inspectPersonId && (
        <Suspense fallback={null}>
          <LazyHuespedDetalleModal
            personId={inspectPersonId}
            onClose={() => setInspectPersonId(null)}
          />
        </Suspense>
      )}

      {inspectRoomId && (
        <Suspense fallback={null}>
          <LazyRoomDetailModal
            roomId={inspectRoomId}
            onClose={() => setInspectRoomId(null)}
          />
        </Suspense>
      )}
    </>
  );
});

export default RecepcionStayCard;
