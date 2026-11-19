import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import {
  type ItemMenuProducto,
  resolverImagenProducto,
} from '../../domain/item-menu'
import { useBalancedProductImage } from '../../application/use-balanced-product-image'
import { Skeleton } from '../../../../shared/loading'

export interface ProductoImagenHeaderProps {
  producto: ItemMenuProducto
}

/**
 * Átomo visual de cabecera para la card de producto:
 * muestra la fotografía optimizada (<=640px) usando el balanceador de cargas
 * (`image-load-balancer.ts`) y un `Skeleton` ligero CSS sin `backdrop-blur`.
 */
export const ProductoImagenHeader = memo(function ProductoImagenHeader({
  producto,
}: ProductoImagenHeaderProps) {
  const primaryUrl = resolverImagenProducto(producto)
  const { activeSrc, isImageReady, handleImageError } =
    useBalancedProductImage(primaryUrl)

  return (
    <div className="bg-canvas relative h-44 w-full overflow-hidden">
      {!isImageReady && (
        <Skeleton
          variant="rectangular"
          animation="pulse"
          className="absolute inset-0 size-full"
        />
      )}

      {activeSrc && (
        <img
          src={activeSrc}
          alt={producto.name}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      )}

      <span
        title="Ver detalle completo"
        className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-black/65 text-white/95 transition-colors group-hover:bg-primary group-hover:text-white"
      >
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3" />
      </span>
    </div>
  )
})
