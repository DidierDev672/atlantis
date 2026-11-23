import { Suspense, lazy, memo, useCallback, useState } from 'react';
import { Drawer } from '../../../../shared/ui/Drawer';
import { useGuestNames } from '../../application/use-guest-names';
import { useRoomNumber } from '../../application/use-room-numbers';
import type { StayItem } from '../../domain/stay';
import { RecepcionStayDrawerFooter } from '../molecules/recepcion-stay-drawer-footer';
import { RecepcionStayDrawerHeader } from '../molecules/recepcion-stay-drawer-header';

const LazyDrawerContent = lazy(
  () => import('../molecules/recepcion-stay-detail-drawer-content')
);

const LazyRoomDetailModal = lazy(
  () => import('../molecules/room-detail-modal')
);

export interface RecepcionStayDetailDrawerProps {
  stay: StayItem | null;
  isOpen?: boolean;
  onClose: () => void;
  onPrintReceipt?: (stay: StayItem) => Promise<void> | void;
  onViewRoomHistory?: (roomId: string) => void;
}

/**
 * Organismo: Drawer lateral (30% del ancho de pantalla en escritorio)
 * rediseñado con Atomic Design, carga perezosa y manejo de errores try/catch.
 */
export const RecepcionStayDetailDrawer = memo(
  function RecepcionStayDetailDrawer({
    stay,
    isOpen,
    onClose,
    onPrintReceipt,
    onViewRoomHistory,
  }: RecepcionStayDetailDrawerProps) {
    const isDrawerOpen = isOpen !== undefined ? isOpen : Boolean(stay);
    const [inspectRoomId, setInspectRoomId] = useState<string | null>(null);
    const [printing, setPrinting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const guestNames = useGuestNames(stay ? stay.person_ids : []);
    const roomNumber = useRoomNumber(stay?.room_id);

    const handleClose = useCallback(() => {
      try {
        setInspectRoomId(null);
        setFeedbackMessage(null);
        onClose();
      } catch (err) {
        console.error('Error al cerrar drawer de detalle:', err);
      }
    }, [onClose]);

    const handlePrintReceipt = useCallback(async () => {
      if (!stay || printing) return;
      setPrinting(true);
      setFeedbackMessage(null);
      try {
        if (onPrintReceipt) {
          await onPrintReceipt(stay);
        } else if (typeof window !== 'undefined' && typeof window.print === 'function') {
          window.print();
        }
        setFeedbackMessage(
          'Comprobante listo. Puedes guardarlo o enviarlo a tu impresora.'
        );
      } catch (err) {
        console.error('Error al generar comprobante de recepción:', err);
        setFeedbackMessage(
          'No pudimos abrir la impresión en este momento. Intenta de nuevo en unos segundos.'
        );
      } finally {
        setPrinting(false);
      }
    }, [onPrintReceipt, printing, stay]);

    const handleViewRoomHistory = useCallback(() => {
      try {
        if (!stay?.room_id) return;
        if (onViewRoomHistory) {
          onViewRoomHistory(stay.room_id);
          return;
        }
        setInspectRoomId(stay.room_id);
      } catch (err) {
        console.error('Error al abrir historial de la habitación:', err);
      }
    }, [onViewRoomHistory, stay?.room_id]);

    return (
      <>
        <Drawer
          isOpen={isDrawerOpen && Boolean(stay)}
          onClose={handleClose}
          position="right"
          size="full"
          showCloseButton={false}
          className="sm:w-[50vw] lg:w-[30vw] min-w-[320px]"
          footer={
            stay ? (
              <RecepcionStayDrawerFooter
                printing={printing}
                onPrintReceipt={() => void handlePrintReceipt()}
                onViewRoomHistory={handleViewRoomHistory}
              />
            ) : undefined
          }
        >
          {stay && (
            <div className="space-y-1">
              <RecepcionStayDrawerHeader
                roomNumber={roomNumber}
                status={stay.status}
                onClose={handleClose}
              />

              <Suspense
                fallback={
                  <div className="space-y-3 pt-4">
                    <div className="bg-line/35 h-14 w-full animate-pulse rounded-xl" />
                    <div className="bg-line/35 h-20 w-full animate-pulse rounded-xl" />
                    <div className="bg-line/35 h-20 w-full animate-pulse rounded-xl" />
                  </div>
                }
              >
                <LazyDrawerContent
                  stay={stay}
                  guestNames={guestNames}
                  feedbackMessage={feedbackMessage}
                />
              </Suspense>
            </div>
          )}
        </Drawer>

        <Suspense fallback={null}>
          <LazyRoomDetailModal
            roomId={inspectRoomId}
            onClose={() => setInspectRoomId(null)}
          />
        </Suspense>
      </>
    );
  }
);

export default RecepcionStayDetailDrawer;
