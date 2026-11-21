import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { resolveCategoryBadgeVisual } from '../../domain/service-request-status'

export interface PedidoCategoriaEstadoBadgeProps {
  categoriaNombre: string
  estado?: string | null
}

/**
 * Átomo: Insignia de categoría para la tabla de historial de ventas.
 * Muestra un ícono FontAwesome representativo y el nombre de la categoría con el color
 * correspondiente a cada uno de los 10 estados del servicio.
 */
export const PedidoCategoriaEstadoBadge = memo(
  function PedidoCategoriaEstadoBadge({
    categoriaNombre,
    estado,
  }: PedidoCategoriaEstadoBadgeProps) {
    const visual = resolveCategoryBadgeVisual(estado)
    const displayCategory = categoriaNombre?.trim() || 'Room Service'

    return (
      <span
        title={visual.title ?? displayCategory}
        className={`inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${visual.containerClass}`}
      >
        <FontAwesomeIcon
          icon={visual.icon}
          className={`size-3 shrink-0 ${visual.textClass}`}
          aria-hidden="true"
        />
        <span className={`truncate ${visual.textClass}`}>
          {displayCategory}
        </span>
        {visual.srSuffix && (
          <span className="sr-only">{visual.srSuffix}</span>
        )}
      </span>
    )
  },
)
