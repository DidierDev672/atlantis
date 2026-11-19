import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'
import type { CategoriaVinculadaInfo } from '../../domain/item-menu'

const FALLBACK_CATEGORY_IMG =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=400'

export interface CategoriaVinculadaBadgeProps {
  categoria: CategoriaVinculadaInfo
  variant?: 'card' | 'overlay'
}

export function CategoriaVinculadaBadge({
  categoria,
  variant = 'card',
}: CategoriaVinculadaBadgeProps) {
  if (variant === 'overlay') {
    return (
      <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/55 px-2 py-1">
        <span className="size-5 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/10">
          {categoria.asset ? (
            <img
              src={categoria.asset}
              alt={categoria.name}
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget
                if (img.src !== FALLBACK_CATEGORY_IMG) {
                  img.src = FALLBACK_CATEGORY_IMG
                }
              }}
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center text-white/80">
              <FontAwesomeIcon icon={faUtensils} className="size-2.5" />
            </span>
          )}
        </span>
        <span className="truncate text-[11px] font-semibold text-white/95">
          {categoria.name}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line/70 bg-canvas/70 p-2">
      <div className="relative size-8 shrink-0 overflow-hidden rounded-xl border border-line/60 bg-panel">
        {categoria.asset ? (
          <img
            src={categoria.asset}
            alt={categoria.name}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget
              if (img.src !== FALLBACK_CATEGORY_IMG) {
                img.src = FALLBACK_CATEGORY_IMG
              }
            }}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-primary/70">
            <FontAwesomeIcon icon={faUtensils} className="size-3.5" />
          </div>
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-xs font-bold text-ink">
        {categoria.name}
      </p>
    </div>
  )
}
