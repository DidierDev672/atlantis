import { memo } from 'react'
import { Skeleton } from '../../../../shared/loading/atoms/Skeleton'

const SKELETON_ROWS = [0, 1, 2, 3] as const

/**
 * Molécula: Marcador de posición ligero para el `Suspense` de `LazyPedidosHistorialTabla`,
 * evitando el parpadeo en blanco durante la descarga inicial del chunk.
 */
export const PedidosTablaSkeleton = memo(function PedidosTablaSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando tabla de historial de ventas"
      className="space-y-3"
    >
      {/* Skeleton en cards para móvil, tablet e iPad (< xl) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:hidden">
        {SKELETON_ROWS.map((row) => (
          <div
            key={row}
            className="border-line bg-panel space-y-3 rounded-3xl border p-4 shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton variant="rounded" animation="none" className="h-8 w-40" />
              <Skeleton variant="rounded" animation="none" className="h-6 w-20" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Skeleton variant="rounded" animation="none" className="h-7 w-28" />
              <Skeleton variant="rounded" animation="none" className="h-5 w-28" />
            </div>
            <Skeleton variant="rounded" animation="none" className="h-8 w-full" />
          </div>
        ))}
      </div>

      {/* Skeleton tabular para escritorio (>= xl) */}
      <div className="border-line bg-panel hidden overflow-hidden rounded-3xl border p-5 shadow-xs xl:block">
        <div className="space-y-3">
          {SKELETON_ROWS.map((row) => (
            <div
              key={row}
              className="border-line/60 flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <Skeleton variant="rounded" animation="none" className="h-8 w-40" />
              <Skeleton variant="rounded" animation="none" className="h-7 w-28" />
              <Skeleton variant="rounded" animation="none" className="h-6 w-32" />
              <Skeleton variant="rounded" animation="none" className="h-6 w-24" />
              <Skeleton variant="rounded" animation="none" className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
