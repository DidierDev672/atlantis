import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faMoneyBillWave,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import {
  resolveBackendUpdateStatus,
  SERVICE_REQUEST_ALLOWED_STATUSES,
  SERVICE_REQUEST_STATUS_CONFIG,
  type ServiceRequestBackendStatus,
} from '../../domain/service-request-status'

function buildStatusOptions(): ReadonlyArray<DropdownOption> {
  try {
    return SERVICE_REQUEST_ALLOWED_STATUSES.map((statusKey) => {
      const cfg = SERVICE_REQUEST_STATUS_CONFIG[statusKey]
      return {
        value: cfg.value,
        label: cfg.label,
        customContent: (
          <span className="flex items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${cfg.dotColor}`} />
            <FontAwesomeIcon
              icon={cfg.icon}
              className={`size-3 shrink-0 ${cfg.textClass}`}
              aria-hidden="true"
            />
            <span className={`font-sans text-xs font-bold ${cfg.textClass}`}>
              {cfg.label}
            </span>
          </span>
        ),
      }
    })
  } catch (error) {
    console.error('Error building order status options:', error)
    return []
  }
}

const STATUS_OPTIONS: ReadonlyArray<DropdownOption> = buildStatusOptions()

export interface PedidoDetalleModalFooterProps {
  precioFormateado: string
  tip?: number
  estadoActual: string
  isUpdating?: boolean
  onChangeEstado?: (nuevoEstado: ServiceRequestBackendStatus) => void
  onActualizarEstado?: () => void
  onClose: () => void
}

/**
 * Molécula: Footer del modal de detalle del pedido.
 * Visualiza el precio total a pagar del huésped y permite seleccionar y guardar
 * el estado del pedido usando `RecursosDropdown`.
 */
export const PedidoDetalleModalFooter = memo(function PedidoDetalleModalFooter({
  precioFormateado,
  tip = 0,
  estadoActual,
  isUpdating = false,
  onChangeEstado,
  onActualizarEstado,
  onClose,
}: PedidoDetalleModalFooterProps) {
  const normalizedBackendStatus = resolveBackendUpdateStatus(estadoActual)
  const statusConfig = SERVICE_REQUEST_STATUS_CONFIG[normalizedBackendStatus]

  const handleStatusSelect = useCallback(
    (value: string) => {
      try {
        if (!value || !onChangeEstado) return
        onChangeEstado(resolveBackendUpdateStatus(value))
      } catch (error) {
        console.error('Error selecting new order status:', error)
      }
    },
    [onChangeEstado],
  )

  return (
    <footer className="border-line bg-canvas/50 flex flex-col gap-3 rounded-b-3xl border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        {/* Precio total a pagar del huésped */}
        <div>
          <span className="text-ink-muted inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-primary size-3" />
            <span>Precio a pagar</span>
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-ink font-sans text-lg font-black tabular-nums">
              {precioFormateado}
            </span>
            {Number(tip) > 0 && (
              <span className="text-ink-muted text-[11px]">(incluye propina)</span>
            )}
          </div>
        </div>

        {/* Estado actual del pedido con selector en español */}
        <div className="border-line/70 flex flex-col gap-1 border-l pl-4">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted text-[10px] font-bold tracking-wider uppercase">
              Estado del pedido
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-sans text-[10px] font-bold ${statusConfig.categoryContainerClass}`}
            >
              <FontAwesomeIcon
                icon={statusConfig.icon}
                className={`size-2.5 shrink-0 ${statusConfig.textClass}`}
                aria-hidden="true"
              />
              <span className={statusConfig.textClass}>{statusConfig.label}</span>
            </span>
          </div>

          {onChangeEstado && (
            <div className="w-48">
              <RecursosDropdown
                label="Cambiar estado"
                value={normalizedBackendStatus}
                onChange={handleStatusSelect}
                options={STATUS_OPTIONS}
                placeholder="Seleccionar estado…"
                searchable={false}
                direction="up"
                disabled={isUpdating}
                className="text-xs"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onActualizarEstado && (
          <button
            type="button"
            onClick={onActualizarEstado}
            disabled={isUpdating}
            className="border-primary/40 bg-primary/10 text-primary hover:bg-primary inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border px-4 py-2 text-xs font-bold shadow-xs transition-colors hover:text-white disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={faRotateRight}
              spin={isUpdating}
              className="size-3.5"
            />
            <span>{isUpdating ? 'Actualizando…' : 'Guardar estado'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          disabled={isUpdating}
          className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faCheck} className="size-3.5" />
          <span>Cerrar</span>
        </button>
      </div>
    </footer>
  )
})
