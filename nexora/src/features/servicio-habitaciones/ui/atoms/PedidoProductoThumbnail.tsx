import { memo, useCallback } from 'react';
import { Skeleton } from '../../../../shared/loading/atoms/Skeleton';
import { useBalancedProductImage } from '../../application/use-balanced-product-image';

export interface PedidoProductoThumbnailProps {
  primaryUrl: string;
  alt: string;
  fallbackUrl: string;
  maxDimension?: number;
}

/**
 * Átomo: Miniatura optimizada de producto para tarjetas de detalle de pedido.
 * Renderiza la imagen ya decodificada sin transiciones CSS de opacidad en GPU.
 */
export const PedidoProductoThumbnail = memo(function PedidoProductoThumbnail({
  primaryUrl,
  alt,
  fallbackUrl,
  maxDimension = 160,
}: PedidoProductoThumbnailProps) {
  const { activeSrc, isImageReady, handleImageError } =
    useBalancedProductImage(primaryUrl, fallbackUrl, maxDimension);

  const onImageError = useCallback(() => {
    try {
      handleImageError();
    } catch (error) {
      console.error('Error handling product thumbnail fallback:', error);
    }
  }, [handleImageError]);

  return (
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
          alt={alt}
          onError={onImageError}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      )}
    </>
  );
});
