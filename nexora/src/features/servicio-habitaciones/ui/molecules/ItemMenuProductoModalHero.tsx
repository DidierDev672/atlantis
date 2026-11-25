import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faLeaf,
  faSeedling,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '../../../../shared/loading'
import { useBalancedProductImage } from '../../application/use-balanced-product-image'

export interface ItemMenuProductoModalHeroProps {
  name: string
  primaryUrl: string
  isDisponible: boolean
  isVegetariano: boolean
  isVegano: boolean
  onClose: () => void
}

/**
 * Molécula: Cabecera multimedia del modal de detalle de producto.
 * Carga imagen balanceada (`useBalancedProductImage`) con `loading="lazy"` y `decoding="async"`,
 * sin capas `backdrop-blur-md` apiladas sobre la fotografía.
 */
export const ItemMenuProductoModalHero = memo(
  function ItemMenuProductoModalHero({
    name,
    primaryUrl,
    isDisponible,
    isVegetariano,
    isVegano,
    onClose,
  }: ItemMenuProductoModalHeroProps) {
    const { activeSrc, isImageReady, handleImageError } =
      useBalancedProductImage(primaryUrl, undefined, 768)

    return (
      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-black/10 sm:aspect-16/9">
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
            alt={name}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            className={`size-full object-cover transition-opacity duration-200 ${
              isImageReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/30"
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full border border-white/25 bg-black/75 text-white shadow-md transition-colors hover:bg-black/90"
          title="Cerrar ventana de detalle"
          aria-label="Cerrar detalle del producto"
        >
          <FontAwesomeIcon icon={faXmark} className="size-4" />
        </button>

        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pr-12">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase ${
              isDisponible
                ? 'border border-emerald-400/45 bg-emerald-950/85 text-emerald-100'
                : 'border border-rose-400/45 bg-rose-950/85 text-rose-100'
            }`}
          >
            <FontAwesomeIcon
              icon={isDisponible ? faCircleCheck : faCircleXmark}
              className={`size-3 ${isDisponible ? 'text-emerald-300' : 'text-rose-300'}`}
            />
            <span>
              {isDisponible
                ? 'Disponible para Room Service'
                : 'Temporalmente Agotado'}
            </span>
          </span>

          {isVegetariano && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/45 bg-green-950/85 px-2.5 py-1 text-xs font-semibold text-green-200">
              <FontAwesomeIcon icon={faLeaf} className="size-3 text-green-400" />
              <span>Vegetariano</span>
            </span>
          )}

          {isVegano && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/45 bg-emerald-950/85 px-2.5 py-1 text-xs font-semibold text-emerald-200">
              <FontAwesomeIcon
                icon={faSeedling}
                className="size-3 text-emerald-400"
              />
              <span>Vegano</span>
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-3xl">
            {name}
          </h2>
        </div>
      </div>
    )
  },
)
