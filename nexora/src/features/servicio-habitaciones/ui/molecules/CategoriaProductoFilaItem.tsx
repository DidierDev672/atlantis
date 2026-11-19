import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBowlFood, faClock, faStopwatch } from '@fortawesome/free-solid-svg-icons'
import { Loading } from '../../../../shared/loading'
import { formatearMonedaCOP, type ItemMenuProducto } from '../../domain/item-menu'
import {
  getCachedImageUrl,
  isImageCached,
  loadBalancedImage,
} from '../../infrastructure/image-load-balancer'
import { ProductoDisponibilidadBadge } from '../atoms/ProductoDisponibilidadBadge'

export interface CategoriaProductoFilaItemProps {
  producto: ItemMenuProducto
  index?: number
}

const FALLBACK_PRODUCT_IMG =
  'https://images.pexels.com/photos/6823326/pexels-photo-6823326.jpeg?auto=compress&cs=tinysrgb&w=400'

/**
 * Molécula: Tarjeta fila que presenta la información esencial de un producto
 * vinculado a una categoría, con balanceo de carga de imagen y `/shared/loading`.
 */
export function CategoriaProductoFilaItem({
  producto,
  index = 0,
}: CategoriaProductoFilaItemProps) {
  const primaryUrl = producto.imageURL || producto.image_url || ''
  const [loadedState, setLoadedState] = useState<{
    sourceKey: string
    resolvedUrl: string
  } | null>(() =>
    primaryUrl && isImageCached(primaryUrl)
      ? { sourceKey: primaryUrl, resolvedUrl: primaryUrl }
      : null
  )
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!primaryUrl || isImageCached(primaryUrl)) return

    let active = true
    void loadBalancedImage(primaryUrl, {
      fallbackUrl: FALLBACK_PRODUCT_IMG,
    }).then((result) => {
      if (!active) return
      setLoadedState({
        sourceKey: primaryUrl,
        resolvedUrl: result.resolvedUrl,
      })
      setImgError(false)
    })

    return () => {
      active = false
    }
  }, [primaryUrl])

  const cachedReady = Boolean(primaryUrl) && isImageCached(primaryUrl)
  const isImageReady = !primaryUrl || cachedReady || loadedState?.sourceKey === primaryUrl
  const activeSrc = !primaryUrl
    ? null
    : cachedReady
      ? (getCachedImageUrl(primaryUrl) ?? primaryUrl)
      : loadedState?.sourceKey === primaryUrl
        ? loadedState.resolvedUrl
        : null

  const isVegetarian = Boolean(producto.isVegetarian ?? producto.is_vegetarian)
  const isVegan = Boolean(producto.isVegan ?? producto.is_vegan)
  const tieneHorario = Boolean(producto.start_time && producto.end_time)

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.25) }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/70 p-3.5 transition-colors hover:border-primary/40 hover:bg-canvas sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-primary/10 text-primary">
          <Loading
            visible={!isImageReady}
            variant="overlay"
            size="sm"
            delay={0}
            minDuration={250}
          />

          {activeSrc && !imgError ? (
            <img
              src={activeSrc}
              alt={producto.name}
              onError={() => {
                if (activeSrc !== FALLBACK_PRODUCT_IMG) {
                  setLoadedState({
                    sourceKey: primaryUrl,
                    resolvedUrl: FALLBACK_PRODUCT_IMG,
                  })
                } else {
                  setImgError(true)
                }
              }}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            isImageReady && <FontAwesomeIcon icon={faBowlFood} className="size-5" />
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-bold text-ink">
              {producto.name}
            </h4>
          </div>

          {producto.description && (
            <p className="line-clamp-2 text-xs text-ink-muted leading-relaxed">
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
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                <FontAwesomeIcon icon={faStopwatch} className="size-3 text-primary" />
                <span>{producto.prep_time} min</span>
              </span>
            )}

            {tieneHorario && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                <FontAwesomeIcon icon={faClock} className="size-3 text-primary" />
                <span>
                  {producto.start_time} – {producto.end_time}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line/60 pt-2.5 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
        <span className="font-mono text-sm font-black text-primary">
          {formatearMonedaCOP(Number(producto.price) || 0)}
        </span>
        {typeof producto.tax_percentage === 'number' &&
          producto.tax_percentage > 0 && (
            <span className="text-[10px] font-medium text-ink-muted">
              IVA {producto.tax_percentage}%
            </span>
          )}
      </div>
    </motion.li>
  )
}
