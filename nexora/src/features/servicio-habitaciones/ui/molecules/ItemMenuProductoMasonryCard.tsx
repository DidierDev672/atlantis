import { Suspense, lazy, memo, useCallback, useState, type ComponentType } from 'react'
import {
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
  resolverImagenProducto,
} from '../../domain/item-menu'
import {
  obtenerProductoKey,
  useCarritoStore,
} from '../../application/carrito-store'
import { useCategoriaServicio } from '../../application/use-categoria-servicio'
import { useBalancedProductImage } from '../../application/use-balanced-product-image'
import { Skeleton } from '../../../../shared/loading'
import type { ItemMenuProductoMasonryOverlayProps } from './ItemMenuProductoMasonryOverlay'

const LazyItemMenuProductoMasonryOverlay = lazy<
  ComponentType<ItemMenuProductoMasonryOverlayProps>
>(async () => {
  try {
    const mod = await import('./ItemMenuProductoMasonryOverlay')
    return { default: mod.ItemMenuProductoMasonryOverlay }
  } catch (error) {
    console.error('Error cargando overlay de tarjeta Masonry:', error)
    return { default: () => null }
  }
})

export interface ItemMenuProductoMasonryCardProps {
  producto: ItemMenuProducto
  index?: number
  categoriaInfo?: CategoriaVinculadaInfo | null
  onVerDetalle?: (producto: ItemMenuProducto) => void
  onEditar?: (producto: ItemMenuProducto) => void
}

/**
 * Molécula: Tarjeta visual en modo Masonry para productos del menú.
 * En reposo renderiza únicamente la fotografía optimizada (<=640px) y carga el overlay
 * de acciones de forma perezosa solo al hacer hover, focus o touch.
 */
export const ItemMenuProductoMasonryCard = memo(
  function ItemMenuProductoMasonryCard({
    producto,
    index = 0,
    categoriaInfo,
    onVerDetalle,
    onEditar,
  }: ItemMenuProductoMasonryCardProps) {
    const [isOverlayMounted, setIsOverlayMounted] = useState(false)

    const { categoriaServicio } = useCategoriaServicio(
      categoriaInfo ? undefined : producto.category_id
    )
    const categoriaVinculada = categoriaInfo ?? categoriaServicio
    const isDisponible = producto.available !== false
    const primaryUrl = resolverImagenProducto(producto)

    const { activeSrc, isImageReady, handleImageError } =
      useBalancedProductImage(primaryUrl)

    const productoKey = obtenerProductoKey(producto)
    const cantidadEnCarrito = useCarritoStore(
      (s) =>
        s.items.find((item) => obtenerProductoKey(item.producto) === productoKey)
          ?.cantidad ?? 0
    )
    const agregarProducto = useCarritoStore((s) => s.agregarProducto)
    const incrementarCantidad = useCarritoStore((s) => s.incrementarCantidad)
    const decrementarCantidad = useCarritoStore((s) => s.decrementarCantidad)

    const ratioVariant = index % 3
    const aspectClass =
      ratioVariant === 0
        ? 'aspect-3/4'
        : ratioVariant === 1
          ? 'aspect-4/3'
          : 'aspect-square'

    const handleAgregar = useCallback(() => {
      agregarProducto(producto, 1)
    }, [agregarProducto, producto])

    const handleIncrementar = useCallback(() => {
      incrementarCantidad(productoKey)
    }, [incrementarCantidad, productoKey])

    const handleDecrementar = useCallback(() => {
      decrementarCantidad(productoKey)
    }, [decrementarCantidad, productoKey])

    return (
      <article
        data-id={producto.id}
        data-category-id={producto.category_id}
        role="button"
        tabIndex={0}
        onMouseEnter={() => setIsOverlayMounted(true)}
        onMouseLeave={() => setIsOverlayMounted(false)}
        onFocus={() => setIsOverlayMounted(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsOverlayMounted(false)
          }
        }}
        onTouchStart={() => setIsOverlayMounted(true)}
        onClick={() => onVerDetalle?.(producto)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onVerDetalle?.(producto)
          }
        }}
        className={`group border-line/80 bg-panel relative w-full ${aspectClass} cursor-pointer overflow-hidden rounded-3xl border shadow-xs transition-[border-color,box-shadow] duration-200 select-none hover:border-primary/60 hover:shadow-lg`}
      >
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
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        )}

        {isOverlayMounted && (
          <Suspense fallback={null}>
            <LazyItemMenuProductoMasonryOverlay
              producto={producto}
              categoriaVinculada={categoriaVinculada}
              isDisponible={isDisponible}
              cantidadEnCarrito={cantidadEnCarrito}
              onEditar={onEditar}
              onAgregar={handleAgregar}
              onIncrementar={handleIncrementar}
              onDecrementar={handleDecrementar}
            />
          </Suspense>
        )}
      </article>
    )
  }
)

export default ItemMenuProductoMasonryCard
