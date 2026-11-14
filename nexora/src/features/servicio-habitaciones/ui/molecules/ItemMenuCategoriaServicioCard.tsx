import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'

export interface ItemMenuCategoriaServicioCardProps {
  categoriaServicio: {
    name: string
    asset?: string
  } | null
  loadingCategoria: boolean
  categoryId?: string
}

const FALLBACK_CATEGORY_ASSET =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800'

/**
 * Molécula Atomic Design: Visualiza la categoría o servicio de habitaciones
 * al que pertenece el producto gastronómico dentro del modal de detalle.
 */
export function ItemMenuCategoriaServicioCard({
  categoriaServicio,
  loadingCategoria,
  categoryId,
}: ItemMenuCategoriaServicioCardProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-line/60">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
          <FontAwesomeIcon icon={faUtensils} className="size-3 text-primary" />
          <span>Servicio de Habitaciones al que pertenece</span>
        </h4>
        {loadingCategoria && (
          <span className="text-[11px] text-ink-muted animate-pulse">
            Consultando menú...
          </span>
        )}
      </div>

      {categoriaServicio ? (
        <div
          data-category-id={categoryId}
          className="flex items-center gap-4 rounded-2xl border border-line bg-canvas/70 p-3.5 sm:p-4 shadow-2xs transition-all hover:bg-canvas"
        >
          <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-2xl border border-line bg-black/10">
            <img
              src={categoriaServicio.asset || FALLBACK_CATEGORY_ASSET}
              alt={categoriaServicio.name}
              className="size-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = FALLBACK_CATEGORY_ASSET
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Menú de Carta Activo
            </span>
            <h5 className="mt-1 font-serif text-base sm:text-lg font-bold text-ink truncate">
              {categoriaServicio.name}
            </h5>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Categoría gastronómica asignada para pedidos a la habitación.
            </p>
          </div>
        </div>
      ) : loadingCategoria ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-4 animate-pulse">
          <div className="size-16 rounded-xl bg-ink/10" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-1/4 rounded bg-ink/10" />
            <div className="h-4 w-1/2 rounded bg-ink/10" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line/60 bg-canvas/40 p-3.5 text-xs text-ink-muted">
          <span>Información del servicio gastronómico no disponible para este producto.</span>
        </div>
      )}
    </div>
  )
}
