import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faEye } from '@fortawesome/free-solid-svg-icons'
import type { PedidoComandaIndexado } from '../../application/use-pedidos-servicio-habitacion'
import { PedidoCategoriaEstadoBadge } from '../atoms/PedidoCategoriaEstadoBadge'
import { PedidoGuestInitialsAvatar } from '../atoms/PedidoGuestInitialsAvatar'

export interface PedidoTablaMobileCardProps {
  pedido: PedidoComandaIndexado
  onVerDetalle: (ordenKey: string) => void
}

/**
 * Molécula: Tarjeta responsiva para pantallas pequeñas (`< md`) del historial de ventas.
 * Presenta iniciales y nombre del huésped, categoría con su color/ícono, fecha de venta,
 * precio a pagar y acceso directo al detalle del pedido.
 */
export const PedidoTablaMobileCard = memo(function PedidoTablaMobileCard({
  pedido,
  onVerDetalle,
}: PedidoTablaMobileCardProps) {
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

  const handleOpenDetail = useCallback(() => {
    try {
      onVerDetalle(ordenKey)
    } catch (error) {
      console.error('Error al abrir detalle del pedido desde tarjeta:', error)
    }
  }, [onVerDetalle, ordenKey])

  const handleButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      handleOpenDetail()
    },
    [handleOpenDetail],
  )

  return (
    <article
      onClick={handleOpenDetail}
      className="border-line bg-panel hover:border-primary/40 cursor-pointer space-y-3 rounded-3xl border p-4 font-sans shadow-xs transition-colors"
    >
      {/* Cabecera: Huésped (iniciales + nombre) y Precio a pagar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <PedidoGuestInitialsAvatar huespedNombre={huespedNombre} />
          <div className="min-w-0">
            <span className="text-ink-muted block text-[10px] font-semibold tracking-wider uppercase">
              Huésped
            </span>
            <p className="text-ink truncate text-sm font-semibold">
              {huespedNombre}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-ink-muted block text-[10px] font-semibold tracking-wider uppercase">
            Precio a pagar
          </span>
          <span className="text-ink text-sm font-bold tabular-nums">
            {precioFormateado}
          </span>
        </div>
      </div>

      {/* Categoría y Fecha de venta */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PedidoCategoriaEstadoBadge
          categoriaNombre={categoriaNombre}
          estado={resolvedStatus}
        />

        <span className="text-ink-muted inline-flex items-center gap-1.5 text-xs whitespace-nowrap tabular-nums">
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="text-primary/70 size-3 shrink-0"
            aria-hidden="true"
          />
          <time dateTime={fechaVentaClave ?? undefined}>{fechaVentaTexto}</time>
        </span>
      </div>

      {/* Acción de detalle */}
      <div className="border-line/70 flex justify-end border-t pt-2.5">
        <button
          type="button"
          onClick={handleButtonClick}
          aria-label={`Ver detalle del pedido de ${huespedNombre}`}
          className="border-line bg-canvas text-ink hover:border-primary hover:bg-primary inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold shadow-2xs transition-colors hover:text-white active:scale-[0.99]"
        >
          <FontAwesomeIcon icon={faEye} className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Ver detalle</span>
        </button>
      </div>
    </article>
  )
})
