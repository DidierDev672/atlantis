import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import {
  type ItemMenuProducto,
  formatearMonedaCOP,
  resolverImagenProducto,
} from '../../domain/item-menu'
import {
  obtenerProductoKey,
  useCarritoStore,
} from '../../application/carrito-store'
import {
  isImageCached,
  loadBalancedImage,
} from '../../infrastructure/image-load-balancer'
import { Loading } from '../../../../shared/loading'

export interface ItemMenuProductoMasonryCardProps {
  producto: ItemMenuProducto
  index?: number
  onVerDetalle?: (producto: ItemMenuProducto) => void
}

const FALLBACK_PRODUCT_IMG =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'

/**
 * Molécula: Tarjeta visual en modo Masonry para productos del menú.
 * En reposo muestra únicamente la fotografía del producto; al hacer hover
 * despliega Nombre, Descripción, Precio y Botón para agregar al carrito.
 */
export function ItemMenuProductoMasonryCard({
  producto,
  index = 0,
  onVerDetalle,
}: ItemMenuProductoMasonryCardProps) {
  const isDisponible = producto.available !== false
  const primaryUrl = resolverImagenProducto(producto)

  const [loadedState, setLoadedState] = useState<{
    sourceKey: string
    resolvedUrl: string
  } | null>(() =>
    isImageCached(primaryUrl)
      ? { sourceKey: primaryUrl, resolvedUrl: primaryUrl }
      : null
  )

  useEffect(() => {
    if (isImageCached(primaryUrl)) return

    let active = true
    void loadBalancedImage(primaryUrl, {
      fallbackUrl: FALLBACK_PRODUCT_IMG,
    }).then((result) => {
      if (!active) return
      setLoadedState({
        sourceKey: primaryUrl,
        resolvedUrl: result.resolvedUrl,
      })
    })

    return () => {
      active = false
    }
  }, [primaryUrl])

  const cachedReady = isImageCached(primaryUrl)
  const isImageReady = cachedReady || loadedState?.sourceKey === primaryUrl
  const activeSrc = cachedReady
    ? primaryUrl
    : loadedState?.sourceKey === primaryUrl
      ? loadedState.resolvedUrl
      : null

  const productoKey = obtenerProductoKey(producto)
  const cantidadEnCarrito = useCarritoStore(
    (s) =>
      s.items.find((item) => obtenerProductoKey(item.producto) === productoKey)
        ?.cantidad ?? 0
  )
  const agregarProducto = useCarritoStore((s) => s.agregarProducto)
  const incrementarCantidad = useCarritoStore((s) => s.incrementarCantidad)
  const decrementarCantidad = useCarritoStore((s) => s.decrementarCantidad)

  // Proporciones alternadas estilo Masonry / cascada
  const ratioVariant = index % 3
  const aspectClass =
    ratioVariant === 0
      ? 'aspect-3/4'
      : ratioVariant === 1
        ? 'aspect-4/3'
        : 'aspect-square'

  return (
    <article
      data-id={producto.id}
      data-category-id={producto.category_id}
      role="button"
      tabIndex={0}
      onClick={() => onVerDetalle?.(producto)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onVerDetalle?.(producto)
        }
      }}
      className={`group border-line/80 bg-panel relative w-full ${aspectClass} cursor-pointer overflow-hidden rounded-3xl border shadow-xs transition-[border-color,box-shadow] duration-300 select-none hover:border-primary/60 hover:shadow-2xl`}
    >
      {/* Loader del balanceador de cargas de imagen */}
      <Loading
        visible={!isImageReady}
        variant="overlay"
        size="sm"
        label="Cargando imagen…"
        delay={0}
        minDuration={250}
      />

      {/* Estado en reposo: únicamente la imagen del producto */}
      {activeSrc && (
        <img
          src={activeSrc}
          alt={producto.name}
          onError={() => {
            if (activeSrc !== FALLBACK_PRODUCT_IMG) {
              setLoadedState({
                sourceKey: primaryUrl,
                resolvedUrl: FALLBACK_PRODUCT_IMG,
              })
            }
          }}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />
      )}

      {/* Overlay en hover: degradado ligero sin backdrop-blur para evitar sobrecarga de GPU */}
      <div className="absolute inset-0 flex flex-col justify-between bg-linear-to-t from-black/95 via-black/70 to-black/45 p-4 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100 sm:p-5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base font-bold leading-snug text-white line-clamp-2 sm:text-lg">
              {producto.name}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/85 line-clamp-3">
              {producto.description?.trim() ||
                'Sin descripción gastronómica registrada.'}
            </p>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {cantidadEnCarrito === 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  agregarProducto(producto, 1)
                }}
                disabled={!isDisponible}
                aria-label={`Agregar ${producto.name} al carrito`}
                title={isDisponible ? 'Agregar al carrito' : 'No disponible'}
                className="bg-primary hover:bg-primary/90 inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} className="size-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1 rounded-full border border-white/25 bg-black/80 p-1 shadow-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    decrementarCantidad(productoKey)
                  }}
                  aria-label={`Disminuir una unidad de ${producto.name}`}
                  title="Disminuir cantidad"
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition-all hover:bg-rose-500 active:scale-95"
                >
                  <FontAwesomeIcon icon={faMinus} className="size-2.5" />
                </button>

                <span
                  aria-label={`${cantidadEnCarrito} unidades en el carrito`}
                  className="min-w-5 text-center text-xs font-black text-white"
                >
                  {cantidadEnCarrito}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    incrementarCantidad(productoKey)
                  }}
                  disabled={!isDisponible}
                  aria-label={`Agregar más de ${producto.name}`}
                  title="Agregar más"
                  className="bg-primary hover:bg-primary/90 inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPlus} className="size-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/20 pt-3">
          <span className="block text-[10px] font-bold tracking-wider text-white/70 uppercase">
            Precio
          </span>
          <span className="font-sans text-lg font-black tracking-tight text-white sm:text-xl">
            {formatearMonedaCOP(producto.price)}
          </span>
        </div>
      </div>
    </article>
  )
}

export default ItemMenuProductoMasonryCard
