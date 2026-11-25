import { Suspense, lazy, memo, useCallback, useEffect, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { fadeIn } from '../../../../design-tokens/motion';
import {
  CatalogStatusBadge,
  catalogApi,
  formatFriendlyRoomTypeName,
} from '../../../../shared/catalog';
import { RandomPlanet } from '../../../../shared/planets';
import { type Recepcion } from '../../domain/recepcion';
import { RecepcionStatusGradientBorder } from '../atoms/recepcion-status-gradient-border';
import { RecepcionTemporalBadge } from '../atoms/recepcion-temporal-badge';
import { RecepcionCardPaymentProgress } from './recepcion-card-payment-progress';
import { RecepcionCardStayDates } from './recepcion-card-stay-dates';

const LazyGuestsAccordion = lazy(
  () => import('./recepcion-card-guests-accordion')
);

export interface RecepcionCardProps {
  recepcion: Recepcion;
  variants?: Variants;
  onOpenSede?: (sedeId: string) => void;
  onOpenHabitacion?: (roomId: string, camaId?: string) => void;
  onCheckIn?: (recepcion: Recepcion) => Promise<void> | void;
  onViewDetail?: (recepcion: Recepcion) => Promise<void> | void;
  onSelectGuest?: (guestId: string) => void;
}

interface RoomResolvedInfo {
  number: string;
  typeName: string;
  status: string;
}

function shouldShowCheckInAction(
  recepcion: Recepcion,
  roomStatus?: string
): boolean {
  const normEstado = String(recepcion.estado || '').toLowerCase().trim();
  const normRoom = String(roomStatus || '').toLowerCase().trim();

  if (
    normEstado === 'pendiente' ||
    normEstado === 'pending' ||
    normEstado === 'reservada' ||
    normEstado === 'reserved'
  ) {
    return true;
  }

  return (
    normRoom === 'reserved' &&
    normEstado !== 'progreso' &&
    normEstado !== 'finalizada' &&
    normEstado !== 'cancelada'
  );
}

function formatRoomNumberOnly(value?: string | null): string {
  try {
    if (!value) return '—';
    const cleaned = value.replace(/^\s*habitaci[oó]n\s*/i, '').trim();
    return cleaned || '—';
  } catch (err) {
    console.error('Error al formatear número de habitación:', err);
    return '—';
  }
}

/**
 * Molécula rediseñada: Tarjeta operativa de recepción con arquitectura Atomic Design,
 * carga perezosa (async/await + React.lazy + React.memo), iconos FontAwesome y manejo try/catch.
 */
export const RecepcionCard = memo(function RecepcionCard({
  recepcion,
  variants,
  onOpenHabitacion,
  onCheckIn,
  onViewDetail,
  onSelectGuest,
}: RecepcionCardProps) {
  const roomId = recepcion.habitacion?.id || recepcion.roomId;

  const [roomInfo, setRoomInfo] = useState<RoomResolvedInfo>(() => ({
    number: formatRoomNumberOnly(
      recepcion.habitacion?.number ||
        recepcion.habitacion?.name ||
        recepcion.roomLabel
    ),
    typeName: recepcion.cama?.tipoNombre || 'Estándar',
    status: recepcion.habitacion?.status || recepcion.estado || 'occupied',
  }));
  const [actionLoading, setActionLoading] = useState(false);

  const hasPreResolvedRoom = Boolean(
    recepcion.habitacion?.number &&
      recepcion.habitacion.number !== '—' &&
      recepcion.cama?.tipoNombre
  );

  useEffect(() => {
    if (!roomId || hasPreResolvedRoom) return;
    let active = true;

    const loadRoomDetails = async () => {
      try {
        const roomRes = await catalogApi.getRoom(roomId);
        if (!active || !roomRes.data) return;

        const roomData = roomRes.data;
        let resolvedType = recepcion.cama?.tipoNombre || 'Estándar';

        if (roomData.room_types_id) {
          try {
            const typeRes = await catalogApi.getRoomType(
              roomData.room_types_id
            );
            if (active && typeRes.data?.name) {
              resolvedType = formatFriendlyRoomTypeName(typeRes.data.name);
            } else {
              resolvedType = formatFriendlyRoomTypeName(roomData.room_types_id);
            }
          } catch {
            resolvedType = formatFriendlyRoomTypeName(roomData.room_types_id);
          }
        }

        if (!active) return;
        setRoomInfo({
          number: formatRoomNumberOnly(
            roomData.number
              ? String(roomData.number)
              : recepcion.habitacion?.name || recepcion.roomLabel
          ),
          typeName: resolvedType,
          status: roomData.status || recepcion.habitacion?.status || 'occupied',
        });
      } catch (err) {
        console.error('Error al cargar detalle de habitación en tarjeta:', err);
      }
    };

    void loadRoomDetails();

    return () => {
      active = false;
    };
  }, [
    hasPreResolvedRoom,
    recepcion.cama?.tipoNombre,
    recepcion.habitacion?.name,
    recepcion.habitacion?.status,
    recepcion.roomLabel,
    roomId,
  ]);

  const isCheckIn = shouldShowCheckInAction(recepcion, roomInfo.status);

  const handleRoomHeaderClick = useCallback(() => {
    try {
      if (!roomId) return;
      onOpenHabitacion?.(roomId, recepcion.cama?.id);
    } catch (err) {
      console.error('Error al inspeccionar habitación:', err);
    }
  }, [onOpenHabitacion, recepcion.cama?.id, roomId]);

  const handlePrimaryAction = useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (isCheckIn && onCheckIn) {
        await onCheckIn(recepcion);
      } else if (onViewDetail) {
        await onViewDetail(recepcion);
      } else if (roomId) {
        onOpenHabitacion?.(roomId, recepcion.cama?.id);
      }
    } catch (err) {
      console.error('Error al ejecutar acción de recepción:', err);
    } finally {
      setActionLoading(false);
    }
  }, [
    actionLoading,
    isCheckIn,
    onCheckIn,
    onOpenHabitacion,
    onViewDetail,
    recepcion,
    roomId,
  ]);

  return (
    <motion.article
      variants={variants ?? fadeIn}
      initial="hidden"
      animate="visible"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('[role="button"]') ||
          target.closest('input')
        ) {
          return;
        }
        void handlePrimaryAction();
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md"
    >
      <RecepcionStatusGradientBorder status={roomInfo.status}>
        {/* Cabecera: Planeta + Número/Tipo de habitación (Izquierda) y Badges (Derecha) */}
        <div className="border-line/60 flex items-start justify-between gap-3 border-b pb-3.5">
          <button
            type="button"
            onClick={handleRoomHeaderClick}
            className="hover:bg-primary/5 focus-visible:ring-primary/40 -m-1.5 flex min-w-0 cursor-pointer items-center gap-3 rounded-xl p-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            title="Inspeccionar habitación"
          >
            <span className="bg-primary/10 border-primary/20 grid size-11 shrink-0 place-items-center rounded-xl border shadow-2xs">
              <RandomPlanet
                size={28}
                seed={roomId || recepcion.id}
                animated={false}
                interactive={false}
              />
            </span>

            <div className="min-w-0">
              <h3 className="text-ink group-hover:text-primary truncate text-sm font-extrabold tracking-tight transition-colors sm:text-base">
                {roomInfo.number}
              </h3>
              <p className="text-ink-muted truncate text-xs font-medium">
                {roomInfo.typeName}
              </p>
            </div>
          </button>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <RecepcionTemporalBadge
              checkIn={recepcion.checkIn}
              checkOut={recepcion.checkOut}
            />
            <CatalogStatusBadge status={roomInfo.status} />
          </div>
        </div>

        {/* Cuerpo modular */}
        <div className="space-y-3">
          <Suspense
            fallback={
              <div className="bg-line/20 h-10 w-full rounded-xl" />
            }
          >
            <LazyGuestsAccordion
              primaryGuest={recepcion.huesped}
              guestLabel={recepcion.guestLabel}
              personIds={recepcion.person_ids}
              onSelectGuest={onSelectGuest}
            />
          </Suspense>

          <RecepcionCardStayDates
            checkIn={recepcion.checkIn}
            checkOut={recepcion.checkOut}
            noches={recepcion.noches}
          />

          <RecepcionCardPaymentProgress
            metodoPago={recepcion.metodoPagoLabel || recepcion.metodoPago}
            depositoGarantia={recepcion.depositoGarantia}
          />
        </div>

        {/* Pie: Acción principal (Hacer check-in o Ver detalle) */}
        <div className="border-line/60 border-t pt-3">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handlePrimaryAction()}
            className={`focus-visible:ring-primary/40 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xs transition-all focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60 ${
              isCheckIn
                ? 'bg-primary text-white hover:opacity-90'
                : 'border-line bg-canvas text-ink hover:border-primary/40 hover:bg-primary/5 hover:text-primary border'
            }`}
          >
            <FontAwesomeIcon
              icon={isCheckIn ? faRightToBracket : faEye}
              className="size-3.5"
              aria-hidden="true"
            />
            <span>
              {actionLoading
                ? 'Procesando…'
                : isCheckIn
                  ? 'Hacer check-in'
                  : 'Ver detalle'}
            </span>
          </button>
        </div>
      </RecepcionStatusGradientBorder>
    </motion.article>
  );
});

export default RecepcionCard;
