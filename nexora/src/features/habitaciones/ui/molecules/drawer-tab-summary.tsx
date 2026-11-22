import { Suspense, lazy, memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCircleCheck,
  faEye,
  faScrewdriverWrench,
  faUserCheck,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import type { DrawerGuestItem } from '../../application/fetch-drawer-stay-guests';
import {
  isHabitacionOcupada,
  matchesHabitacionStatus,
  type RoomRow,
} from '../../domain/habitacion-lista';
import { formatCurrencyCOP } from '../lib/formatters';

const LazyDrawerStayGuestsList = lazy(
  () => import('./drawer-stay-guests-list')
);
const LazyDrawerStayDatesCard = lazy(() => import('./drawer-stay-dates-card'));
const LazyDrawerFolioBalanceCard = lazy(
  () => import('./drawer-folio-balance-card')
);
const LazyDrawerHousekeepingQuickGrid = lazy(
  () => import('./drawer-housekeeping-quick-grid')
);

export interface ActiveStaySummary {
  stayId: string;
  guestName: string;
  guests: DrawerGuestItem[];
  guestsCount: number;
  checkInDate?: string;
  checkOutDate?: string;
  nights: number;
  lodgingTotal: number;
  consumptionsTotal: number;
  securityDeposit: number;
}

export interface DrawerTabSummaryProps {
  room: RoomRow;
  nightlyRate: number;
  staySummary: ActiveStaySummary | null;
  loadingStay: boolean;
  actionLoading: boolean;
  onAssignGuest?: (room: RoomRow) => void;
  onSwitchToConsumptions: () => void;
  onCheckout: () => Promise<void> | void;
  onChangeStatus: (newStatus: string) => Promise<void> | void;
  onOpenFullDetail?: (room: RoomRow) => void;
}

/**
 * Molécula: Pestaña 'Estadía / Resumen' del Drawer Operativo de Habitación.
 */
export const DrawerTabSummary = memo(function DrawerTabSummary({
  room,
  nightlyRate,
  staySummary,
  loadingStay,
  actionLoading,
  onAssignGuest,
  onSwitchToConsumptions,
  onCheckout,
  onChangeStatus,
  onOpenFullDetail,
}: DrawerTabSummaryProps) {
  const isOccupied = isHabitacionOcupada(room.status);
  const isCleaning = matchesHabitacionStatus(room.status, 'cleaning');
  const isMaintenance = matchesHabitacionStatus(room.status, 'maintenance');

  const nights = staySummary?.nights ?? 1;
  const lodgingTotal = staySummary?.lodgingTotal || nightlyRate * nights;
  const consumptionsTotal = staySummary?.consumptionsTotal ?? 0;
  const paidAmount = staySummary?.securityDeposit ?? 0;

  const handleCheckoutClick = useCallback(async () => {
    try {
      await onCheckout();
    } catch (err) {
      console.error('Error al ejecutar check-out:', err);
    }
  }, [onCheckout]);

  if (isOccupied) {
    return (
      <div className="space-y-4">
        <Suspense
          fallback={
            <div className="bg-line/40 h-28 w-full animate-pulse rounded-2xl" />
          }
        >
          <LazyDrawerStayGuestsList
            guests={staySummary?.guests ?? []}
            fallbackGuestName={staySummary?.guestName}
            guestsCount={staySummary?.guestsCount ?? 1}
            nights={nights}
            loading={loadingStay}
          />

          <LazyDrawerStayDatesCard
            checkInDate={staySummary?.checkInDate}
            checkOutDate={staySummary?.checkOutDate}
          />

          <LazyDrawerFolioBalanceCard
            nightlyRate={nightlyRate}
            nights={nights}
            lodgingTotal={lodgingTotal}
            consumptionsTotal={consumptionsTotal}
            paidAmount={paidAmount}
            onCargarConsumo={onSwitchToConsumptions}
          />

          <LazyDrawerHousekeepingQuickGrid
            currentStatus={room.status}
            actionLoading={actionLoading}
            onChangeStatus={onChangeStatus}
          />
        </Suspense>

        <div className="border-line/70 space-y-2 border-t pt-3">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handleCheckoutClick()}
            className="bg-primary w-full cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {actionLoading ? 'Procesando check-out…' : 'Hacer check-out'}
          </button>
          <p className="text-ink-muted text-center text-[11px]">
            Se registra la salida y la habitación pasa a aseo.
          </p>
        </div>
      </div>
    );
  }

  if (isCleaning || isMaintenance) {
    return (
      <div className="space-y-4">
        <div
          className={`rounded-2xl border p-4 text-xs ${
            isCleaning
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            <FontAwesomeIcon
              icon={isCleaning ? faWandMagicSparkles : faScrewdriverWrench}
              className="size-4"
            />
            <span>
              {isCleaning
                ? 'Habitación en proceso de limpieza'
                : 'Habitación bloqueada por mantenimiento'}
            </span>
          </div>
          <p className="mt-1.5 opacity-90">
            {isCleaning
              ? 'Pendiente de limpieza e inspección tras salida de huésped.'
              : 'Fuera de servicio temporalmente hasta completar revisión técnica.'}
          </p>
        </div>

        <Suspense fallback={null}>
          <LazyDrawerHousekeepingQuickGrid
            currentStatus={room.status}
            actionLoading={actionLoading}
            onChangeStatus={onChangeStatus}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center gap-2 font-bold">
          <FontAwesomeIcon
            icon={faCircleCheck}
            className="size-4 text-emerald-600"
          />
          <span>Lista para ingreso (Disponible)</span>
        </div>
        <p className="mt-1 opacity-90">
          Esta habitación se encuentra limpia, inspeccionada y lista para
          asignar un nuevo huésped.
        </p>
      </div>

      <div className="border-line bg-canvas/50 space-y-2 rounded-xl border p-3.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">Categoría / Cama:</span>
          <span className="text-ink font-semibold">{room.bed.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">Edificio:</span>
          <span className="text-ink font-semibold">{room.building.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">Tarifa por noche:</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {nightlyRate > 0 ? formatCurrencyCOP(nightlyRate) : 'Por definir'}
          </span>
        </div>
      </div>

      <Suspense fallback={null}>
        <LazyDrawerHousekeepingQuickGrid
          currentStatus={room.status}
          actionLoading={actionLoading}
          onChangeStatus={onChangeStatus}
        />
      </Suspense>

      <div className="space-y-2.5 pt-1">
        {onAssignGuest && (
          <button
            type="button"
            onClick={() => onAssignGuest(room)}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <FontAwesomeIcon icon={faUserCheck} className="size-3.5" />
            <span>Asignar Huésped (Check-In)</span>
            <FontAwesomeIcon icon={faArrowRight} className="size-3" />
          </button>
        )}

        {onOpenFullDetail && (
          <button
            type="button"
            onClick={() => onOpenFullDetail(room)}
            className="border-line bg-panel text-ink-muted hover:text-ink inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
          >
            <FontAwesomeIcon icon={faEye} className="size-3.5" />
            <span>Ver ficha técnica completa</span>
          </button>
        )}
      </div>
    </div>
  );
});

export default DrawerTabSummary;
