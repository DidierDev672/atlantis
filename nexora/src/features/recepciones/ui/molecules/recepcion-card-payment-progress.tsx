import { memo, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuildingColumns,
  faCreditCard,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import {
  formatPrecioCOP,
  normalizeMetodoPago,
  type RecepcionMetodoPago,
} from '../../domain/recepcion';

export interface RecepcionCardPaymentProgressProps {
  metodoPago: string;
  depositoGarantia: number;
}

const PAYMENT_CHANNELS: ReadonlyArray<{
  key: RecepcionMetodoPago;
  label: string;
  icon: typeof faMoneyBillWave;
  barClass: string;
  activeTextClass: string;
}> = [
  {
    key: 'efectivo',
    label: 'Efectivo',
    icon: faMoneyBillWave,
    barClass: 'bg-emerald-500',
    activeTextClass: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'tarjeta',
    label: 'Tarjeta',
    icon: faCreditCard,
    barClass: 'bg-indigo-500',
    activeTextClass: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    key: 'transferencia',
    label: 'Transferencia',
    icon: faBuildingColumns,
    barClass: 'bg-violet-500',
    activeTextClass: 'text-violet-700 dark:text-violet-300',
  },
];

/**
 * Molécula: Barra de progreso segmentada por método de pago (Efectivo / Tarjeta / Transferencia)
 * con visualización del depósito o monto respaldado.
 */
export const RecepcionCardPaymentProgress = memo(
  function RecepcionCardPaymentProgress({
    metodoPago,
    depositoGarantia,
  }: RecepcionCardPaymentProgressProps) {
    const { activeKey, formattedAmount } = useMemo(() => {
      try {
        return {
          activeKey: normalizeMetodoPago(metodoPago),
          formattedAmount: formatPrecioCOP(depositoGarantia),
        };
      } catch (err) {
        console.error('Error al formatear método de pago:', err);
        return {
          activeKey: 'efectivo' as RecepcionMetodoPago,
          formattedAmount: '$ 0',
        };
      }
    }, [depositoGarantia, metodoPago]);

    const activeChannel =
      PAYMENT_CHANNELS.find((c) => c.key === activeKey) ?? PAYMENT_CHANNELS[0];

    return (
      <div className="border-line/70 bg-canvas/40 space-y-2 rounded-xl border p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-muted inline-flex items-center gap-1.5 text-[11px] font-semibold">
            <FontAwesomeIcon
              icon={activeChannel.icon}
              className={`size-3 ${activeChannel.activeTextClass}`}
              aria-hidden="true"
            />
            <span>Método de pago: {activeChannel.label}</span>
          </span>
          <span className="text-ink text-xs font-extrabold">
            {formattedAmount}
          </span>
        </div>

        {/* Barra de progreso segmentada por los 3 métodos */}
        <div
          role="progressbar"
          aria-label={`Método de pago activo: ${activeChannel.label}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={100}
          className="grid grid-cols-3 gap-1.5"
        >
          {PAYMENT_CHANNELS.map((channel) => {
            const isActive = channel.key === activeKey;
            return (
              <div key={channel.key} className="space-y-1">
                <div className="bg-line/50 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isActive ? `${channel.barClass} w-full` : 'w-0'
                    }`}
                  />
                </div>
                <div
                  className={`flex items-center justify-center gap-1 text-[10px] font-semibold ${
                    isActive ? channel.activeTextClass : 'text-ink-muted/65'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={channel.icon}
                    className="size-2.5"
                    aria-hidden="true"
                  />
                  <span className="truncate">{channel.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default RecepcionCardPaymentProgress;
