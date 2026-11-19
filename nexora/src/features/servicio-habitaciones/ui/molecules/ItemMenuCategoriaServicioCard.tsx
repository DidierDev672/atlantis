import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'
import { Loading } from '../../../../shared/loading'
import {
  getCachedImageUrl,
  isImageCached,
  loadBalancedImage,
} from '../../infrastructure/image-load-balancer'

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
 * Molécula Atomic Design: Visualiza la categoría (imagen y nombre)
 * a la que pertenece el producto gastronómico dentro del modal de detalle.
 */
export function ItemMenuCategoriaServicioCard({
  categoriaServicio,
  loadingCategoria,
  categoryId,
}: ItemMenuCategoriaServicioCardProps) {
  const primaryUrl = categoriaServicio?.asset || FALLBACK_CATEGORY_ASSET
  const [loadedState, setLoadedState] = useState<{
    sourceKey: string
    resolvedUrl: string
  } | null>(() =>
    categoriaServicio && isImageCached(primaryUrl)
      ? { sourceKey: primaryUrl, resolvedUrl: primaryUrl }
      : null
  )

  useEffect(() => {
    if (!categoriaServicio || isImageCached(primaryUrl)) return

    let active = true
    void loadBalancedImage(primaryUrl, {
      fallbackUrl: FALLBACK_CATEGORY_ASSET,
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
  }, [categoriaServicio, primaryUrl])

  const cachedReady = Boolean(categoriaServicio) && isImageCached(primaryUrl)
  const isImageReady = cachedReady || loadedState?.sourceKey === primaryUrl
  const activeSrc = cachedReady
    ? (getCachedImageUrl(primaryUrl) ?? primaryUrl)
    : loadedState?.sourceKey === primaryUrl
      ? loadedState.resolvedUrl
      : null

  return (
    <div className="space-y-3 pt-4 border-t border-line/60">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
          <FontAwesomeIcon icon={faUtensils} className="size-3 text-primary" />
          <span>Categoría del Producto</span>
        </h4>
        {loadingCategoria && (
          <Loading
            visible={true}
            variant="inline"
            size="sm"
            label="Consultando categoría…"
            delay={0}
            minDuration={250}
            className="py-0"
          />
        )}
      </div>

      {loadingCategoria ? (
        <div className="flex items-center justify-center rounded-2xl border border-line bg-canvas/40 p-5">
          <Loading
            visible={true}
            variant="inline"
            size="sm"
            label="Cargando categoría vinculada…"
            delay={0}
            minDuration={250}
          />
        </div>
      ) : categoriaServicio ? (
        <div
          data-category-id={categoryId}
          className="flex items-center gap-4 rounded-2xl border border-line bg-canvas/70 p-3.5 sm:p-4 shadow-2xs transition-all hover:bg-canvas"
        >
          <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-2xl border border-line bg-black/10">
            <Loading
              visible={!isImageReady}
              variant="overlay"
              size="sm"
              delay={0}
              minDuration={250}
            />
            {activeSrc && (
              <img
                src={activeSrc}
                alt={categoriaServicio.name}
                className="size-full object-cover"
                onError={() => {
                  if (activeSrc !== FALLBACK_CATEGORY_ASSET) {
                    setLoadedState({
                      sourceKey: primaryUrl,
                      resolvedUrl: FALLBACK_CATEGORY_ASSET,
                    })
                  }
                }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Categoría vinculada
            </span>
            <h5 className="mt-1 font-serif text-base sm:text-lg font-bold text-ink truncate">
              {categoriaServicio.name}
            </h5>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Categoría gastronómica asignada para pedidos a la habitación.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line/60 bg-canvas/40 p-3.5 text-xs text-ink-muted">
          <span>Información de la categoría no disponible para este producto.</span>
        </div>
      )}
    </div>
  )
}
