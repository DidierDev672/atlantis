import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMinus,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
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

export interface ItemMenuProductoCardProps {
  producto: ItemMenuProducto
  index?: number
  onVerDetalle?: (producto: ItemMenuProducto) => void
}

// Relaciones de aspecto variadas para generar el ritmo asimétrico tipo Pinterest / Masonry
const ASPECT_RATIOS = [
  'aspect-[4/5]',
  'aspect-[3/4]',
  'aspect-[1/1]',
  'aspect-[4/3]',
  'aspect-[16/11]',
]

const FALLBACK_FOOD_IMAGE =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'

export function ItemMenuProductoCard({
  producto,
  index = 0,
  onVerDetalle,
}: ItemMenuProductoCardProps) {
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
      fallbackUrl: FALLBACK_FOOD_IMAGE,
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
  const isImageReady =
    cachedReady || loadedState?.sourceKey === primaryUrl
  const activeSrc = cachedReady
    ? primaryUrl
    : loadedState?.sourceKey === primaryUrl
      ? loadedState.resolvedUrl
      : null

  const isVegetariano = Boolean(producto.isVegetarian ?? producto.is_vegetarian)
  const isVegano = Boolean(producto.isVegan ?? producto.is_vegan)
  const isDisponible = producto.available !== false

  const productoKey = obtenerProductoKey(producto)
  const cantidadEnCarrito = useCarritoStore(
    (s) =>
      s.items.find((item) => obtenerProductoKey(item.producto) === productoKey)
        ?.cantidad ?? 0
  )
  const agregarProducto = useCarritoStore((s) => s.agregarProducto)
  const incrementarCantidad = useCarritoStore((s) => s.incrementarCantidad)
  const decrementarCantidad = useCarritoStore((s) => s.decrementarCantidad)

  // Asignar dinámicamente relación de aspecto según el índice para un Waterfall Layout orgánico
  const aspectClass = ASPECT_RATIOS[index % ASPECT_RATIOS.length]

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
      className={`group relative overflow-hidden rounded-3xl border border-line bg-panel shadow-xs transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer select-none ${aspectClass}`}
    >
      {/* Loader del balanceador de cargas de imagen (/shared/loading) */}
      <Loading
        visible={!isImageReady}
        variant="overlay"
        size="sm"
        label="Cargando imagen…"
        delay={0}
        minDuration={250}
      />

      {/* 1. Visualización base: Exclusivamente la fotografía pública del producto */}
      {activeSrc && (
        <img
          src={activeSrc}
          alt={producto.name}
          onError={() => {
            if (activeSrc !== FALLBACK_FOOD_IMAGE) {
              setLoadedState({
                sourceKey: primaryUrl,
                resolvedUrl: FALLBACK_FOOD_IMAGE,
              })
            }
          }}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}

      {/* Sombra sutil permanente en el borde inferior para resaltar el volumen de la tarjeta */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-0"
      />

      {/* 2. Efecto HOVER: Capa de información completa requerida con glassmorphism */}
      <div className="absolute inset-0 flex flex-col justify-between gap-2 overflow-y-auto bg-linear-to-t from-black/95 via-black/75 to-black/30 p-4 text-white opacity-0 backdrop-blur-xs transition-all duration-300 ease-in-out group-hover:opacity-100 group-focus-within:opacity-100">
        {/* Franja Superior del Hover: Estados, Preferencias Dietéticas y Botón de Carrito arriba a la derecha */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Disponibilidad */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${
                isDisponible
                  ? 'border border-emerald-400/40 bg-emerald-500/25 text-emerald-200'
                  : 'border border-rose-400/40 bg-rose-500/25 text-rose-200'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isDisponible ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              {isDisponible ? 'Disponible' : 'Agotado'}
            </span>

            {/* Badges Dietéticos: Vegetariano / Vegano */}
            {isVegetariano && (
              <span
                title="Apto para vegetarianos"
                className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-950/60 px-2 py-0.5 text-[10px] font-semibold text-green-300 backdrop-blur-md"
              >
                🌱 Vegetariano
              </span>
            )}
            {isVegano && (
              <span
                title="Apto para veganos"
                className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md"
              >
                🌿 Vegano
              </span>
            )}
          </div>

          {/* Acciones rápidas de Carrito arriba a la derecha */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="ml-auto shrink-0"
          >
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
                className="bg-primary hover:bg-primary/90 inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-white shadow-lg ring-1 ring-white/25 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} className="size-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 p-1 shadow-lg backdrop-blur-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    decrementarCantidad(productoKey)
                  }}
                  aria-label={`Descontar una unidad de ${producto.name}`}
                  title="Descontar cantidad"
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition-all hover:bg-rose-500/85 active:scale-95"
                >
                  <FontAwesomeIcon icon={faMinus} className="size-3" />
                </button>

                <span
                  aria-label={`${cantidadEnCarrito} unidades en el carrito`}
                  className="min-w-5 text-center text-xs font-extrabold tracking-tight text-white"
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
                  aria-label={`Aumentar una unidad de ${producto.name}`}
                  title="Aumentar cantidad"
                  className="bg-primary hover:bg-primary/90 inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-white shadow-xs transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPlus} className="size-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Franja Inferior del Hover: Datos del Platillo, Tiempos, Impuestos y Precio */}
        <div className="space-y-1.5">
          {/* Horarios disponibles */}
          {(producto.start_time || producto.end_time) && (
            <div className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md">
              <span>⏰ Horario:</span>
              <span className="font-semibold">
                {producto.start_time || '00:00'} - {producto.end_time || '23:59'}
              </span>
            </div>
          )}

          {/* Nombre comercial */}
          <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug text-white drop-shadow-sm">
            {producto.name}
          </h3>

          {/* Descripción de notas gastronómicas */}
          {producto.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-zinc-200">
              {producto.description}
            </p>
          )}

          {/* Fila de metadatos: Tiempo de preparación + Porcentaje de impuesto */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-zinc-300">
            {producto.prep_time !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5">
                ⏱️ {producto.prep_time} min
              </span>
            )}

            {producto.tax_percentage !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5">
                IVA {producto.tax_percentage}%
              </span>
            )}
          </div>

          {/* Precio formateado en Moneda Colombiana (COP) */}
          <div className="border-t border-white/15 pt-2 flex items-baseline justify-between">
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-300">
                Precio al huésped
              </span>
              <span className="text-[10px] text-white/70">
                Ver detalle completo ↗
              </span>
            </div>
            <span className="font-sans text-xl sm:text-2xl font-black tracking-tight text-emerald-300 drop-shadow-sm">
              {formatearMonedaCOP(producto.price)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
