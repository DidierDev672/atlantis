import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faEye } from '@fortawesome/free-solid-svg-icons'
import type { PedidoComandaIndexado } from '../../application/use-pedidos-servicio-habitacion'
import { PedidoCategoriaEstadoBadge } from '../atoms/PedidoCategoriaEstadoBadge'
import { PedidoGuestInitialsAvatar } from '../atoms/PedidoGuestInitialsAvatar'

export interface PedidoTablaRowProps {
  pedido: PedidoComandaIndexado
  onVerDetalle: (ordenKey: string) => void
}

/**
 * Molécula: Fila tabular memoizada del historial de ventas/comandas.
 * Muestra estrictamente: Huésped (solo nombre), Categoría, Precio a pagar y Detalle.
 */
export const PedidoTablaRow = memo(function PedidoTablaRow({
  pedido,
  onVerDetalle,
}: PedidoTablaRowProps) {
  const {
    ordenKey,
    huespedNombre,
    categoriaNombre,
    precioFormateado,
    fechaVentaTexto,
    fechaVentaClave,
    estadoNormalizado,
    isDelivered,
    orden,
  } = pedido

  const resolvedStatus =
    orden?.status?.trim() ||
    estadoNormalizado ||
    (isDelivered ? 'delivered' : null)

  const handleVerDetalleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      try {
        onVerDetalle(ordenKey)
      } catch (error) {
        console.error('Error al abrir detalle del pedido:', error)
      }
    },
    [onVerDetalle, ordenKey],
  )

  const handleRowClick = useCallback(() => {
    try {
      onVerDetalle(ordenKey)
    } catch (error) {
      console.error('Error al seleccionar fila del pedido:', error)
    }
  }, [onVerDetalle, ordenKey])

  return (
    <tr
      onClick={handleRowClick}
      className="group hover:bg-canvas/70 cursor-pointer transition-colors"
    >
      {/* 1. Huésped (iniciales + nombre del huésped) */}
      <td className="px-5 py-3.5 align-middle sm:px-6">
        <div className="flex items-center gap-2.5">
          <PedidoGuestInitialsAvatar huespedNombre={huespedNombre} />
          <span className="text-ink truncate text-sm font-semibold">
            {huespedNombre}
          </span>
        </div>
      </td>

      {/* 2. Categoría */}
      <td className="px-4 py-3.5 align-middle">
        <PedidoCategoriaEstadoBadge
          categoriaNombre={categoriaNombre}
          estado={resolvedStatus}
        />
      </td>

      {/* 3. Fecha de venta */}
      <td className="px-4 py-3.5 align-middle">
        <span className="text-ink-muted inline-flex items-center gap-1.5 font-sans text-xs whitespace-nowrap tabular-nums">
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="text-primary/70 size-3 shrink-0"
            aria-hidden="true"
          />
          <time dateTime={fechaVentaClave ?? undefined}>{fechaVentaTexto}</time>
        </span>
      </td>

      {/* 4. Precio a pagar */}
      <td className="px-4 py-3.5 text-right align-middle">
        <span className="text-ink font-sans text-sm font-bold tabular-nums">
          {precioFormateado}
        </span>
      </td>

      {/* 4. Detalle */}
      <td className="px-5 py-3.5 text-right align-middle sm:px-6">
        <button
          type="button"
          onClick={handleVerDetalleClick}
          aria-label={`Ver detalle del pedido de ${huespedNombre}`}
          title="Ver detalle completo del pedido"
          className="border-line bg-canvas text-ink hover:border-primary hover:bg-primary inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors hover:text-white active:scale-95"
        >
          <FontAwesomeIcon icon={faEye} className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Ver detalle</span>
        </button>
      </td>
    </tr>
  )
})
