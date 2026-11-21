import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBowlFood, faClock, faStopwatch } from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '../../../../shared/loading'
import { useBalancedProductImage } from '../../application/use-balanced-product-image'
import { formatearMonedaCOP, type ItemMenuProducto } from '../../domain/item-menu'
import { ProductoDisponibilidadBadge } from '../atoms/ProductoDisponibilidadBadge'

export interface CategoriaProductoFilaItemProps {
  producto: ItemMenuProducto
  index?: number
}

const FALLBACK_PRODUCT_IMG =
  'https://images.pexels.com/photos/6823326/pexels-photo-6823326.jpeg?auto=compress&cs=tinysrgb&w=400'

/**
 * Molécula: Tarjeta fila optimizada para un producto vinculado a una categoría.
 * Usa `React.memo`, downscaling a 160 px (`useBalancedProductImage`), `decoding="async"`,
 * y `<Skeleton animation="none" />` en lugar de overlays blur o animaciones infinitas.
 */
export const CategoriaProductoFilaItem = memo(function CategoriaProductoFilaItem({
  producto,
}: CategoriaProductoFilaItemProps) {
  const primaryUrl = (producto.imageURL || producto.image_url || '').trim()
  const tieneImagenPropia = Boolean(primaryUrl)
  const { activeSrc, isImageReady, handleImageError } = useBalancedProductImage(
    primaryUrl,
    FALLBACK_PRODUCT_IMG,
    160,
  )

  const isVegetarian = Boolean(producto.isVegetarian ?? producto.is_vegetarian)
  const isVegan = Boolean(producto.isVegan ?? producto.is_vegan)
  const tieneHorario = Boolean(producto.start_time && producto.end_time)

  return (
    <div
      role="listitem"
      className="border-line bg-canvas/70 hover:border-primary/40 hover:bg-canvas flex flex-col gap-3 rounded-2xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <div className="border-line bg-primary/10 text-primary relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border">
          {tieneImagenPropia ? (
            <>
              {!isImageReady && (
                <Skeleton
                  variant="rectangular"
                  animation="none"
                  className="absolute inset-0 size-full"
                />
              )}

              {activeSrc && (
                <img
                  src={activeSrc}
                  alt={producto.name}
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                  className={`size-full object-cover transition-opacity duration-200 ${
                    isImageReady ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </>
          ) : (
            <FontAwesomeIcon icon={faBowlFood} className="size-5" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-ink truncate text-sm font-bold">{producto.name}</h4>
          </div>

          {producto.description && (
            <p className="text-ink-muted line-clamp-2 text-xs leading-relaxed">
              {producto.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
            <ProductoDisponibilidadBadge
              available={producto.available ?? true}
              isVegetarian={isVegetarian}
              isVegan={isVegan}
            />

            {typeof producto.prep_time === 'number' && producto.prep_time > 0 && (
              <span className="text-ink-muted inline-flex items-center gap-1 text-[11px]">
                <FontAwesomeIcon icon={faStopwatch} className="text-primary size-3" />
                <span>{producto.prep_time} min</span>
              </span>
            )}

            {tieneHorario && (
              <span className="text-ink-muted inline-flex items-center gap-1 text-[11px]">
                <FontAwesomeIcon icon={faClock} className="text-primary size-3" />
                <span>
                  {producto.start_time} – {producto.end_time}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-line/60 flex shrink-0 items-center justify-between gap-3 border-t pt-2.5 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
        <span className="text-primary font-mono text-sm font-black">
          {formatearMonedaCOP(Number(producto.price) || 0)}
        </span>
        {typeof producto.tax_percentage === 'number' && producto.tax_percentage > 0 && (
          <span className="text-ink-muted text-[10px] font-medium">
            IVA {producto.tax_percentage}%
          </span>
        )}
      </div>
    </div>
  )
})
