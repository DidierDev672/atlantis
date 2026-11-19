import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'
import type { CategoriaVinculadaInfo } from '../../domain/item-menu'
import { useBalancedProductImage } from '../../application/use-balanced-product-image'

const FALLBACK_CATEGORY_IMG =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=400'

export interface CategoriaVinculadaBadgeProps {
  categoria: CategoriaVinculadaInfo
  variant?: 'card' | 'overlay'
}

const CategoriaVinculadaOverlayBadge = memo(
  function CategoriaVinculadaOverlayBadge({
    categoria,
  }: {
    categoria: CategoriaVinculadaInfo
  }) {
    const hasAsset = Boolean(categoria.asset && categoria.asset.trim().length > 0)
    const { activeSrc, handleImageError } = useBalancedProductImage(
      hasAsset ? categoria.asset!.trim() : '',
      FALLBACK_CATEGORY_IMG,
      96
    )

    return (
      <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/55 px-2 py-1">
        <span className="size-5 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/10">
          {hasAsset && activeSrc ? (
            <img
              src={activeSrc}
              alt={categoria.name}
              width={20}
              height={20}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
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
)

/**
 * Átomo: Etiqueta de categoría vinculada.
 * - `card`: texto limpio sin imagen ni fondo contenedor, ubicado junto al nombre del producto.
 * - `overlay`: pill visual para el overlay de tarjetas Masonry.
 */
export const CategoriaVinculadaBadge = memo(function CategoriaVinculadaBadge({
  categoria,
  variant = 'card',
}: CategoriaVinculadaBadgeProps) {
  if (variant === 'overlay') {
    return <CategoriaVinculadaOverlayBadge categoria={categoria} />
  }

  return (
    <p
      className="text-ink-muted truncate text-xs font-semibold tracking-wide"
      title={categoria.name}
    >
      {categoria.name}
    </p>
  )
})
